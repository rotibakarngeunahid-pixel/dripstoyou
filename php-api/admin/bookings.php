<?php
// GET   /api/admin/bookings.php         — list all bookings
// GET   /api/admin/bookings.php?id=xxx  — single booking with decrypted fields
// PATCH /api/admin/bookings.php?id=xxx  — update status

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin  = requireAuth();
$method = getMethod();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db     = getDb();

// ── GET list ───────────────────────────────────────────────────────────────────
if ($method === 'GET' && !$id) {
    $status = isset($_GET['status']) ? str_clean($_GET['status'], 20) : null;
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));

    $where  = [];
    $params = [];
    $validStatuses = ['BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN'];

    if ($status && in_array($status, $validStatuses, true)) {
        $where[]  = "b.status = ?";
        $params[] = $status;
    }
    if (isset($_GET['date'])) {
        $where[]  = "b.booking_date = ?";
        $params[] = str_clean($_GET['date'], 10);
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $db->prepare(
        "SELECT b.id, b.booking_code, b.customer_name,
                b.customer_phone_last4, b.customer_phone_encrypted,
                b.booking_date, b.booking_time, b.people_count, b.location_type,
                b.status, b.source, b.created_at,
                p.name AS product_name, p.price_label,
                sa.name AS service_area_name
         FROM   bookings b
         JOIN   products p ON p.id = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         $whereClause
         ORDER BY b.created_at DESC
         LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    // Decrypt phone for each booking (admin has right to see full numbers)
    foreach ($bookings as &$b) {
        $decrypted = null;
        if (!empty($b['customer_phone_encrypted'])) {
            try { $decrypted = decryptField($b['customer_phone_encrypted']); } catch (Exception $e) {}
        }
        $b['customer_phone'] = $decrypted ?? ('···' . $b['customer_phone_last4']);
        unset($b['customer_phone_encrypted']);
    }
    unset($b);

    jsonSuccess($bookings);
}

// ── GET single ────────────────────────────────────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare(
        'SELECT b.*,
                p.name AS product_name, p.price_label,
                sa.name AS service_area_name
         FROM   bookings b
         JOIN   products p ON p.id = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         WHERE  b.id = ?
         LIMIT  1'
    );
    $stmt->execute([$id]);
    $booking = $stmt->fetch();
    if (!$booking) jsonError('Booking not found', 404);

    // Decrypt PII
    $booking['phone']   = "···" . $booking['customer_phone_last4'];
    $booking['address'] = '(encrypted)';
    $booking['notes']   = null;

    try { $booking['phone']   = decryptField($booking['customer_phone_encrypted']); } catch (Exception $e) {}
    try { $booking['address'] = decryptField($booking['address_encrypted']); } catch (Exception $e) {}
    if ($booking['notes_encrypted']) {
        try { $booking['notes'] = decryptField($booking['notes_encrypted']); } catch (Exception $e) {}
    }

    // Remove raw encrypted fields from response
    unset($booking['customer_phone_encrypted'], $booking['address_encrypted'], $booking['notes_encrypted']);

    // Status history
    $h = $db->prepare(
        'SELECT sh.old_status, sh.new_status, sh.note, sh.created_at, a.name AS changed_by_name
         FROM   booking_status_history sh
         LEFT JOIN admins a ON a.id = sh.changed_by_admin_id
         WHERE  sh.booking_id = ?
         ORDER  BY sh.created_at DESC'
    );
    $h->execute([$id]);
    $booking['statusHistory'] = $h->fetchAll();

    jsonSuccess($booking);
}

// ── PATCH (update status) ─────────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) jsonError('Booking ID required', 400);

    $body      = getBodyJson();
    $newStatus = str_clean($body['status'] ?? '', 20);
    $note      = isset($body['note']) ? str_clean($body['note'], 500) : null;

    $validStatuses = ['BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN'];
    if (!in_array($newStatus, $validStatuses, true)) {
        jsonError('Status tidak valid', 422);
    }

    $chk = $db->prepare('SELECT id, status FROM bookings WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $booking = $chk->fetch();
    if (!$booking) jsonError('Booking not found', 404);

    $oldStatus = $booking['status'];
    $now       = date('Y-m-d H:i:s');

    $db->prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?')
       ->execute([$newStatus, $now, $id]);

    $db->prepare(
        'INSERT INTO booking_status_history (id, booking_id, old_status, new_status, changed_by_admin_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([generateId(), $id, $oldStatus, $newStatus, $admin['admin_id'], $note, $now]);

    auditLog('UPDATE_BOOKING_STATUS', $admin['admin_id'], 'Booking', $id, [
        'oldStatus' => $oldStatus,
        'newStatus' => $newStatus,
    ]);

    jsonSuccess(['id' => $id, 'status' => $newStatus], 'Status diperbarui');
}

// ── DELETE (hard delete — SUPER_ADMIN only) ───────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) jsonError('Booking ID required', 400);

    if (($admin['role'] ?? '') !== 'SUPER_ADMIN') jsonError('Forbidden', 403);

    $body   = getBodyJson();
    $reason = str_clean($body['reason'] ?? '', 1000);
    if (!$reason) jsonError('Alasan penghapusan wajib diisi', 422);

    // Fetch full booking before delete
    $stmt = $db->prepare(
        'SELECT b.*, p.name AS product_name, p.price_label,
                sa.name AS service_area_name
         FROM   bookings b
         JOIN   products p  ON p.id  = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         WHERE  b.id = ?
         LIMIT  1'
    );
    $stmt->execute([$id]);
    $booking = $stmt->fetch();
    if (!$booking) jsonError('Booking not found', 404);

    $bookingCode = $booking['booking_code'];

    // Build snapshot — decrypt PII so the log is permanently readable
    $snapshot = $booking;
    try { $snapshot['customer_phone_decrypted'] = decryptField($booking['customer_phone_encrypted']); }
    catch (Exception $e) {}
    try { $snapshot['address_decrypted'] = decryptField($booking['address_encrypted']); }
    catch (Exception $e) {}
    if (!empty($booking['notes_encrypted'])) {
        try { $snapshot['notes_decrypted'] = decryptField($booking['notes_encrypted']); }
        catch (Exception $e) {}
    }
    unset($snapshot['customer_phone_encrypted'], $snapshot['address_encrypted'], $snapshot['notes_encrypted']);

    $bookingSnapshot = json_encode($snapshot, JSON_UNESCAPED_UNICODE);
    $ip = getClientIp();

    ensureBookingDeletionLogsTable($db);

    $db->beginTransaction();
    try {
        // 1. Save deletion log FIRST — if this fails the transaction rolls back
        $db->prepare(
            'INSERT INTO booking_deletion_logs
             (id, booking_id, booking_code, booking_snapshot,
              deleted_by_admin_id, deleted_by_admin_name, deleted_by_admin_email,
              reason, ip_address, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        )->execute([
            generateId(), $id, $bookingCode, $bookingSnapshot,
            $admin['admin_id'], $admin['name'], $admin['email'],
            $reason, $ip,
        ]);

        // 2. Delete FK-dependant records first
        $db->prepare('DELETE FROM booking_status_history WHERE booking_id = ?')->execute([$id]);

        // 3. Hard delete the booking
        $db->prepare('DELETE FROM bookings WHERE id = ?')->execute([$id]);

        // 4. Audit log (inside transaction — committed together)
        auditLog('DELETE_BOOKING', $admin['admin_id'], 'Booking', $id, [
            'bookingCode' => $bookingCode,
            'reason'      => $reason,
        ]);

        $db->commit();
        jsonSuccess(['id' => $id, 'bookingCode' => $bookingCode], 'Booking berhasil dihapus');

    } catch (Exception $e) {
        $db->rollBack();
        error_log('[DELETE_BOOKING] ' . $e->getMessage());
        jsonError('Gagal menghapus booking.', 500);
    }
}

jsonError('Method not allowed', 405);

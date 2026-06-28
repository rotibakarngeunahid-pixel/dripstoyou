<?php
// CRM Booking endpoint
//   GET   /php-api/crm/booking.php                 — list (filters: q, status, date_from, date_to, nurse_id, limit, offset)
//   GET   /php-api/crm/booking.php?code=DTY-1042   — detail by display code
//   GET   /php-api/crm/booking.php?id=xxx          — detail by id
//   POST  /php-api/crm/booking.php                 — create booking
//   PATCH /php-api/crm/booking.php?id=xxx          — update crm_status (state machine)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'booking');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$code   = isset($_GET['code']) ? str_clean($_GET['code'], 20) : null;

// ── Detail ──────────────────────────────────────────────────────────────────
if ($method === 'GET' && ($id || $code)) {
    $sql = 'SELECT b.*, p.name AS product_name, p.price_label, p.price_amount,
                   sa.name AS service_area_name,
                   pt.id AS patient_id_join, pt.name AS patient_name, pt.is_repeat AS patient_is_repeat,
                   pt.booking_count AS patient_booking_count,
                   n.id AS nurse_id_join, n.name AS nurse_name
            FROM   bookings b
            JOIN   products p ON p.id = b.product_id
            LEFT JOIN service_areas sa ON sa.id = b.service_area_id
            LEFT JOIN patients pt ON pt.id = b.patient_id
            LEFT JOIN nurses n ON n.id = b.nurse_id
            WHERE  ' . ($id ? 'b.id = ?' : 'b.booking_code_display = ?') . '
            LIMIT 1';
    $stmt = $db->prepare($sql);
    $stmt->execute([$id ?: $code]);
    $b = $stmt->fetch();
    if (!$b) jsonError('Booking tidak ditemukan', 404);

    $bookingId = $b['id'];

    $b['phone']   = crmTryDecrypt($b['customer_phone_encrypted'] ?? null, '···' . ($b['customer_phone_last4'] ?? ''));
    $b['address'] = crmTryDecrypt($b['address_encrypted'] ?? null, null);
    $b['notes']   = crmTryDecrypt($b['notes_encrypted'] ?? null, null);
    unset($b['customer_phone_encrypted'], $b['address_encrypted'], $b['notes_encrypted']);

    $b['patient'] = $b['patient_id_join'] ? [
        'id'            => $b['patient_id_join'],
        'name'          => $b['patient_name'],
        'is_repeat'     => (bool)$b['patient_is_repeat'],
        'booking_count' => (int)$b['patient_booking_count'],
    ] : null;
    $b['nurse'] = $b['nurse_id_join'] ? ['id' => $b['nurse_id_join'], 'name' => $b['nurse_name']] : null;
    unset($b['patient_id_join'], $b['patient_name'], $b['patient_is_repeat'], $b['patient_booking_count'], $b['nurse_id_join'], $b['nurse_name']);

    // Related clinical records (timestamps drive the timeline)
    $sc = $db->prepare('SELECT id, conclusion, submitted_at FROM screenings WHERE booking_id = ? LIMIT 1');
    $sc->execute([$bookingId]);
    $b['screening'] = $sc->fetch() ?: null;

    $cs = $db->prepare('SELECT id, agreed_at FROM consents WHERE booking_id = ? LIMIT 1');
    $cs->execute([$bookingId]);
    $b['consent'] = $cs->fetch() ?: null;

    $tr = $db->prepare('SELECT id, completed_at, patient_condition_after, follow_up_recommendation FROM treatments WHERE booking_id = ? LIMIT 1');
    $tr->execute([$bookingId]);
    $b['treatment'] = $tr->fetch() ?: null;

    // Payment summary
    $pay = $db->prepare("SELECT COALESCE(SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END),0) AS paid,
                                COALESCE(SUM(CASE WHEN status='DP' THEN amount ELSE 0 END),0) AS dp,
                                COUNT(*) AS cnt
                         FROM payments WHERE booking_id = ?");
    $pay->execute([$bookingId]);
    $p = $pay->fetch();
    $b['payment'] = [
        'paid'  => (float)($p['paid'] ?? 0),
        'dp'    => (float)($p['dp'] ?? 0),
        'count' => (int)($p['cnt'] ?? 0),
        'total' => (float)($b['total_fee'] ?? 0),
    ];

    jsonSuccess($b);
}

// ── List ────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));

    $where = [];
    $params = [];

    if (!empty($_GET['q'])) {
        $q = str_clean($_GET['q'], 100);
        $where[] = '(b.booking_code_display LIKE ? OR b.booking_code LIKE ? OR b.customer_name LIKE ? OR b.customer_phone_last4 = ?)';
        $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = preg_replace('/\D/', '', $q);
    }
    if (!empty($_GET['status'])) {
        $where[] = 'b.crm_status = ?';
        $params[] = str_clean($_GET['status'], 30);
    }
    if (!empty($_GET['nurse_id'])) {
        $where[] = 'b.nurse_id = ?';
        $params[] = str_clean($_GET['nurse_id'], 191);
    }
    if (!empty($_GET['date_from'])) { $where[] = 'b.booking_date >= ?'; $params[] = str_clean($_GET['date_from'], 10); }
    if (!empty($_GET['date_to']))   { $where[] = 'b.booking_date <= ?'; $params[] = str_clean($_GET['date_to'], 10); }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) FROM bookings b $whereClause");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare(
        "SELECT b.id, b.booking_code, b.booking_code_display, b.customer_name, b.customer_phone_last4,
                b.booking_date, b.booking_time, b.crm_status, b.total_fee, b.created_at,
                p.name AS product_name,
                sa.name AS service_area_name,
                n.name AS nurse_name,
                (SELECT COALESCE(SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END),0)
                   FROM payments WHERE booking_id = b.id) AS paid_amount
         FROM   bookings b
         JOIN   products p ON p.id = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         LEFT JOIN nurses n ON n.id = b.nurse_id
         $whereClause
         ORDER BY b.booking_date DESC, b.booking_time DESC, b.created_at DESC
         LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    jsonSuccess(['items' => $rows, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

// ── Create ──────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['product_id', 'booking_date', 'booking_time', 'location_type', 'customer_name', 'customer_phone', 'address']);

    $productId = str_clean($body['product_id'], 191);
    $prodStmt  = $db->prepare('SELECT id, price_amount FROM products WHERE id = ? LIMIT 1');
    $prodStmt->execute([$productId]);
    $product = $prodStmt->fetch();
    if (!$product) jsonError('Layanan tidak ditemukan', 422);

    $areaId   = !empty($body['service_area_id']) ? str_clean($body['service_area_id'], 191) : null;
    $visitFee = 0.0;
    if ($areaId) {
        $areaStmt = $db->prepare('SELECT COALESCE(visit_fee_amount, extra_fee_amount, 0) AS fee FROM service_areas WHERE id = ? LIMIT 1');
        $areaStmt->execute([$areaId]);
        $visitFee = (float)($areaStmt->fetchColumn() ?: 0);
    }

    $serviceFee = (float)$product['price_amount'];
    $totalFee   = $serviceFee + $visitFee;

    $name    = str_clean($body['customer_name'], 100);
    $phone   = preg_replace('/\s+/', '', str_clean($body['customer_phone'], 30));
    $last4   = substr(preg_replace('/\D/', '', $phone), -4) ?: '0000';
    $address = str_clean($body['address'], 1000);
    $notes   = !empty($body['notes']) ? str_clean($body['notes'], 1000) : null;
    $people  = max(1, (int)($body['people_count'] ?? 1));
    $locType = str_clean($body['location_type'], 20);

    // Resolve / create patient
    $patientId = !empty($body['patient_id']) ? str_clean($body['patient_id'], 191) : null;
    if ($patientId) {
        $chk = $db->prepare('SELECT id FROM patients WHERE id = ? LIMIT 1');
        $chk->execute([$patientId]);
        if (!$chk->fetch()) $patientId = null;
    }
    $now = date('Y-m-d H:i:s');
    if (!$patientId) {
        $patientId = generateId();
        $db->prepare(
            'INSERT INTO patients (id, name, phone_encrypted, phone_last4, address_encrypted, area_id, booking_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)'
        )->execute([$patientId, $name, encryptField($phone), $last4, encryptField($address), $areaId, $now, $now]);
    }

    $bookingId   = generateId();
    $bookingCode = generateBookingCode();
    $displayCode = crmBookingCodeDisplay($db);

    $db->prepare(
        'INSERT INTO bookings
         (id, booking_code, booking_code_display, product_id, customer_name, customer_phone_encrypted, customer_phone_last4,
          booking_date, booking_time, people_count, location_type, service_area_id, address_encrypted, notes_encrypted,
          status, crm_status, source, patient_id, service_fee, visit_fee, total_fee, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $bookingId, $bookingCode, $displayCode, $productId, $name, encryptField($phone), $last4,
        str_clean($body['booking_date'], 10), str_clean($body['booking_time'], 5), $people, $locType, $areaId,
        encryptField($address), $notes !== null ? encryptField($notes) : null,
        'BARU', 'PENDING', 'MANUAL_ADMIN', $patientId, $serviceFee, $visitFee, $totalFee, $now, $now,
    ]);

    // Bump patient booking count
    $db->prepare('UPDATE patients SET booking_count = booking_count + 1, is_repeat = (booking_count + 1 >= 2), updated_at = ? WHERE id = ?')
       ->execute([$now, $patientId]);

    crmAuditLog($staff, 'BOOKING', 'CREATE', $bookingId, "Buat booking $displayCode");

    jsonSuccess(['id' => $bookingId, 'booking_code_display' => $displayCode], 'Booking dibuat', 201);
}

// ── Update status ─────────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) jsonError('Booking ID wajib diisi', 400);
    $body = getBodyJson();
    $newStatus = str_clean($body['status'] ?? '', 30);
    $note      = !empty($body['note']) ? str_clean($body['note'], 500) : null;

    $valid = array_keys(crmValidTransitions());
    if (!in_array($newStatus, $valid, true)) jsonError('Status tidak valid', 422);

    $chk = $db->prepare('SELECT crm_status, booking_code_display FROM bookings WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $row = $chk->fetch();
    if (!$row) jsonError('Booking tidak ditemukan', 404);

    $from = $row['crm_status'] ?? 'PENDING';
    if ($from !== $newStatus && !crmIsValidTransition($from, $newStatus)) {
        jsonError("Transisi status dari $from ke $newStatus tidak diperbolehkan", 400);
    }

    $now = date('Y-m-d H:i:s');
    $db->prepare('UPDATE bookings SET crm_status = ?, status = ?, updated_at = ? WHERE id = ?')
       ->execute([$newStatus, crmStatusToLegacy($newStatus), $now, $id]);

    crmAuditLog($staff, 'BOOKING', 'STATUS_CHANGE', $id, "{$row['booking_code_display']}: $from → $newStatus" . ($note ? " ($note)" : ''));

    jsonSuccess(['id' => $id, 'crm_status' => $newStatus], 'Status diperbarui');
}

jsonError('Method not allowed', 405);

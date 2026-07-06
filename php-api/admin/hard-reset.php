<?php
// GET  /api/admin/hard-reset.php — hitung jumlah baris tiap kategori (preview).
// POST /api/admin/hard-reset.php — hard reset data terpilih. SUPER_ADMIN only.
// POST wajib: targets (array kategori) + reason + confirmation phrase yang cocok persis.
//
// targets yang didukung:
//   bookings  — hapus semua booking (cascade: booking_status_history, screenings,
//               consents, treatments, payments) + snapshot ke booking_deletion_logs
//               (pola sama seperti bookings-reset.php).
//   patients  — hapus semua data pasien. bookings.patient_id di-SET NULL otomatis
//               lewat FK (bukan RESTRICT), tidak akan gagal walau booking tidak
//               ikut dihapus.
//   nurses    — hapus roster nurse (tabel `nurses`). TIDAK menghapus akun login
//               CRM staff (crm_staff) — hanya data penugasan/roster.
//   content   — hapus semua testimonial & item galeri (konten publik).

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
requireRole($admin, 'SUPER_ADMIN');

$validTargets = ['bookings', 'patients', 'nurses', 'content'];
$db = getDb();

if (getMethod() === 'GET') {
    $counts = [
        'bookings' => (int)$db->query('SELECT COUNT(*) FROM bookings')->fetchColumn(),
        'patients' => tableExists($db, 'patients') ? (int)$db->query('SELECT COUNT(*) FROM patients')->fetchColumn() : 0,
        'nurses'   => tableExists($db, 'nurses') ? (int)$db->query('SELECT COUNT(*) FROM nurses')->fetchColumn() : 0,
        'content'  => (tableExists($db, 'testimonials') ? (int)$db->query('SELECT COUNT(*) FROM testimonials')->fetchColumn() : 0)
                    + (tableExists($db, 'gallery_items') ? (int)$db->query('SELECT COUNT(*) FROM gallery_items')->fetchColumn() : 0),
    ];
    jsonSuccess($counts);
}

requireMethod('POST');

$expectedConfirmation = 'HAPUS DATA TERPILIH';

$body = getBodyJson();
requireFields($body, ['targets', 'reason', 'confirmation']);

$targets = is_array($body['targets'] ?? null) ? array_values(array_unique($body['targets'])) : [];
$targets = array_values(array_intersect($targets, $validTargets));
if (empty($targets)) {
    jsonError('Pilih minimal satu kategori data untuk direset', 422);
}

$reason       = str_clean($body['reason'], 1000);
$confirmation = str_clean($body['confirmation'], 50);

if (mb_strlen($reason) < 5) {
    jsonError('Alasan reset wajib diisi (minimal 5 karakter)', 422);
}
if ($confirmation !== $expectedConfirmation) {
    jsonError('Teks konfirmasi tidak sesuai', 422);
}

$ip  = getClientIp();
$now = date('Y-m-d H:i:s');
$result = [];

$db->beginTransaction();
try {
    if (in_array('bookings', $targets, true)) {
        ensureBookingDeletionLogsTable($db);

        $stmt = $db->query(
            'SELECT b.*, p.name AS product_name, p.price_label, sa.name AS service_area_name
             FROM   bookings b
             JOIN   products p ON p.id = b.product_id
             LEFT JOIN service_areas sa ON sa.id = b.service_area_id'
        );
        $bookings = $stmt->fetchAll();

        if ($bookings) {
            $insertLog = $db->prepare(
                'INSERT INTO booking_deletion_logs
                 (id, booking_id, booking_code, booking_snapshot,
                  deleted_by_admin_id, deleted_by_admin_name, deleted_by_admin_email,
                  reason, ip_address, deleted_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $logReason = '[HARD RESET] ' . $reason;

            $ids = [];
            foreach ($bookings as $b) {
                $snapshot = $b;
                try { $snapshot['customer_phone_decrypted'] = decryptField($b['customer_phone_encrypted']); } catch (Exception $e) {}
                try { $snapshot['address_decrypted'] = decryptField($b['address_encrypted']); } catch (Exception $e) {}
                if (!empty($b['notes_encrypted'])) {
                    try { $snapshot['notes_decrypted'] = decryptField($b['notes_encrypted']); } catch (Exception $e) {}
                }
                unset($snapshot['customer_phone_encrypted'], $snapshot['address_encrypted'], $snapshot['notes_encrypted']);

                $insertLog->execute([
                    generateId(), $b['id'], $b['booking_code'],
                    json_encode($snapshot, JSON_UNESCAPED_UNICODE),
                    $admin['admin_id'], $admin['name'], $admin['email'],
                    $logReason, $ip, $now,
                ]);
                $ids[] = $b['id'];
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $db->prepare("DELETE FROM bookings WHERE id IN ($placeholders)")->execute($ids);
        }

        if (tableExists($db, 'patients')) {
            $db->exec('UPDATE patients SET booking_count = 0, total_spend = 0, is_repeat = 0, updated_at = NOW()');
        }

        $result['bookings'] = count($bookings);
    }

    if (in_array('patients', $targets, true) && tableExists($db, 'patients')) {
        $count = (int)$db->query('SELECT COUNT(*) FROM patients')->fetchColumn();
        $db->exec('DELETE FROM patients');
        $result['patients'] = $count;
    }

    if (in_array('nurses', $targets, true) && tableExists($db, 'nurses')) {
        $count = (int)$db->query('SELECT COUNT(*) FROM nurses')->fetchColumn();
        $db->exec('DELETE FROM nurses');
        $result['nurses'] = $count;
    }

    if (in_array('content', $targets, true)) {
        $contentCount = 0;
        if (tableExists($db, 'testimonials')) {
            $contentCount += (int)$db->query('SELECT COUNT(*) FROM testimonials')->fetchColumn();
            $db->exec('DELETE FROM testimonials');
        }
        if (tableExists($db, 'gallery_items')) {
            $contentCount += (int)$db->query('SELECT COUNT(*) FROM gallery_items')->fetchColumn();
            $db->exec('DELETE FROM gallery_items');
        }
        $result['content'] = $contentCount;
    }

    auditLog('HARD_RESET', $admin['admin_id'], 'System', null, [
        'targets' => $targets,
        'result'  => $result,
        'reason'  => $reason,
    ]);

    $db->commit();
    jsonSuccess($result, 'Reset data berhasil dilakukan');

} catch (Exception $e) {
    $db->rollBack();
    error_log('[HARD_RESET] ' . $e->getMessage());
    jsonError('Gagal melakukan reset data.', 500);
}

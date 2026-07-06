<?php
// POST /api/admin/bookings-reset.php — reset (hard-delete) SEMUA booking.
// SUPER_ADMIN only. Wajib: reason + confirmation phrase yang cocok persis.
//
// Setiap booking disnapshot ke booking_deletion_logs SEBELUM dihapus (sama
// seperti single delete di bookings.php) supaya riwayat tetap bisa diaudit
// lewat tab "Dihapus" yang sudah ada. Tabel anak (booking_status_history,
// screenings, consents, treatments, payments) ikut terhapus otomatis lewat
// FK ON DELETE CASCADE — tidak perlu DELETE manual per tabel.

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
requireRole($admin, 'SUPER_ADMIN');
requireMethod('POST');

$expectedConfirmation = 'HAPUS SEMUA TRANSAKSI';

$body = getBodyJson();
requireFields($body, ['reason', 'confirmation']);

$reason       = str_clean($body['reason'], 1000);
$confirmation = str_clean($body['confirmation'], 50);

if (mb_strlen($reason) < 5) {
    jsonError('Alasan reset wajib diisi (minimal 5 karakter)', 422);
}
if ($confirmation !== $expectedConfirmation) {
    jsonError('Teks konfirmasi tidak sesuai', 422);
}

$db = getDb();
ensureBookingDeletionLogsTable($db);

$stmt = $db->query(
    'SELECT b.*, p.name AS product_name, p.price_label,
            sa.name AS service_area_name
     FROM   bookings b
     JOIN   products p ON p.id = b.product_id
     LEFT JOIN service_areas sa ON sa.id = b.service_area_id'
);
$bookings = $stmt->fetchAll();

if (!$bookings) {
    jsonSuccess(['count' => 0], 'Tidak ada transaksi untuk direset');
}

$ip        = getClientIp();
$now       = date('Y-m-d H:i:s');
$logReason = '[RESET SEMUA TRANSAKSI] ' . $reason;

$db->beginTransaction();
try {
    // 1. Snapshot tiap booking ke log SEBELUM dihapus (decrypt PII supaya
    //    log tetap terbaca permanen, sama seperti alur single-delete).
    $insertLog = $db->prepare(
        'INSERT INTO booking_deletion_logs
         (id, booking_id, booking_code, booking_snapshot,
          deleted_by_admin_id, deleted_by_admin_name, deleted_by_admin_email,
          reason, ip_address, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

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

    // 2. Hard delete semua booking — cascade otomatis membersihkan
    //    booking_status_history, screenings, consents, treatments, payments.
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $db->prepare("DELETE FROM bookings WHERE id IN ($placeholders)")->execute($ids);

    // 3. Reset total ⇒ tidak ada booking tersisa untuk pasien manapun.
    if (tableExists($db, 'patients')) {
        $db->exec('UPDATE patients SET booking_count = 0, total_spend = 0, is_repeat = 0, updated_at = NOW()');
    }

    // 4. Satu audit log ringkasan untuk keseluruhan aksi.
    auditLog('RESET_ALL_BOOKINGS', $admin['admin_id'], 'Booking', null, [
        'count'  => count($ids),
        'reason' => $reason,
    ]);

    $db->commit();
    jsonSuccess(['count' => count($ids)], count($ids) . ' transaksi berhasil direset');

} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('[RESET_ALL_BOOKINGS] ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    jsonError('Gagal mereset transaksi.', 500);
}

<?php
// GET /api/admin/bookings-export.php — export all bookings as CSV
// Rate limited: 3 per 10 minutes per admin

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');

$admin = requireAuth();
// Export berisi PII terdekripsi (no. HP, alamat, catatan) — hanya SUPER_ADMIN.
requireRole($admin, 'SUPER_ADMIN');
$db    = getDb();

// Rate limit: 3 exports per 10 min per admin
$windowStart = date('Y-m-d H:i:s', strtotime('-10 minutes'));
$rl = $db->prepare(
    "SELECT COUNT(*) AS cnt FROM audit_logs
     WHERE action = 'EXPORT_BOOKINGS' AND actor_admin_id = ? AND created_at > ?"
);
$rl->execute([$admin['admin_id'], $windowStart]);
if ((int)$rl->fetch()['cnt'] >= 3) {
    jsonError('Rate limit exceeded. Coba lagi dalam 10 menit.', 429);
}

$stmt = $db->query(
    'SELECT b.booking_code, b.booking_date, b.booking_time, b.customer_name,
            b.customer_phone_encrypted, b.customer_phone_last4,
            p.name AS product_name, p.price_label,
            b.people_count, b.location_type,
            sa.name AS service_area_name,
            b.address_encrypted, b.notes_encrypted,
            b.status, b.source, b.created_at
     FROM   bookings b
     JOIN   products p ON p.id = b.product_id
     LEFT JOIN service_areas sa ON sa.id = b.service_area_id
     ORDER  BY b.created_at DESC'
);
$bookings = $stmt->fetchAll();

auditLog('EXPORT_BOOKINGS', $admin['admin_id'], 'Booking', null, ['count' => count($bookings)]);

// Build CSV — semua sel di-quote, plus guard formula injection untuk Excel
// (nilai yang diawali = + - @ bisa dieksekusi sebagai formula saat dibuka).
$escape = function ($v): string {
    $v = (string)$v;
    if ($v !== '' && in_array($v[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
        $v = "'" . $v;
    }
    return '"' . str_replace('"', '""', $v) . '"';
};

$header = implode(',', [
    'Kode', 'Tanggal', 'Waktu', 'Nama', 'No. HP', 'Treatment', 'Harga',
    'Jml Orang', 'Tipe Lokasi', 'Area', 'Alamat', 'Catatan', 'Status', 'Sumber', 'Dibuat'
]);

$rows = [];
foreach ($bookings as $b) {
    $phone   = "···" . $b['customer_phone_last4'];
    $address = '';
    $notes   = '';

    try { $phone   = decryptField($b['customer_phone_encrypted']); } catch (Exception $e) {}
    try { $address = decryptField($b['address_encrypted']); } catch (Exception $e) {}
    if ($b['notes_encrypted']) {
        try { $notes = decryptField($b['notes_encrypted']); } catch (Exception $e) {}
    }

    $rows[] = implode(',', [
        $escape($b['booking_code']),
        $escape($b['booking_date']),
        $escape($b['booking_time']),
        $escape($b['customer_name']),
        $escape($phone),
        $escape($b['product_name']),
        $escape($b['price_label'] ?? ''),
        $escape($b['people_count']),
        $escape($b['location_type']),
        $escape($b['service_area_name'] ?? ''),
        $escape($address),
        $escape($notes),
        $escape($b['status']),
        $escape($b['source']),
        $escape($b['created_at']),
    ]);
}

$csv      = implode("\r\n", array_merge([$header], $rows));
$filename = 'bookings-' . date('Y-m-d') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header("Content-Disposition: attachment; filename=\"$filename\"");
header('Content-Length: ' . strlen("\xEF\xBB\xBF" . $csv)); // BOM for Excel
echo "\xEF\xBB\xBF" . $csv;
exit;

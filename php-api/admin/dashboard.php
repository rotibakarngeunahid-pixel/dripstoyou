<?php
// GET /api/admin/dashboard.php — stats for admin dashboard

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');
$admin = requireAuth();
// CONTENT_ADMIN tidak boleh melihat PII booking — nomor HP tidak didekripsi.
$canSeePhone = in_array($admin['role'] ?? '', ['SUPER_ADMIN', 'ADMIN_OPERASIONAL'], true);

$db  = getDb();
$today = date('Y-m-d');

// Total bookings
$total = (int)$db->query('SELECT COUNT(*) FROM bookings')->fetchColumn();

// Pending (status = BARU)
$pending = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE status = 'BARU'")->fetchColumn();

// Today's bookings
$stmt = $db->prepare("SELECT COUNT(*) FROM bookings WHERE booking_date = ?");
$stmt->execute([$today]);
$todayCount = (int)$stmt->fetchColumn();

// Recent 10 bookings
$stmt = $db->query(
    'SELECT b.booking_code, b.customer_name, b.customer_phone_last4,
            b.customer_phone_encrypted, b.booking_date, b.booking_time,
            b.location_type, b.status, p.name AS product_name,
            sa.name AS service_area_name
     FROM   bookings b
     JOIN   products p ON p.id = b.product_id
     LEFT JOIN service_areas sa ON sa.id = b.service_area_id
     ORDER  BY b.created_at DESC
     LIMIT  10'
);
$recent = $stmt->fetchAll();

foreach ($recent as &$b) {
    $phone = null;
    if ($canSeePhone && !empty($b['customer_phone_encrypted'])) {
        try { $phone = decryptField($b['customer_phone_encrypted']); } catch (Exception $e) {}
    }
    $b['customer_phone'] = $phone ?? ('...' . $b['customer_phone_last4']);
    unset($b['customer_phone_encrypted']);
}
unset($b);

$monthStart = date('Y-m-01');
$nextMonthStart = date('Y-m-01', strtotime('+1 month'));
$previousMonthStart = date('Y-m-01', strtotime('-1 month'));

$stmt = $db->prepare('SELECT COUNT(*) FROM bookings WHERE created_at >= ? AND created_at < ?');
$stmt->execute([$monthStart, $nextMonthStart]);
$monthCount = (int)$stmt->fetchColumn();

$stmt = $db->prepare('SELECT COUNT(*) FROM bookings WHERE created_at >= ? AND created_at < ?');
$stmt->execute([$previousMonthStart, $monthStart]);
$previousMonthCount = (int)$stmt->fetchColumn();

jsonSuccess([
    'totalBookings'   => $total,
    'pendingBookings' => $pending,
    'todayBookings'   => $todayCount,
    'monthBookings'   => $monthCount,
    'previousMonthBookings' => $previousMonthCount,
    'recentBookings'  => $recent,
]);

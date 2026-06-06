<?php
// GET /api/admin/dashboard.php — stats for admin dashboard

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');
requireAuth();

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
            b.booking_date, b.booking_time, b.status,
            p.name AS product_name
     FROM   bookings b
     JOIN   products p ON p.id = b.product_id
     ORDER  BY b.created_at DESC
     LIMIT  10'
);
$recent = $stmt->fetchAll();

jsonSuccess([
    'totalBookings'   => $total,
    'pendingBookings' => $pending,
    'todayBookings'   => $todayCount,
    'recentBookings'  => $recent,
]);

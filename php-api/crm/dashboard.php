<?php
// CRM Dashboard endpoint (OWNER — gated by 'dashboard')
//   GET /php-api/crm/dashboard.php?period=week|month|quarter

require_once __DIR__ . '/_crm.php';
handleCors();
requireMethod('GET');

$staff = requireCRMAuth();
requireCRMPermission($staff, 'dashboard');

$db     = getDb();
$period = in_array($_GET['period'] ?? 'week', ['week', 'month', 'quarter'], true) ? $_GET['period'] : 'week';
$days   = $period === 'month' ? 30 : ($period === 'quarter' ? 90 : 7);
$since  = date('Y-m-d', strtotime("-$days days"));

// ── Stat cards ──
$totalBooking = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE booking_date >= '$since'")->fetchColumn();
$pending = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE crm_status IN ('PENDING','NEED_CONFIRMATION','CONFIRMED') AND booking_date >= '$since'")->fetchColumn();
$completed = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE crm_status IN ('TREATMENT_COMPLETED','PAYMENT_COMPLETED','FOLLOW_UP','CLOSED') AND booking_date >= '$since'")->fetchColumn();
$revenue = (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='PAID' AND paid_at >= '$since 00:00:00'")->fetchColumn();
$omzet = (float)$db->query("SELECT COALESCE(SUM(total_fee),0) FROM bookings WHERE booking_date >= '$since'")->fetchColumn();
$unpaid = max(0, $omzet - $revenue);

// ── Weekly chart (last 7 days) ──
$weekly = [];
$dow = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
for ($i = 6; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-$i days"));
    $stmt = $db->prepare('SELECT COUNT(*) FROM bookings WHERE booking_date = ?');
    $stmt->execute([$d]);
    $weekly[] = ['label' => $dow[(int)date('w', strtotime($d))], 'date' => $d, 'count' => (int)$stmt->fetchColumn()];
}

// ── Top services ──
$top = $db->prepare(
    "SELECT p.name, COUNT(*) AS count FROM bookings b JOIN products p ON p.id = b.product_id
     WHERE b.booking_date >= ? GROUP BY p.id, p.name ORDER BY count DESC LIMIT 5"
);
$top->execute([$since]);
$topServices = $top->fetchAll();

// ── Low stock ──
$lowStock = $db->query(
    "SELECT id, name, stock_current, stock_minimum, unit FROM inventory_items
     WHERE is_active = 1 AND stock_current <= stock_minimum ORDER BY stock_current ASC LIMIT 10"
)->fetchAll();

// ── Recent bookings ──
$recent = $db->query(
    "SELECT b.id, b.booking_code_display, b.customer_name, b.booking_date, b.booking_time, b.crm_status,
            p.name AS product_name, n.name AS nurse_name
     FROM bookings b JOIN products p ON p.id = b.product_id
     LEFT JOIN nurses n ON n.id = b.nurse_id
     ORDER BY b.created_at DESC LIMIT 10"
)->fetchAll();

jsonSuccess([
    'period' => $period,
    'stats'  => [
        'totalBooking' => $totalBooking, 'pending' => $pending, 'completed' => $completed,
        'revenue' => $revenue, 'unpaid' => $unpaid,
    ],
    'weeklyChart'   => $weekly,
    'topServices'   => $topServices,
    'lowStockItems' => $lowStock,
    'recentBookings'=> $recent,
]);

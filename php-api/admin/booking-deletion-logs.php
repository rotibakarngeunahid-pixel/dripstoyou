<?php
// GET /api/admin/booking-deletion-logs.php              — list all deletion logs
// GET /api/admin/booking-deletion-logs.php?export=1     — export as CSV

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
requireMethod('GET');

if (($admin['role'] ?? '') !== 'SUPER_ADMIN') jsonError('Forbidden', 403);

$db = getDb();
ensureBookingDeletionLogsTable($db);

$dateFrom = isset($_GET['date_from']) ? str_clean($_GET['date_from'], 10) : null;
$dateTo   = isset($_GET['date_to'])   ? str_clean($_GET['date_to'],   10) : null;
$adminId  = isset($_GET['admin_id'])  ? str_clean($_GET['admin_id'],  30) : null;
$isExport = isset($_GET['export']) && $_GET['export'] === '1';

$where  = [];
$params = [];

if ($dateFrom) { $where[] = 'dl.deleted_at >= ?'; $params[] = $dateFrom . ' 00:00:00'; }
if ($dateTo)   { $where[] = 'dl.deleted_at <= ?'; $params[] = $dateTo   . ' 23:59:59'; }
if ($adminId)  { $where[] = 'dl.deleted_by_admin_id = ?'; $params[] = $adminId; }

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

if ($isExport) {
    $stmt = $db->prepare(
        "SELECT dl.id, dl.booking_code, dl.deleted_by_admin_name, dl.deleted_by_admin_email,
                dl.reason, dl.ip_address, dl.deleted_at, dl.booking_snapshot
         FROM   booking_deletion_logs dl
         $whereClause
         ORDER  BY dl.deleted_at DESC"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="deletion-logs-' . date('Y-m-d') . '.csv"');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID', 'Booking Code', 'Deleted By', 'Email', 'Reason', 'IP Address', 'Deleted At', 'Snapshot JSON']);
    foreach ($rows as $row) {
        fputcsv($out, [
            $row['id'],
            $row['booking_code'],
            $row['deleted_by_admin_name'],
            $row['deleted_by_admin_email'],
            $row['reason'],
            $row['ip_address'] ?? '',
            $row['deleted_at'],
            $row['booking_snapshot'],
        ]);
    }
    fclose($out);
    exit;
}

$stmt = $db->prepare(
    "SELECT dl.id, dl.booking_id, dl.booking_code,
            dl.deleted_by_admin_id, dl.deleted_by_admin_name, dl.deleted_by_admin_email,
            dl.reason, dl.ip_address, dl.deleted_at, dl.booking_snapshot
     FROM   booking_deletion_logs dl
     $whereClause
     ORDER  BY dl.deleted_at DESC
     LIMIT  500"
);
$stmt->execute($params);
$logs = $stmt->fetchAll();

// Enrich each row with parsed snapshot fields for table display
foreach ($logs as &$log) {
    $snap = json_decode($log['booking_snapshot'], true) ?? [];
    $log['customer_name'] = $snap['customer_name'] ?? '-';
    $log['product_name']  = $snap['product_name']  ?? '-';
    $log['booking_date']  = $snap['booking_date']  ?? '-';
    $log['booking_time']  = $snap['booking_time']  ?? '-';
    $log['booking_status'] = $snap['status']       ?? '-';
}
unset($log);

// Distinct admins list for filter dropdown
$adminsStmt = $db->query(
    'SELECT DISTINCT deleted_by_admin_id AS id, deleted_by_admin_name AS name
     FROM booking_deletion_logs
     ORDER BY deleted_by_admin_name ASC'
);
$admins = $adminsStmt->fetchAll();

jsonSuccess(['logs' => $logs, 'admins' => $admins]);

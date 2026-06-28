<?php
// CRM Audit Log endpoint (OWNER only — gated by 'audit'). Append-only, read here.
//   GET /php-api/crm/audit.php?staff_id=&module=&date_from=&date_to=&limit=&offset=

require_once __DIR__ . '/_crm.php';
handleCors();
requireMethod('GET');

$staff = requireCRMAuth();
requireCRMPermission($staff, 'audit');

$db     = getDb();
$limit  = min(100, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));

$where = []; $params = [];
if (!empty($_GET['staff_id'])) { $where[] = 'staff_id = ?'; $params[] = str_clean($_GET['staff_id'], 191); }
if (!empty($_GET['module']))   { $where[] = 'module = ?';   $params[] = str_clean($_GET['module'], 50); }
if (!empty($_GET['date_from'])) { $where[] = 'created_at >= ?'; $params[] = str_clean($_GET['date_from'], 10) . ' 00:00:00'; }
if (!empty($_GET['date_to']))   { $where[] = 'created_at <= ?'; $params[] = str_clean($_GET['date_to'], 10) . ' 23:59:59'; }
$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) FROM crm_audit_logs $whereClause");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT id, staff_name, staff_role, module, action, entity_id, detail, created_at
     FROM crm_audit_logs $whereClause
     ORDER BY created_at DESC LIMIT $limit OFFSET $offset"
);
$stmt->execute($params);

$staffList = $db->query('SELECT id, name FROM crm_staff ORDER BY name ASC')->fetchAll();

jsonSuccess([
    'items'   => $stmt->fetchAll(),
    'total'   => $total,
    'limit'   => $limit,
    'offset'  => $offset,
    'staff'   => $staffList,
    'modules' => ['AUTH','BOOKING','PATIENT','NURSE','SCREENING','CONSENT','TREATMENT','INVENTORY','PURCHASE_ORDER','FINANCE','WHATSAPP','STAFF','AREA'],
]);

<?php
// CRM WhatsApp Template endpoint
//   GET    /php-api/crm/whatsapp.php          — list templates
//   POST   /php-api/crm/whatsapp.php          — create/update (id optional)
//   POST   /php-api/crm/whatsapp.php?id=xxx&_method=DELETE — delete

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'whatsapp');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? (isset($_GET['_method']) ? str_clean($_GET['_method'], 10) : null) ?? getMethod());
$db     = getDb();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;

if ($method === 'GET') {
    $rows = $db->query('SELECT id, category, name, body_template, is_active, sort_order FROM whatsapp_templates ORDER BY sort_order ASC, name ASC')->fetchAll();
    jsonSuccess(['items' => $rows]);
}

if ($method === 'DELETE') {
    if (!$id) jsonError('ID wajib diisi', 400);
    $db->prepare('DELETE FROM whatsapp_templates WHERE id = ?')->execute([$id]);
    crmAuditLog($staff, 'WHATSAPP', 'DELETE', $id, 'Hapus template');
    jsonSuccess(['id' => $id], 'Template dihapus');
}

if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'category', 'body_template']);
    $cats = ['BOOKING_CONFIRMATION', 'REMINDER', 'NURSE_ASSIGNMENT', 'FOLLOW_UP', 'CUSTOM'];
    $cat  = in_array($body['category'], $cats, true) ? $body['category'] : 'CUSTOM';
    $name = str_clean($body['name'], 100);
    $tpl  = mb_substr(trim((string)$body['body_template']), 0, 5000);
    $active = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $sort = (int)($body['sort_order'] ?? 0);
    $tid  = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    if ($tid) {
        $db->prepare('UPDATE whatsapp_templates SET category=?, name=?, body_template=?, is_active=?, sort_order=?, updated_at=NOW() WHERE id=?')
           ->execute([$cat, $name, $tpl, $active, $sort, $tid]);
        crmAuditLog($staff, 'WHATSAPP', 'UPDATE', $tid, "Update template $name");
        jsonSuccess(['id' => $tid], 'Template diperbarui');
    }

    $tid = generateId();
    $db->prepare('INSERT INTO whatsapp_templates (id, category, name, body_template, is_active, sort_order, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3))')
       ->execute([$tid, $cat, $name, $tpl, $active, $sort]);
    crmAuditLog($staff, 'WHATSAPP', 'CREATE', $tid, "Buat template $name");
    jsonSuccess(['id' => $tid], 'Template dibuat', 201);
}

jsonError('Method not allowed', 405);

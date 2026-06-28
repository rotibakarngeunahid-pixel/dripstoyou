<?php
// CRM Area & Visit Fee endpoint (uses existing service_areas table)
//   GET  /php-api/crm/area.php       — list areas
//   POST /php-api/crm/area.php       — create/update (id optional)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'area');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();

if ($method === 'GET') {
    $rows = $db->query(
        'SELECT id, name, slug, COALESCE(visit_fee_amount, extra_fee_amount, 0) AS visit_fee_amount,
                estimated_arrival_minutes, is_active, sort_order
         FROM service_areas ORDER BY sort_order ASC, name ASC'
    )->fetchAll();
    jsonSuccess(['items' => $rows]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name']);
    $name   = str_clean($body['name'], 100);
    $fee    = isset($body['visit_fee_amount']) && $body['visit_fee_amount'] !== '' ? (float)$body['visit_fee_amount'] : null;
    $eta    = isset($body['estimated_arrival_minutes']) && $body['estimated_arrival_minutes'] !== '' ? (int)$body['estimated_arrival_minutes'] : null;
    $active = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $sort   = (int)($body['sort_order'] ?? 0);
    $aid    = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    if ($aid) {
        $db->prepare('UPDATE service_areas SET name=?, visit_fee_amount=?, estimated_arrival_minutes=?, is_active=?, sort_order=? WHERE id=?')
           ->execute([$name, $fee, $eta, $active, $sort, $aid]);
        crmAuditLog($staff, 'AREA', 'UPDATE', $aid, "Update area $name");
        jsonSuccess(['id' => $aid], 'Area diperbarui');
    }

    // Create — generate a unique slug from the name
    $base = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
    $base = trim($base, '-') ?: 'area';
    $slug = $base; $i = 2;
    $chk = $db->prepare('SELECT id FROM service_areas WHERE slug = ? LIMIT 1');
    while (true) {
        $chk->execute([$slug]);
        if (!$chk->fetch()) break;
        $slug = $base . '-' . $i++;
    }

    $aid = generateId();
    $db->prepare('INSERT INTO service_areas (id, name, slug, visit_fee_amount, estimated_arrival_minutes, is_active, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?)')
       ->execute([$aid, $name, $slug, $fee, $eta, $active, $sort]);
    crmAuditLog($staff, 'AREA', 'CREATE', $aid, "Buat area $name");
    jsonSuccess(['id' => $aid], 'Area dibuat', 201);
}

jsonError('Method not allowed', 405);

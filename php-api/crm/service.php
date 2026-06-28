<?php
// CRM Service Management endpoint (extends existing `products` table)
//   GET  /php-api/crm/service.php       — list services
//   POST /php-api/crm/service.php       — create/update (id optional)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'service');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();

if ($method === 'GET') {
    $rows = $db->query(
        'SELECT id, name, short_description, price_amount, currency, price_label, label,
                is_active, show_on_homepage, homepage_order
         FROM products ORDER BY homepage_order ASC, name ASC'
    )->fetchAll();
    jsonSuccess(['items' => $rows]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'price_amount']);
    $name    = str_clean($body['name'], 200);
    $desc    = !empty($body['short_description']) ? str_clean($body['short_description'], 500) : null;
    $price   = max(0, (float)$body['price_amount']);
    $label   = !empty($body['label']) ? str_clean($body['label'], 50) : null;
    $priceLabel = !empty($body['price_label']) ? str_clean($body['price_label'], 100) : null;
    $active  = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $home    = array_key_exists('show_on_homepage', $body) ? (int)(bool)$body['show_on_homepage'] : 0;
    $order   = (int)($body['homepage_order'] ?? 0);
    $now     = date('Y-m-d H:i:s');
    $pid     = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    if ($pid) {
        $db->prepare('UPDATE products SET name=?, short_description=?, price_amount=?, price_label=?, label=?, is_active=?, show_on_homepage=?, homepage_order=?, updated_at=? WHERE id=?')
           ->execute([$name, $desc, $price, $priceLabel, $label, $active, $home, $order, $now, $pid]);
        crmAuditLog($staff, 'SERVICE', 'UPDATE', $pid, "Update layanan $name");
        jsonSuccess(['id' => $pid], 'Layanan diperbarui');
    }

    // Create — unique slug from name
    $base = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
    $base = trim($base, '-') ?: 'layanan';
    $slug = $base; $i = 2;
    $chk = $db->prepare('SELECT id FROM products WHERE slug = ? LIMIT 1');
    while (true) { $chk->execute([$slug]); if (!$chk->fetch()) break; $slug = $base . '-' . $i++; }

    $pid = generateId();
    $db->prepare('INSERT INTO products (id, name, slug, short_description, price_amount, currency, price_label, label, is_active, show_on_homepage, homepage_order, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, "IDR", ?, ?, ?, ?, ?, ?, ?)')
       ->execute([$pid, $name, $slug, $desc, $price, $priceLabel, $label, $active, $home, $order, $now, $now]);
    crmAuditLog($staff, 'SERVICE', 'CREATE', $pid, "Buat layanan $name");
    jsonSuccess(['id' => $pid], 'Layanan dibuat', 201);
}

jsonError('Method not allowed', 405);

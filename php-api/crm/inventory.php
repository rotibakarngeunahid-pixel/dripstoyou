<?php
// CRM Inventory endpoint
//   GET  /php-api/crm/inventory.php             — list items + stats
//   GET  /php-api/crm/inventory.php?id=xxx      — single item + recent movements
//   POST /php-api/crm/inventory.php             — create/update item (id optional)
//   POST /php-api/crm/inventory.php  {action:'movement', inventory_item_id, type, quantity, notes}

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'inventory');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;

if ($method === 'GET' && $id) {
    $s = $db->prepare('SELECT * FROM inventory_items WHERE id = ? LIMIT 1');
    $s->execute([$id]);
    $item = $s->fetch();
    if (!$item) jsonError('Item tidak ditemukan', 404);
    $m = $db->prepare('SELECT type, quantity, reference_type, notes, created_at FROM stock_movements WHERE inventory_item_id = ? ORDER BY created_at DESC LIMIT 30');
    $m->execute([$id]);
    $item['movements'] = $m->fetchAll();
    jsonSuccess($item);
}

if ($method === 'GET') {
    $items = $db->query('SELECT * FROM inventory_items ORDER BY is_active DESC, name ASC')->fetchAll();
    $stats = [
        'total'       => (int)$db->query('SELECT COUNT(*) FROM inventory_items WHERE is_active = 1')->fetchColumn(),
        'low'         => (int)$db->query('SELECT COUNT(*) FROM inventory_items WHERE is_active = 1 AND stock_current <= stock_minimum AND stock_current > 0')->fetchColumn(),
        'out'         => (int)$db->query('SELECT COUNT(*) FROM inventory_items WHERE is_active = 1 AND stock_current = 0')->fetchColumn(),
        'expiring'    => (int)$db->query('SELECT COUNT(*) FROM inventory_items WHERE is_active = 1 AND expired_date IS NOT NULL AND expired_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)')->fetchColumn(),
    ];
    jsonSuccess(['items' => $items, 'stats' => $stats]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    $action = $body['action'] ?? '';

    // ── Stock movement ──
    if ($action === 'movement') {
        requireFields($body, ['inventory_item_id', 'type', 'quantity']);
        $invId = str_clean($body['inventory_item_id'], 191);
        $type  = in_array($body['type'], ['IN', 'OUT', 'ADJUSTMENT'], true) ? $body['type'] : null;
        if (!$type) jsonError('Tipe pergerakan tidak valid', 422);
        $qty   = (int)$body['quantity'];
        if ($qty <= 0) jsonError('Jumlah harus lebih dari 0', 422);
        $notes = !empty($body['notes']) ? str_clean($body['notes'], 500) : null;

        $chk = $db->prepare('SELECT stock_current, name FROM inventory_items WHERE id = ? LIMIT 1');
        $chk->execute([$invId]);
        $item = $chk->fetch();
        if (!$item) jsonError('Item tidak ditemukan', 404);

        $delta = $type === 'IN' ? $qty : ($type === 'OUT' ? -$qty : $qty - (int)$item['stock_current']);
        $newStock = (int)$item['stock_current'] + $delta;
        if ($newStock < 0) jsonError('Stok tidak boleh negatif', 422);

        $db->prepare('UPDATE inventory_items SET stock_current = ?, updated_at = NOW() WHERE id = ?')->execute([$newStock, $invId]);
        $db->prepare('INSERT INTO stock_movements (id, inventory_item_id, type, quantity, reference_type, notes, performed_by_staff_id, created_at)
                      VALUES (?, ?, ?, ?, "MANUAL", ?, ?, NOW(3))')
           ->execute([generateId(), $invId, $type, abs($delta), $notes, $staff['staff_id']]);
        crmAuditLog($staff, 'INVENTORY', 'MOVEMENT', $invId, "$type $qty {$item['name']} (stok: $newStock)");
        jsonSuccess(['id' => $invId, 'stock_current' => $newStock], 'Stok diperbarui');
    }

    // ── Create / update item ──
    requireFields($body, ['name', 'category']);
    $name  = str_clean($body['name'], 200);
    $cat   = in_array($body['category'], ['CAIRAN','VITAMIN','ALAT','OBAT','LAINNYA'], true) ? $body['category'] : 'LAINNYA';
    $unit  = !empty($body['unit']) ? str_clean($body['unit'], 20) : 'pcs';
    $min   = max(0, (int)($body['stock_minimum'] ?? 5));
    $exp   = !empty($body['expired_date']) ? str_clean($body['expired_date'], 10) : null;
    $sup   = !empty($body['supplier']) ? str_clean($body['supplier'], 100) : null;
    $price = isset($body['price_per_unit']) && $body['price_per_unit'] !== '' ? (float)$body['price_per_unit'] : null;
    $active = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $now   = date('Y-m-d H:i:s');
    $iid   = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    if ($iid) {
        $db->prepare('UPDATE inventory_items SET name=?, category=?, unit=?, stock_minimum=?, expired_date=?, supplier=?, price_per_unit=?, is_active=?, updated_at=? WHERE id=?')
           ->execute([$name, $cat, $unit, $min, $exp, $sup, $price, $active, $now, $iid]);
        crmAuditLog($staff, 'INVENTORY', 'UPDATE', $iid, "Update item $name");
        jsonSuccess(['id' => $iid], 'Item diperbarui');
    }

    $iid = generateId();
    $startStock = max(0, (int)($body['stock_current'] ?? 0));
    $db->prepare('INSERT INTO inventory_items (id, name, category, stock_current, stock_minimum, unit, expired_date, supplier, price_per_unit, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
       ->execute([$iid, $name, $cat, $startStock, $min, $unit, $exp, $sup, $price, $active, $now, $now]);
    if ($startStock > 0) {
        $db->prepare('INSERT INTO stock_movements (id, inventory_item_id, type, quantity, reference_type, notes, performed_by_staff_id, created_at)
                      VALUES (?, ?, "IN", ?, "MANUAL", "Stok awal", ?, NOW(3))')
           ->execute([generateId(), $iid, $startStock, $staff['staff_id']]);
    }
    crmAuditLog($staff, 'INVENTORY', 'CREATE', $iid, "Buat item $name");
    jsonSuccess(['id' => $iid], 'Item dibuat', 201);
}

jsonError('Method not allowed', 405);

<?php
// CRM Inventory endpoint
//   GET  /php-api/crm/inventory.php                     — list items + stats
//   GET  /php-api/crm/inventory.php?id=xxx              — single item + recent movements
//   GET  /php-api/crm/inventory.php?view=log&...        — global stock movement ledger (filterable)
//   GET  /php-api/crm/inventory.php?view=opname         — list past stock-opname sessions
//   GET  /php-api/crm/inventory.php?view=opname&id=xxx  — single opname session + item detail
//   POST /php-api/crm/inventory.php                     — create/update item (id optional, category_id required)
//   POST /php-api/crm/inventory.php  {action:'movement', inventory_item_id, type, quantity, notes}
//   POST /php-api/crm/inventory.php  {action:'opname', opname_date, notes, counts:[{inventory_item_id, counted_qty}]}
//
// Categories are managed separately — see inventory-category.php.

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'inventory');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$view   = isset($_GET['view']) ? str_clean($_GET['view'], 20) : null;

// ── Global stock movement ledger (all items, filterable) ───────────────────────
if ($method === 'GET' && $view === 'log') {
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));

    $where = []; $params = [];
    if (!empty($_GET['item_id'])) { $where[] = 'm.inventory_item_id = ?'; $params[] = str_clean($_GET['item_id'], 191); }
    if (!empty($_GET['type']) && in_array($_GET['type'], ['IN', 'OUT', 'ADJUSTMENT'], true)) {
        $where[] = 'm.type = ?'; $params[] = $_GET['type'];
    }
    if (!empty($_GET['date_from'])) { $where[] = 'm.created_at >= ?'; $params[] = str_clean($_GET['date_from'], 10) . ' 00:00:00'; }
    if (!empty($_GET['date_to']))   { $where[] = 'm.created_at <= ?'; $params[] = str_clean($_GET['date_to'], 10) . ' 23:59:59'; }
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) FROM stock_movements m $whereClause");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare(
        "SELECT m.id, m.type, m.quantity, m.reference_type, m.reference_id, m.notes, m.created_at,
                i.id AS item_id, i.name AS item_name, i.unit,
                st.name AS staff_name
         FROM stock_movements m
         JOIN inventory_items i ON i.id = m.inventory_item_id
         LEFT JOIN crm_staff st ON st.id = m.performed_by_staff_id
         $whereClause
         ORDER BY m.created_at DESC LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);

    $itemOptions = $db->query('SELECT id, name FROM inventory_items ORDER BY name ASC')->fetchAll();

    jsonSuccess([
        'items'        => $stmt->fetchAll(),
        'total'        => $total,
        'limit'        => $limit,
        'offset'       => $offset,
        'item_options' => $itemOptions,
    ]);
}

// ── Stock opname (physical count) sessions ──────────────────────────────────────
if ($method === 'GET' && $view === 'opname') {
    if ($id) {
        $s = $db->prepare(
            'SELECT o.*, st.name AS staff_name FROM stock_opnames o
             LEFT JOIN crm_staff st ON st.id = o.performed_by_staff_id
             WHERE o.id = ? LIMIT 1'
        );
        $s->execute([$id]);
        $opname = $s->fetch();
        if (!$opname) jsonError('Sesi opname tidak ditemukan', 404);
        $it = $db->prepare('SELECT * FROM stock_opname_items WHERE stock_opname_id = ? ORDER BY item_name ASC');
        $it->execute([$id]);
        $opname['items'] = $it->fetchAll();
        jsonSuccess($opname);
    }

    $limit  = min(50, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $total  = (int)$db->query('SELECT COUNT(*) FROM stock_opnames')->fetchColumn();
    $rows   = $db->prepare(
        "SELECT o.id, o.opname_date, o.notes, o.total_items, o.total_variance, o.created_at, st.name AS staff_name
         FROM stock_opnames o
         LEFT JOIN crm_staff st ON st.id = o.performed_by_staff_id
         ORDER BY o.created_at DESC LIMIT $limit OFFSET $offset"
    );
    $rows->execute();
    jsonSuccess(['items' => $rows->fetchAll(), 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

if ($method === 'GET' && $id) {
    $s = $db->prepare(
        'SELECT i.*, c.name AS category_name FROM inventory_items i
         JOIN inventory_categories c ON c.id = i.category_id
         WHERE i.id = ? LIMIT 1'
    );
    $s->execute([$id]);
    $item = $s->fetch();
    if (!$item) jsonError('Item tidak ditemukan', 404);
    $m = $db->prepare('SELECT type, quantity, reference_type, notes, created_at FROM stock_movements WHERE inventory_item_id = ? ORDER BY created_at DESC LIMIT 30');
    $m->execute([$id]);
    $item['movements'] = $m->fetchAll();
    jsonSuccess($item);
}

if ($method === 'GET') {
    $items = $db->query(
        'SELECT i.*, c.name AS category_name FROM inventory_items i
         JOIN inventory_categories c ON c.id = i.category_id
         ORDER BY i.is_active DESC, i.name ASC'
    )->fetchAll();
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

    // ── Stock opname (bulk physical count reconciliation) ──
    if ($action === 'opname') {
        requireFields($body, ['counts']);
        $counts = is_array($body['counts']) ? $body['counts'] : [];
        if (count($counts) === 0) jsonError('Minimal 1 item harus dihitung', 422);

        $opnameDate = !empty($body['opname_date']) ? str_clean($body['opname_date'], 10) : date('Y-m-d');
        $opnameNotes = !empty($body['notes']) ? str_clean($body['notes'], 500) : null;
        $opnameId = generateId();
        $totalItems = 0;
        $totalVariance = 0;
        $now = date('Y-m-d H:i:s');

        $db->beginTransaction();
        try {
            foreach ($counts as $c) {
                $invId = str_clean($c['inventory_item_id'] ?? '', 191);
                if ($invId === '' || !isset($c['counted_qty'])) continue;
                $counted = (int)$c['counted_qty'];
                if ($counted < 0) continue;

                $chk = $db->prepare('SELECT stock_current, name, unit FROM inventory_items WHERE id = ? LIMIT 1');
                $chk->execute([$invId]);
                $item = $chk->fetch();
                if (!$item) continue;

                $systemQty = (int)$item['stock_current'];
                $variance  = $counted - $systemQty;
                $totalItems++;
                $totalVariance += abs($variance);

                $db->prepare(
                    'INSERT INTO stock_opname_items (id, stock_opname_id, inventory_item_id, item_name, unit, system_qty, counted_qty, variance)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                )->execute([generateId(), $opnameId, $invId, $item['name'], $item['unit'], $systemQty, $counted, $variance]);

                if ($variance !== 0) {
                    $db->prepare('UPDATE inventory_items SET stock_current = ?, updated_at = NOW() WHERE id = ?')
                       ->execute([$counted, $invId]);
                    $db->prepare(
                        'INSERT INTO stock_movements (id, inventory_item_id, type, quantity, reference_type, reference_id, notes, performed_by_staff_id, created_at)
                         VALUES (?, ?, "ADJUSTMENT", ?, "STOCK_OPNAME", ?, ?, ?, NOW(3))'
                    )->execute([generateId(), $invId, abs($variance), $opnameId, "Stok opname: sistem {$systemQty} -> hitung {$counted}", $staff['staff_id']]);
                }
            }

            if ($totalItems === 0) {
                $db->rollBack();
                jsonError('Tidak ada item valid untuk dihitung', 422);
            }

            $db->prepare(
                'INSERT INTO stock_opnames (id, opname_date, notes, total_items, total_variance, performed_by_staff_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            )->execute([$opnameId, $opnameDate, $opnameNotes, $totalItems, $totalVariance, $staff['staff_id'], $now]);

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            jsonError('Gagal menyimpan stok opname', 500);
        }

        crmAuditLog($staff, 'INVENTORY', 'STOCK_OPNAME', $opnameId, "Stok opname: $totalItems item dihitung, total selisih $totalVariance unit");
        jsonSuccess(['id' => $opnameId, 'total_items' => $totalItems, 'total_variance' => $totalVariance], 'Stok opname tersimpan');
    }

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
    requireFields($body, ['name', 'category_id']);
    $name  = str_clean($body['name'], 200);
    $catId = str_clean($body['category_id'], 191);
    $catChk = $db->prepare('SELECT id FROM inventory_categories WHERE id = ? LIMIT 1');
    $catChk->execute([$catId]);
    if (!$catChk->fetch()) jsonError('Kategori tidak valid', 422);
    $unit  = !empty($body['unit']) ? str_clean($body['unit'], 20) : 'pcs';
    $min   = max(0, (int)($body['stock_minimum'] ?? 5));
    $exp   = !empty($body['expired_date']) ? str_clean($body['expired_date'], 10) : null;
    $sup   = !empty($body['supplier']) ? str_clean($body['supplier'], 100) : null;
    $price = isset($body['price_per_unit']) && $body['price_per_unit'] !== '' ? (float)$body['price_per_unit'] : null;
    $active = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $now   = date('Y-m-d H:i:s');
    $iid   = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    if ($iid) {
        $db->prepare('UPDATE inventory_items SET name=?, category_id=?, unit=?, stock_minimum=?, expired_date=?, supplier=?, price_per_unit=?, is_active=?, updated_at=? WHERE id=?')
           ->execute([$name, $catId, $unit, $min, $exp, $sup, $price, $active, $now, $iid]);
        crmAuditLog($staff, 'INVENTORY', 'UPDATE', $iid, "Update item $name");
        jsonSuccess(['id' => $iid], 'Item diperbarui');
    }

    $iid = generateId();
    $startStock = max(0, (int)($body['stock_current'] ?? 0));
    $db->prepare('INSERT INTO inventory_items (id, name, category_id, stock_current, stock_minimum, unit, expired_date, supplier, price_per_unit, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
       ->execute([$iid, $name, $catId, $startStock, $min, $unit, $exp, $sup, $price, $active, $now, $now]);
    if ($startStock > 0) {
        $db->prepare('INSERT INTO stock_movements (id, inventory_item_id, type, quantity, reference_type, notes, performed_by_staff_id, created_at)
                      VALUES (?, ?, "IN", ?, "MANUAL", "Stok awal", ?, NOW(3))')
           ->execute([generateId(), $iid, $startStock, $staff['staff_id']]);
    }
    crmAuditLog($staff, 'INVENTORY', 'CREATE', $iid, "Buat item $name");
    jsonSuccess(['id' => $iid], 'Item dibuat', 201);
}

jsonError('Method not allowed', 405);

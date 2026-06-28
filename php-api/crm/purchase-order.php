<?php
// CRM Purchase Order endpoint
//   GET  /php-api/crm/purchase-order.php           — list
//   GET  /php-api/crm/purchase-order.php?id=xxx    — detail with items
//   POST /php-api/crm/purchase-order.php           — create PO (+items)
//   POST /php-api/crm/purchase-order.php?id=xxx {action:'receive'} — receive stock

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'purchase_order');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;

if ($method === 'GET' && $id) {
    $s = $db->prepare('SELECT * FROM purchase_orders WHERE id = ? LIMIT 1');
    $s->execute([$id]);
    $po = $s->fetch();
    if (!$po) jsonError('PO tidak ditemukan', 404);
    $it = $db->prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?');
    $it->execute([$id]);
    $po['items'] = $it->fetchAll();
    jsonSuccess($po);
}

if ($method === 'GET') {
    $rows = $db->query('SELECT id, po_number, supplier, order_date, received_date, total_amount, status FROM purchase_orders ORDER BY created_at DESC LIMIT 200')->fetchAll();
    jsonSuccess(['items' => $rows]);
}

if ($method === 'POST' && $id) {
    $body = getBodyJson();
    if (($body['action'] ?? '') !== 'receive') jsonError('Aksi tidak dikenal', 400);

    $s = $db->prepare('SELECT * FROM purchase_orders WHERE id = ? LIMIT 1');
    $s->execute([$id]);
    $po = $s->fetch();
    if (!$po) jsonError('PO tidak ditemukan', 404);
    if ($po['status'] === 'RECEIVED') jsonError('PO sudah diterima', 422);
    if ($po['status'] === 'CANCELLED') jsonError('PO dibatalkan', 422);

    $items = $db->prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?');
    $items->execute([$id]);
    $rows = $items->fetchAll();

    $now = date('Y-m-d H:i:s');
    $db->beginTransaction();
    try {
        foreach ($rows as $r) {
            if (!empty($r['inventory_item_id'])) {
                $db->prepare('UPDATE inventory_items SET stock_current = stock_current + ?, updated_at = NOW() WHERE id = ?')
                   ->execute([(int)$r['quantity'], $r['inventory_item_id']]);
                $db->prepare('INSERT INTO stock_movements (id, inventory_item_id, type, quantity, reference_type, reference_id, notes, performed_by_staff_id, created_at)
                              VALUES (?, ?, "IN", ?, "PURCHASE_ORDER", ?, ?, ?, NOW(3))')
                   ->execute([generateId(), $r['inventory_item_id'], (int)$r['quantity'], $id, 'PO ' . $po['po_number'], $staff['staff_id']]);
            }
        }
        $db->prepare('UPDATE purchase_orders SET status = "RECEIVED", received_date = CURDATE(), updated_at = ? WHERE id = ?')->execute([$now, $id]);

        // Auto-create expense
        $db->prepare('INSERT INTO expenses (id, category, description, amount, expense_date, reference_id, recorded_by_staff_id, created_at)
                      VALUES (?, "MEDICAL_STOCK", ?, ?, CURDATE(), ?, ?, NOW(3))')
           ->execute([generateId(), 'Pembelian stok — PO ' . $po['po_number'] . ' (' . $po['supplier'] . ')', (float)$po['total_amount'], $id, $staff['staff_id']]);

        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        jsonError('Gagal menerima stok', 500);
    }

    crmAuditLog($staff, 'PURCHASE_ORDER', 'RECEIVE', $id, "Terima stok PO {$po['po_number']}");
    jsonSuccess(['id' => $id, 'status' => 'RECEIVED'], 'Stok diterima & dicatat sebagai pengeluaran');
}

if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['supplier', 'order_date']);
    $items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];
    if (count($items) === 0) jsonError('Minimal 1 item', 422);

    $supplier = str_clean($body['supplier'], 100);
    $orderDate = str_clean($body['order_date'], 10);
    $status = in_array($body['status'] ?? 'ORDERED', ['DRAFT', 'ORDERED'], true) ? $body['status'] : 'ORDERED';
    $notes = !empty($body['notes']) ? str_clean($body['notes'], 1000) : null;
    $now = date('Y-m-d H:i:s');

    $poId = generateId();
    $poNumber = crmNextPoNumber($db);
    $total = 0.0;

    $db->beginTransaction();
    try {
        $db->prepare('INSERT INTO purchase_orders (id, po_number, supplier, order_date, total_amount, status, notes, created_by_staff_id, created_at, updated_at)
                      VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)')
           ->execute([$poId, $poNumber, $supplier, $orderDate, $status, $notes, $staff['staff_id'], $now, $now]);

        foreach ($items as $it) {
            $itemName = str_clean($it['item_name'] ?? '', 200);
            if ($itemName === '') continue;
            $qty = max(1, (int)($it['quantity'] ?? 1));
            $price = max(0, (float)($it['price_per_unit'] ?? 0));
            $sub = $qty * $price;
            $total += $sub;
            $invId = !empty($it['inventory_item_id']) ? str_clean($it['inventory_item_id'], 191) : null;
            $db->prepare('INSERT INTO purchase_order_items (id, purchase_order_id, inventory_item_id, item_name, quantity, price_per_unit, subtotal)
                          VALUES (?, ?, ?, ?, ?, ?, ?)')
               ->execute([generateId(), $poId, $invId, $itemName, $qty, $price, $sub]);
        }
        $db->prepare('UPDATE purchase_orders SET total_amount = ? WHERE id = ?')->execute([$total, $poId]);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        jsonError('Gagal membuat PO', 500);
    }

    crmAuditLog($staff, 'PURCHASE_ORDER', 'CREATE', $poId, "Buat PO $poNumber ($supplier)");
    jsonSuccess(['id' => $poId, 'po_number' => $poNumber], 'PO dibuat', 201);
}

jsonError('Method not allowed', 405);

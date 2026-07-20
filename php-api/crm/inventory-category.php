<?php
// CRM Inventory Category endpoint
//   GET  /php-api/crm/inventory-category.php                            — list categories + item count each
//   POST /php-api/crm/inventory-category.php                            — create/update (id optional)
//   POST /php-api/crm/inventory-category.php  {action:'delete', id, reassign_to?}

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'inventory');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();

if ($method === 'GET') {
    $rows = $db->query(
        'SELECT c.id, c.name, c.sort_order, c.is_active,
                (SELECT COUNT(*) FROM inventory_items i WHERE i.category_id = c.id) AS item_count
         FROM inventory_categories c
         ORDER BY c.sort_order ASC, c.name ASC'
    )->fetchAll();
    jsonSuccess(['items' => $rows]);
}

if ($method === 'POST') {
    $body   = getBodyJson();
    $action = $body['action'] ?? '';

    // ── Delete (blocked if in use, unless a replacement category is given) ──
    if ($action === 'delete') {
        requireFields($body, ['id']);
        $cid = str_clean($body['id'], 191);
        $reassignTo = !empty($body['reassign_to']) ? str_clean($body['reassign_to'], 191) : null;

        $chk = $db->prepare('SELECT name FROM inventory_categories WHERE id = ? LIMIT 1');
        $chk->execute([$cid]);
        $cat = $chk->fetch();
        if (!$cat) jsonError('Kategori tidak ditemukan', 404);

        $totalCats = (int)$db->query('SELECT COUNT(*) FROM inventory_categories')->fetchColumn();
        if ($totalCats <= 1) jsonError('Tidak bisa menghapus — minimal harus ada 1 kategori', 422);

        $countStmt = $db->prepare('SELECT COUNT(*) FROM inventory_items WHERE category_id = ?');
        $countStmt->execute([$cid]);
        $itemCount = (int)$countStmt->fetchColumn();

        if ($itemCount > 0 && !$reassignTo) {
            jsonError("Kategori ini dipakai oleh $itemCount item. Pilih kategori pengganti untuk memindahkannya sebelum menghapus.", 422);
        }
        if ($reassignTo === $cid) jsonError('Kategori pengganti tidak boleh sama dengan kategori yang dihapus', 422);
        if ($reassignTo) {
            $chk2 = $db->prepare('SELECT id FROM inventory_categories WHERE id = ? LIMIT 1');
            $chk2->execute([$reassignTo]);
            if (!$chk2->fetch()) jsonError('Kategori pengganti tidak ditemukan', 404);
        }

        $db->beginTransaction();
        try {
            if ($itemCount > 0 && $reassignTo) {
                $db->prepare('UPDATE inventory_items SET category_id = ?, updated_at = NOW() WHERE category_id = ?')
                   ->execute([$reassignTo, $cid]);
            }
            $db->prepare('DELETE FROM inventory_categories WHERE id = ?')->execute([$cid]);
            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            jsonError('Gagal menghapus kategori', 500);
        }

        crmAuditLog($staff, 'INVENTORY', 'CATEGORY_DELETE', $cid, "Hapus kategori {$cat['name']}" . ($itemCount > 0 ? " ($itemCount item dipindahkan)" : ''));
        jsonSuccess(null, 'Kategori dihapus');
    }

    // ── Create / update ──
    requireFields($body, ['name']);
    $name = str_clean($body['name'], 100);
    if ($name === '') jsonError('Nama kategori wajib diisi', 422);
    $sort   = (int)($body['sort_order'] ?? 0);
    $active = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $cid    = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    $dupStmt = $cid
        ? $db->prepare('SELECT id FROM inventory_categories WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1')
        : $db->prepare('SELECT id FROM inventory_categories WHERE LOWER(name) = LOWER(?) LIMIT 1');
    $cid ? $dupStmt->execute([$name, $cid]) : $dupStmt->execute([$name]);
    if ($dupStmt->fetch()) jsonError('Nama kategori sudah dipakai', 422);

    if ($cid) {
        $chk = $db->prepare('SELECT id FROM inventory_categories WHERE id = ? LIMIT 1');
        $chk->execute([$cid]);
        if (!$chk->fetch()) jsonError('Kategori tidak ditemukan', 404);
        $db->prepare('UPDATE inventory_categories SET name=?, sort_order=?, is_active=?, updated_at=NOW() WHERE id=?')
           ->execute([$name, $sort, $active, $cid]);
        crmAuditLog($staff, 'INVENTORY', 'CATEGORY_UPDATE', $cid, "Update kategori $name");
        jsonSuccess(['id' => $cid], 'Kategori diperbarui');
    }

    $cid = generateId();
    $db->prepare('INSERT INTO inventory_categories (id, name, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())')
       ->execute([$cid, $name, $sort, $active]);
    crmAuditLog($staff, 'INVENTORY', 'CATEGORY_CREATE', $cid, "Buat kategori $name");
    jsonSuccess(['id' => $cid], 'Kategori dibuat', 201);
}

jsonError('Method not allowed', 405);

<?php
// GET    /api/admin/blog-categories.php          — list semua kategori (+ jumlah artikel)
// GET    /api/admin/blog-categories.php?id=xxx   — detail 1 kategori
// POST   /api/admin/blog-categories.php          — create kategori
// PATCH  /api/admin/blog-categories.php?id=xxx   — update kategori
// DELETE /api/admin/blog-categories.php?id=xxx   — hapus kategori (artikel → tanpa kategori)
//
// Sama seperti admin/blog.php: konten hanya untuk SUPER_ADMIN & CONTENT_ADMIN.

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
requireRole($admin, 'SUPER_ADMIN', 'CONTENT_ADMIN');

$method = getMethod();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db     = getDb();

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM blog_categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $category = $stmt->fetch();
        if (!$category) jsonError('Kategori tidak ditemukan', 404);
        jsonSuccess(formatBlogCategory($category));
    }

    $stmt = $db->query(
        'SELECT c.*, (SELECT COUNT(*) FROM blog_posts p WHERE p.category_id = c.id) AS post_count
         FROM   blog_categories c
         ORDER BY c.sort_order ASC, c.name ASC'
    );
    $categories = array_map('formatBlogCategory', $stmt->fetchAll());
    jsonSuccess($categories);
}

// ── POST (create) ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'slug']);

    $name        = str_clean($body['name'] ?? '', 120);
    $slug        = strtolower(str_clean($body['slug'] ?? '', 160));
    $description = str_clean($body['description'] ?? '', 500);
    $metaTitle   = str_clean($body['metaTitle'] ?? '', 70);
    $metaDesc    = str_clean($body['metaDescription'] ?? '', 200);
    $sortOrder   = (int)($body['sortOrder'] ?? 0);
    $isActive    = isset($body['isActive']) ? (bool)$body['isActive'] : true;

    if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
        jsonError('Slug hanya boleh huruf kecil, angka, dan tanda hubung', 422);
    }

    $chk = $db->prepare('SELECT id FROM blog_categories WHERE slug = ? LIMIT 1');
    $chk->execute([$slug]);
    if ($chk->fetch()) jsonError('Slug sudah dipakai', 409);

    $categoryId = generateId();
    $now        = date('Y-m-d H:i:s');
    $db->prepare(
        'INSERT INTO blog_categories
         (id, name, slug, description, meta_title, meta_description, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $categoryId, $name, $slug,
        $description ?: null,
        $metaTitle ?: null,
        $metaDesc ?: null,
        $sortOrder,
        $isActive ? 1 : 0,
        $now, $now,
    ]);

    auditLog('CREATE_BLOG_CATEGORY', $admin['admin_id'], 'BlogCategory', $categoryId, ['name' => $name]);
    jsonSuccess(['id' => $categoryId, 'name' => $name, 'slug' => $slug], 'Kategori dibuat', 201);
}

// ── PATCH (update) ────────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) jsonError('Category ID required', 400);

    $chk = $db->prepare('SELECT id, name, slug FROM blog_categories WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $current = $chk->fetch();
    if (!$current) jsonError('Kategori tidak ditemukan', 404);

    $body    = getBodyJson();
    $updates = [];
    $params  = [];

    if (array_key_exists('slug', $body)) {
        $newSlug = strtolower(str_clean($body['slug'], 160));
        if ($newSlug !== $current['slug']) {
            if (!preg_match('/^[a-z0-9-]+$/', $newSlug)) {
                jsonError('Slug hanya boleh huruf kecil, angka, dan tanda hubung', 422);
            }
            $dup = $db->prepare('SELECT id FROM blog_categories WHERE slug = ? AND id <> ? LIMIT 1');
            $dup->execute([$newSlug, $id]);
            if ($dup->fetch()) jsonError('Slug sudah dipakai', 409);
            $updates[] = '`slug` = ?';
            $params[]  = $newSlug;
        }
    }

    $textFields = [
        'name'            => ['name', 120],
        'description'     => ['description', 500],
        'metaTitle'       => ['meta_title', 70],
        'metaDescription' => ['meta_description', 200],
    ];
    foreach ($textFields as $camel => [$column, $max]) {
        if (!array_key_exists($camel, $body)) continue;
        $value     = str_clean($body[$camel] ?? '', $max);
        if ($column === 'name' && $value === '') jsonError('Nama kategori wajib diisi', 422);
        $updates[] = "`$column` = ?";
        $params[]  = $column === 'name' ? $value : ($value !== '' ? $value : null);
    }

    if (array_key_exists('sortOrder', $body)) {
        $updates[] = '`sort_order` = ?';
        $params[]  = (int)$body['sortOrder'];
    }
    if (array_key_exists('isActive', $body)) {
        $updates[] = '`is_active` = ?';
        $params[]  = $body['isActive'] ? 1 : 0;
    }

    if (empty($updates)) jsonSuccess(null, 'Tidak ada perubahan');

    $updates[] = 'updated_at = ?';
    $params[]  = date('Y-m-d H:i:s');
    $params[]  = $id;
    $db->prepare('UPDATE blog_categories SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);

    auditLog('UPDATE_BLOG_CATEGORY', $admin['admin_id'], 'BlogCategory', $id, ['name' => $current['name']]);
    jsonSuccess(null, 'Kategori diperbarui');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) jsonError('Category ID required', 400);

    $chk = $db->prepare('SELECT id, name FROM blog_categories WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $category = $chk->fetch();
    if (!$category) jsonError('Kategori tidak ditemukan', 404);

    // Artikel tidak ikut terhapus — cukup lepas relasinya (setara ON DELETE SET NULL,
    // dilakukan eksplisit supaya tetap benar walau FK tidak terpasang di hosting).
    $db->prepare('UPDATE blog_posts SET category_id = NULL, updated_at = ? WHERE category_id = ?')
       ->execute([date('Y-m-d H:i:s'), $id]);
    $db->prepare('DELETE FROM blog_categories WHERE id = ?')->execute([$id]);

    auditLog('DELETE_BLOG_CATEGORY', $admin['admin_id'], 'BlogCategory', $id, ['name' => $category['name']]);
    jsonSuccess(null, 'Kategori dihapus');
}

jsonError('Method not allowed', 405);

// ── Helper ────────────────────────────────────────────────────────────────────

function formatBlogCategory(array $c): array {
    $c['sort_order'] = (int)$c['sort_order'];
    $c['is_active']  = (bool)$c['is_active'];
    if (isset($c['post_count'])) $c['post_count'] = (int)$c['post_count'];
    return $c;
}

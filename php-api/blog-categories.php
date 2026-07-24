<?php
// GET /api/blog-categories.php          — daftar kategori blog aktif (publik)
// GET /api/blog-categories.php?slug=xyz — satu kategori aktif (untuk halaman kategori)
//
// Hanya kategori is_active=1 yang dikembalikan. `post_count` hanya menghitung
// artikel yang benar-benar tayang (published & published_at <= NOW()).

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
$slug = isset($_GET['slug']) ? str_clean($_GET['slug'], 160) : null;

$columns = 'c.id, c.name, c.slug, c.description, c.meta_title, c.meta_description, c.sort_order,
            (SELECT COUNT(*) FROM blog_posts p
              WHERE p.category_id = c.id
                AND p.status = \'published\'
                AND p.published_at IS NOT NULL
                AND p.published_at <= NOW()) AS post_count';

if ($slug !== null) {
    $stmt = $db->prepare(
        'SELECT ' . $columns . ' FROM blog_categories c WHERE c.slug = ? AND c.is_active = 1 LIMIT 1'
    );
    $stmt->execute([$slug]);
    $category = $stmt->fetch();
    if (!$category) jsonError('Category not found', 404);

    $category['sort_order'] = (int)$category['sort_order'];
    $category['post_count'] = (int)$category['post_count'];
    jsonSuccess($category);
}

$stmt = $db->query(
    'SELECT ' . $columns . ' FROM blog_categories c WHERE c.is_active = 1 ORDER BY c.sort_order ASC, c.name ASC'
);
$categories = $stmt->fetchAll();
foreach ($categories as &$c) {
    $c['sort_order'] = (int)$c['sort_order'];
    $c['post_count'] = (int)$c['post_count'];
}
unset($c);

jsonSuccess($categories);

<?php
// GET /api/blog.php                        — daftar artikel published (paginated)
// GET /api/blog.php?slug=xyz               — satu artikel published (+ related)
// Query list  : page, per_page, category (slug), include_content=1
// Query detail: include_related=1
//
// SEMUA query publik wajib memfilter status='published' AND published_at <= NOW().
// Draft / scheduled (belum waktunya) / archived tidak pernah keluar dari sini,
// sehingga otomatis tidak masuk sitemap dan URL-nya 404 di Next.js.

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db = getDb();

$slug        = isset($_GET['slug']) ? str_clean($_GET['slug'], 200) : null;
$incContent  = !empty($_GET['include_content']);
$incRelated  = !empty($_GET['include_related']);

// Kolom kartu listing (tanpa body) — dipakai listing, related, dan sitemap.
const BLOG_CARD_COLUMNS = 'p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.cover_image_alt,
            p.reading_minutes, p.published_at, p.updated_at,
            c.name AS category_name, c.slug AS category_slug';

const BLOG_PUBLISHED_WHERE = "p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= NOW()";

if ($slug !== null) {
    // ── Detail artikel ────────────────────────────────────────────────────────
    $stmt = $db->prepare(
        'SELECT ' . BLOG_CARD_COLUMNS . ',
                p.content, p.content_source, p.meta_title, p.meta_description,
                p.canonical_url, p.og_image_url, p.author_name, p.category_id
         FROM   blog_posts p
         LEFT JOIN blog_categories c ON c.id = p.category_id
         WHERE  p.slug = ? AND ' . BLOG_PUBLISHED_WHERE . '
         LIMIT  1'
    );
    $stmt->execute([$slug]);
    $post = $stmt->fetch();

    if (!$post) jsonError('Article not found', 404);

    $categoryId = $post['category_id'];
    unset($post['category_id']);
    $post = formatBlogPost($post);

    if ($incRelated) {
        // Prioritas artikel satu kategori; kalau kurang, isi dengan yang terbaru.
        $related = [];
        if ($categoryId) {
            $rel = $db->prepare(
                'SELECT ' . BLOG_CARD_COLUMNS . '
                 FROM   blog_posts p
                 LEFT JOIN blog_categories c ON c.id = p.category_id
                 WHERE  ' . BLOG_PUBLISHED_WHERE . ' AND p.category_id = ? AND p.id <> ?
                 ORDER BY p.published_at DESC
                 LIMIT  3'
            );
            $rel->execute([$categoryId, $post['id']]);
            $related = $rel->fetchAll();
        }
        if (count($related) < 3) {
            $exclude = array_column($related, 'id');
            $exclude[] = $post['id'];
            $placeholders = implode(',', array_fill(0, count($exclude), '?'));
            $fill = $db->prepare(
                'SELECT ' . BLOG_CARD_COLUMNS . '
                 FROM   blog_posts p
                 LEFT JOIN blog_categories c ON c.id = p.category_id
                 WHERE  ' . BLOG_PUBLISHED_WHERE . ' AND p.id NOT IN (' . $placeholders . ')
                 ORDER BY p.published_at DESC
                 LIMIT  ' . (3 - count($related))
            );
            $fill->execute($exclude);
            $related = array_merge($related, $fill->fetchAll());
        }
        $post['related'] = array_map('formatBlogPost', $related);
    }

    jsonSuccess($post);
}

// ── Listing ───────────────────────────────────────────────────────────────────
// LIMIT/OFFSET di-bind sebagai integer (bindValue PARAM_INT), bukan string concat.
$page         = max(1, (int)($_GET['page'] ?? 1));
$perPage      = (int)($_GET['per_page'] ?? 9);
$perPage      = max(1, min(50, $perPage));
$categorySlug = isset($_GET['category']) ? str_clean($_GET['category'], 160) : null;

// Placeholder bernama semua (PDO tidak mengizinkan campur `?` dan `:name`).
$where  = [BLOG_PUBLISHED_WHERE];
$params = [];
if ($categorySlug !== null && $categorySlug !== '') {
    $where[]              = 'c.slug = :category';
    $params[':category']  = $categorySlug;
}
$whereSql = implode(' AND ', $where);

$countStmt = $db->prepare(
    'SELECT COUNT(*) AS cnt
     FROM   blog_posts p
     LEFT JOIN blog_categories c ON c.id = p.category_id
     WHERE  ' . $whereSql
);
$countStmt->execute($params);
$total      = (int)($countStmt->fetch()['cnt'] ?? 0);
$totalPages = $total > 0 ? (int)ceil($total / $perPage) : 0;
$offset     = ($page - 1) * $perPage;

$listSql = 'SELECT ' . BLOG_CARD_COLUMNS
    . ($incContent ? ', p.content, p.content_source' : '') . '
     FROM   blog_posts p
     LEFT JOIN blog_categories c ON c.id = p.category_id
     WHERE  ' . $whereSql . '
     ORDER BY p.published_at DESC
     LIMIT  :limit OFFSET :offset';

$listStmt = $db->prepare($listSql);
foreach ($params as $name => $value) {
    $listStmt->bindValue($name, $value, PDO::PARAM_STR);
}
$listStmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$listStmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$listStmt->execute();

$items = array_map('formatBlogPost', $listStmt->fetchAll());

jsonSuccess([
    'items'      => $items,
    'pagination' => [
        'page'       => $page,
        'perPage'    => $perPage,
        'total'      => $total,
        'totalPages' => $totalPages,
    ],
]);

// ── Helper ────────────────────────────────────────────────────────────────────

function formatBlogPost(array $p): array {
    $p['category'] = !empty($p['category_name'])
        ? ['name' => $p['category_name'], 'slug' => $p['category_slug']]
        : null;
    unset($p['category_name'], $p['category_slug']);
    $p['reading_minutes'] = $p['reading_minutes'] !== null ? (int)$p['reading_minutes'] : null;
    return $p;
}

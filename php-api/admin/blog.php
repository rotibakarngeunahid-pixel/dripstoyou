<?php
// GET    /api/admin/blog.php               — list artikel (semua status, + filter)
// GET    /api/admin/blog.php?id=xxx        — detail 1 artikel
// POST   /api/admin/blog.php               — create artikel (default draft)
// PATCH  /api/admin/blog.php?id=xxx        — update artikel (termasuk status)
// DELETE /api/admin/blog.php?id=xxx        — hapus artikel
//
// Blog memakai permission konten: hanya SUPER_ADMIN & CONTENT_ADMIN.
// ADMIN_OPERASIONAL tidak punya content:* sama sekali — termasuk untuk GET,
// jadi requireRole dipanggil untuk SEMUA method (bukan hanya non-GET seperti
// products, yang memang memberi products:read ke operasional).

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
requireRole($admin, 'SUPER_ADMIN', 'CONTENT_ADMIN');

$method = getMethod();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db     = getDb();

const BLOG_STATUSES = ['draft', 'scheduled', 'published', 'archived'];

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare(
            'SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM   blog_posts p
             LEFT JOIN blog_categories c ON c.id = p.category_id
             WHERE  p.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $post = $stmt->fetch();
        if (!$post) jsonError('Article not found', 404);
        jsonSuccess(formatAdminBlogPost($post));
    }

    $status   = isset($_GET['status']) ? str_clean($_GET['status'], 20) : null;
    $category = isset($_GET['category']) ? str_clean($_GET['category'], 191) : null;
    $q        = isset($_GET['q']) ? str_clean($_GET['q'], 120) : null;
    $page     = max(1, (int)($_GET['page'] ?? 1));
    $perPage  = max(1, min(100, (int)($_GET['per_page'] ?? 50)));
    $offset   = ($page - 1) * $perPage;

    $where  = ['1 = 1'];
    $params = [];
    if ($status !== null && in_array($status, BLOG_STATUSES, true)) {
        $where[]           = 'p.status = :status';
        $params[':status'] = $status;
    }
    if ($category !== null && $category !== '') {
        $where[]             = 'p.category_id = :category';
        $params[':category'] = $category;
    }
    if ($q !== null && $q !== '') {
        // Dua placeholder terpisah: native prepare (EMULATE_PREPARES=false)
        // tidak mendukung placeholder bernama yang dipakai lebih dari sekali.
        $where[]            = '(p.title LIKE :qTitle OR p.slug LIKE :qSlug)';
        $params[':qTitle']  = '%' . $q . '%';
        $params[':qSlug']   = '%' . $q . '%';
    }
    $whereSql = implode(' AND ', $where);

    $countStmt = $db->prepare('SELECT COUNT(*) AS cnt FROM blog_posts p WHERE ' . $whereSql);
    $countStmt->execute($params);
    $total = (int)($countStmt->fetch()['cnt'] ?? 0);

    // Body artikel sengaja tidak diambil di listing (bisa ratusan KB per baris).
    $listStmt = $db->prepare(
        'SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.cover_image_alt,
                p.status, p.published_at, p.reading_minutes, p.view_count,
                p.created_at, p.updated_at, p.category_id,
                c.name AS category_name, c.slug AS category_slug
         FROM   blog_posts p
         LEFT JOIN blog_categories c ON c.id = p.category_id
         WHERE  ' . $whereSql . '
         ORDER BY p.updated_at DESC
         LIMIT  :limit OFFSET :offset'
    );
    foreach ($params as $name => $value) {
        $listStmt->bindValue($name, $value, PDO::PARAM_STR);
    }
    $listStmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
    $listStmt->execute();

    jsonSuccess([
        'items'      => array_map('formatAdminBlogPost', $listStmt->fetchAll()),
        'pagination' => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => $total > 0 ? (int)ceil($total / $perPage) : 0,
        ],
    ]);
}

// ── POST (create) ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['title', 'slug', 'content']);

    $title          = str_clean($body['title'] ?? '', 200);
    $slug           = strtolower(str_clean($body['slug'] ?? '', 200));
    $excerpt        = str_clean($body['excerpt'] ?? '', 500);
    $content        = str_clean($body['content'] ?? '', 200000);
    $contentSource  = str_clean($body['contentSource'] ?? '', 200000);
    $coverImageUrl  = str_clean($body['coverImageUrl'] ?? '', 500);
    $coverImageAlt  = str_clean($body['coverImageAlt'] ?? '', 255);
    $metaTitle      = str_clean($body['metaTitle'] ?? '', 70);
    $metaDesc       = str_clean($body['metaDescription'] ?? '', 200);
    $canonicalUrl   = str_clean($body['canonicalUrl'] ?? '', 500);
    $ogImageUrl     = str_clean($body['ogImageUrl'] ?? '', 500);
    $authorName     = str_clean($body['authorName'] ?? '', 120);
    $categoryId     = isset($body['categoryId']) ? str_clean($body['categoryId'], 191) : null;
    $status         = str_clean($body['status'] ?? 'draft', 20);
    $publishedAtRaw = isset($body['publishedAt']) ? str_clean($body['publishedAt'], 25) : null;

    if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
        jsonError('Slug hanya boleh huruf kecil, angka, dan tanda hubung', 422);
    }
    if (!in_array($status, BLOG_STATUSES, true)) jsonError('Status tidak valid', 422);
    if ($coverImageUrl !== '' && $coverImageAlt === '') {
        jsonError('Alt text cover wajib diisi bila ada gambar cover', 422);
    }
    if ($categoryId) assertBlogCategoryExists($db, $categoryId);

    $chk = $db->prepare('SELECT id FROM blog_posts WHERE slug = ? LIMIT 1');
    $chk->execute([$slug]);
    if ($chk->fetch()) jsonError('Slug sudah dipakai', 409);

    $publishedAt = normalizeBlogDateTime($publishedAtRaw);
    $now         = date('Y-m-d H:i:s');
    if ($status === 'published' && !$publishedAt) $publishedAt = $now;
    if ($status === 'scheduled' && !$publishedAt) {
        jsonError('Artikel terjadwal butuh tanggal tayang (publishedAt)', 422);
    }

    $readingMinutes = isset($body['readingMinutes'])
        ? max(1, (int)$body['readingMinutes'])
        : estimateReadingMinutes($contentSource !== '' ? $contentSource : $content);

    $postId = generateId();
    $stmt   = $db->prepare(
        'INSERT INTO blog_posts
         (id, category_id, title, slug, excerpt, content, content_source,
          cover_image_url, cover_image_alt, meta_title, meta_description,
          canonical_url, og_image_url, author_name, author_admin_id,
          status, published_at, reading_minutes, view_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    );
    $stmt->execute([
        $postId,
        $categoryId ?: null,
        $title, $slug,
        $excerpt ?: null,
        $content,
        $contentSource ?: null,
        $coverImageUrl ?: null,
        $coverImageAlt ?: null,
        $metaTitle ?: null,
        $metaDesc ?: null,
        $canonicalUrl ?: null,
        $ogImageUrl ?: null,
        $authorName ?: null,
        $admin['admin_id'],
        $status,
        $publishedAt,
        $readingMinutes,
        $now, $now,
    ]);

    auditLog('CREATE_BLOG_POST', $admin['admin_id'], 'BlogPost', $postId, ['title' => $title]);
    if ($status === 'published') {
        auditLog('PUBLISH_BLOG_POST', $admin['admin_id'], 'BlogPost', $postId, ['title' => $title]);
    }

    jsonSuccess(['id' => $postId, 'title' => $title, 'slug' => $slug], 'Artikel dibuat', 201);
}

// ── PATCH (update) ────────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) jsonError('Article ID required', 400);

    $chk = $db->prepare('SELECT id, title, slug, status, published_at, content, content_source, cover_image_url, cover_image_alt FROM blog_posts WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $current = $chk->fetch();
    if (!$current) jsonError('Article not found', 404);

    $body    = getBodyJson();
    $updates = [];
    $params  = [];
    $now     = date('Y-m-d H:i:s');

    // Slug permanen setelah artikel pernah tayang (§8.1) — cegah link rot.
    if (array_key_exists('slug', $body)) {
        $newSlug   = strtolower(str_clean($body['slug'], 200));
        $everLive  = $current['status'] === 'published'
            || $current['status'] === 'archived'
            || !empty($current['published_at']);
        if ($newSlug !== $current['slug']) {
            if ($everLive) jsonError('Slug tidak dapat diubah setelah artikel pernah dipublikasikan', 422);
            if (!preg_match('/^[a-z0-9-]+$/', $newSlug)) {
                jsonError('Slug hanya boleh huruf kecil, angka, dan tanda hubung', 422);
            }
            $dup = $db->prepare('SELECT id FROM blog_posts WHERE slug = ? AND id <> ? LIMIT 1');
            $dup->execute([$newSlug, $id]);
            if ($dup->fetch()) jsonError('Slug sudah dipakai', 409);
            $updates[] = '`slug` = ?';
            $params[]  = $newSlug;
        }
    }

    // Cover alt wajib bila ada cover — cek pakai nilai gabungan (lama + baru).
    $nextCoverUrl = array_key_exists('coverImageUrl', $body)
        ? str_clean($body['coverImageUrl'] ?? '', 500)
        : (string)($current['cover_image_url'] ?? '');
    $nextCoverAlt = array_key_exists('coverImageAlt', $body)
        ? str_clean($body['coverImageAlt'] ?? '', 255)
        : (string)($current['cover_image_alt'] ?? '');
    if ($nextCoverUrl !== '' && $nextCoverAlt === '') {
        jsonError('Alt text cover wajib diisi bila ada gambar cover', 422);
    }

    if (array_key_exists('categoryId', $body)) {
        $categoryId = str_clean($body['categoryId'] ?? '', 191);
        if ($categoryId !== '') assertBlogCategoryExists($db, $categoryId);
        $updates[] = '`category_id` = ?';
        $params[]  = $categoryId ?: null;
    }

    $textFields = [
        'title'           => ['title', 200],
        'excerpt'         => ['excerpt', 500],
        'content'         => ['content', 200000],
        'contentSource'   => ['content_source', 200000],
        'coverImageUrl'   => ['cover_image_url', 500],
        'coverImageAlt'   => ['cover_image_alt', 255],
        'metaTitle'       => ['meta_title', 70],
        'metaDescription' => ['meta_description', 200],
        'canonicalUrl'    => ['canonical_url', 500],
        'ogImageUrl'      => ['og_image_url', 500],
        'authorName'      => ['author_name', 120],
    ];
    foreach ($textFields as $camel => [$column, $max]) {
        if (!array_key_exists($camel, $body)) continue;
        $value = str_clean($body[$camel] ?? '', $max);
        // `content` NOT NULL — kolom lain boleh kosong → NULL.
        $updates[] = "`$column` = ?";
        $params[]  = $column === 'content' ? $value : ($value !== '' ? $value : null);
    }

    if (array_key_exists('readingMinutes', $body)) {
        $updates[] = '`reading_minutes` = ?';
        $params[]  = max(1, (int)$body['readingMinutes']);
    } elseif (array_key_exists('contentSource', $body) || array_key_exists('content', $body)) {
        $source    = array_key_exists('contentSource', $body)
            ? (string)$body['contentSource']
            : (string)($body['content'] ?? '');
        $updates[] = '`reading_minutes` = ?';
        $params[]  = estimateReadingMinutes($source);
    }

    // ── Transisi status & waktu tayang ────────────────────────────────────────
    // `published_at` yang sudah terisi TIDAK PERNAH dikosongkan lewat PATCH:
    // form admin selalu mengirim field ini (kadang kosong), dan menge-null-kan
    // kolomnya akan (a) membuat artikel published hilang dari publik dan
    // (b) membuka kunci slug artikel yang pernah tayang. Nilai kosong = "jangan
    // ubah", bukan "hapus".
    $requestedPublishedAt = array_key_exists('publishedAt', $body)
        ? normalizeBlogDateTime(str_clean($body['publishedAt'] ?? '', 25))
        : null;

    $auditAction = 'UPDATE_BLOG_POST';
    $newStatus   = null;
    if (array_key_exists('status', $body)) {
        $newStatus = str_clean($body['status'], 20);
        if (!in_array($newStatus, BLOG_STATUSES, true)) jsonError('Status tidak valid', 422);

        $updates[] = '`status` = ?';
        $params[]  = $newStatus;

        if ($newStatus === 'published' && $current['status'] !== 'published') {
            $auditAction = 'PUBLISH_BLOG_POST';
            // Tayang tanpa tanggal eksplisit → tayang sekarang.
            if (!$requestedPublishedAt && empty($current['published_at'])) {
                $requestedPublishedAt = $now;
            }
        } elseif ($current['status'] === 'published' && $newStatus !== 'published') {
            $auditAction = 'UNPUBLISH_BLOG_POST';
        }
    }

    $effectiveStatus = $newStatus ?? $current['status'];
    if ($effectiveStatus === 'scheduled' && !$requestedPublishedAt && empty($current['published_at'])) {
        jsonError('Artikel terjadwal butuh tanggal tayang (publishedAt)', 422);
    }

    if ($requestedPublishedAt) {
        $updates[] = '`published_at` = ?';
        $params[]  = $requestedPublishedAt;
    }

    if (empty($updates)) jsonSuccess(null, 'Tidak ada perubahan');

    $updates[] = 'updated_at = ?';
    $params[]  = $now;
    $params[]  = $id;
    $db->prepare('UPDATE blog_posts SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);

    auditLog($auditAction, $admin['admin_id'], 'BlogPost', $id, ['title' => $current['title']]);
    jsonSuccess(null, 'Artikel diperbarui');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) jsonError('Article ID required', 400);

    $chk = $db->prepare('SELECT id, title FROM blog_posts WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $post = $chk->fetch();
    if (!$post) jsonError('Article not found', 404);

    $db->prepare('DELETE FROM blog_posts WHERE id = ?')->execute([$id]);
    auditLog('DELETE_BLOG_POST', $admin['admin_id'], 'BlogPost', $id, ['title' => $post['title']]);
    jsonSuccess(null, 'Artikel dihapus');
}

jsonError('Method not allowed', 405);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAdminBlogPost(array $p): array {
    $p['category'] = !empty($p['category_name'])
        ? ['name' => $p['category_name'], 'slug' => $p['category_slug']]
        : null;
    unset($p['category_name'], $p['category_slug']);
    $p['reading_minutes'] = isset($p['reading_minutes']) && $p['reading_minutes'] !== null
        ? (int)$p['reading_minutes'] : null;
    if (isset($p['view_count'])) $p['view_count'] = (int)$p['view_count'];
    return $p;
}

function assertBlogCategoryExists(PDO $db, string $categoryId): void {
    $stmt = $db->prepare('SELECT id FROM blog_categories WHERE id = ? LIMIT 1');
    $stmt->execute([$categoryId]);
    if (!$stmt->fetch()) jsonError('Kategori tidak ditemukan', 422);
}

// Terima "2026-07-24T09:00" / "2026-07-24 09:00:00" / "" → 'Y-m-d H:i:s' atau null.
function normalizeBlogDateTime(?string $raw): ?string {
    if ($raw === null || trim($raw) === '') return null;
    $value = str_replace('T', ' ', trim($raw));
    $ts    = strtotime($value);
    if ($ts === false) jsonError('Format tanggal tayang tidak valid', 422);
    return date('Y-m-d H:i:s', $ts);
}

// ±200 kata per menit; dihitung dari sumber Markdown (fallback: HTML di-strip).
function estimateReadingMinutes(string $source): int {
    $text  = trim(preg_replace('/\s+/u', ' ', strip_tags($source)) ?? '');
    $words = $text === '' ? 0 : count(preg_split('/\s+/u', $text) ?: []);
    return max(1, (int)ceil($words / 200));
}

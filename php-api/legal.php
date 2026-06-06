<?php
// GET /api/legal.php?slug=xxx — get a legal page by slug

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$slug = isset($_GET['slug']) ? str_clean($_GET['slug'], 100) : null;
if (!$slug) jsonError('slug parameter required', 400);

$db   = getDb();
$stmt = $db->prepare(
    'SELECT id, type, title, slug, content, is_published, updated_at
     FROM legal_pages WHERE slug = ? AND is_published = 1 LIMIT 1'
);
$stmt->execute([$slug]);
$page = $stmt->fetch();

if (!$page) jsonError('Page not found', 404);

jsonSuccess($page);

<?php
// GET /api/products.php               — list all active products
// GET /api/products.php?slug=xyz      — single product by slug
// Query params: include_benefits=1, include_faqs=1

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
ensureCurrencySchema($db);
ensureProductPricesJsonSchema($db);
$slug = isset($_GET['slug']) ? str_clean($_GET['slug'], 200) : null;
$incB = !empty($_GET['include_benefits']);
$incF = !empty($_GET['include_faqs']);

if ($slug !== null) {
    // ── Single product by slug ────────────────────────────────────────────────
    $stmt = $db->prepare(
        'SELECT p.id, p.name, p.slug, p.short_description, p.full_description,
                p.price_amount, p.currency, p.price_label, p.prices_json,
                p.duration_minutes, p.image_url, p.label, p.show_on_homepage, p.homepage_order,
                p.created_at, p.updated_at,
                c.name AS category_name, c.slug AS category_slug
         FROM   products p
         LEFT JOIN product_categories c ON c.id = p.category_id
         WHERE  p.slug = ? AND p.is_active = 1
         LIMIT  1'
    );
    $stmt->execute([$slug]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonError('Product not found', 404);
    }

    $product = formatProduct($db, $product, $incB, $incF);
    jsonSuccess($product);
}

// ── List all active products ──────────────────────────────────────────────────
$stmt = $db->query(
    'SELECT p.id, p.name, p.slug, p.short_description, p.full_description,
            p.price_amount, p.currency, p.price_label, p.prices_json,
            p.duration_minutes, p.image_url, p.label, p.show_on_homepage, p.homepage_order,
            p.created_at, p.updated_at,
            c.name AS category_name, c.slug AS category_slug
     FROM   products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     WHERE  p.is_active = 1
     ORDER BY p.homepage_order ASC, p.name ASC'
);
$products = $stmt->fetchAll();

foreach ($products as &$p) {
    $p = formatProduct($db, $p, $incB, $incF);
}
unset($p);

jsonSuccess($products);

// ── Helper ────────────────────────────────────────────────────────────────────

function formatProduct(PDO $db, array $p, bool $incBenefits, bool $incFaqs): array {
    $p['category'] = $p['category_name'] ? ['name' => $p['category_name'], 'slug' => $p['category_slug']] : null;
    unset($p['category_name'], $p['category_slug']);
    $p['price_amount']    = (float)$p['price_amount'];
    $p['currency']        = normalizeCurrencyCode($p['currency'] ?? 'IDR');
    $p['homepage_order']  = (int)$p['homepage_order'];
    $p['show_on_homepage'] = (bool)$p['show_on_homepage'];
    $p['prices']          = decodePricesJson(
        $p['prices_json'] ?? null,
        $p['price_amount'],
        $p['currency']
    );
    unset($p['prices_json']);

    if ($incBenefits) {
        $stmt = $db->prepare('SELECT id, benefit_text, sort_order FROM product_benefits WHERE product_id = ? ORDER BY sort_order ASC');
        $stmt->execute([$p['id']]);
        $p['benefits'] = $stmt->fetchAll();
        foreach ($p['benefits'] as &$b) $b['sort_order'] = (int)$b['sort_order'];
        unset($b);
    }

    if ($incFaqs) {
        $stmt = $db->prepare('SELECT id, question, answer, sort_order FROM product_faqs WHERE product_id = ? AND is_active = 1 ORDER BY sort_order ASC');
        $stmt->execute([$p['id']]);
        $p['faqs'] = $stmt->fetchAll();
        foreach ($p['faqs'] as &$f) $f['sort_order'] = (int)$f['sort_order'];
        unset($f);
    }

    return $p;
}

<?php
// GET    /api/admin/products.php            — list all products (with counts)
// GET    /api/admin/products.php?id=xxx     — single product
// POST   /api/admin/products.php            — create product
// PATCH  /api/admin/products.php?id=xxx     — update product
// DELETE /api/admin/products.php?id=xxx     — delete product

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin  = requireAuth();
$method = getMethod();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db     = getDb();

// ── GET ────────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare(
            'SELECT p.*, c.name AS category_name
             FROM products p LEFT JOIN product_categories c ON c.id = p.category_id
             WHERE p.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) jsonError('Product not found', 404);

        $b = $db->prepare('SELECT id, benefit_text, sort_order FROM product_benefits WHERE product_id = ? ORDER BY sort_order ASC');
        $b->execute([$id]);
        $product['benefits'] = $b->fetchAll();
        $product['price_amount']   = (int)$product['price_amount'];
        $product['show_on_homepage'] = (bool)$product['show_on_homepage'];
        $product['is_active']       = (bool)$product['is_active'];

        jsonSuccess($product);
    }

    $stmt = $db->query(
        'SELECT p.id, p.name, p.slug, p.short_description, p.price_amount, p.price_label,
                p.duration_minutes, p.image_url, p.label, p.is_active, p.show_on_homepage,
                p.homepage_order, p.created_at, p.updated_at,
                c.name AS category_name,
                (SELECT COUNT(*) FROM bookings WHERE product_id = p.id) AS booking_count
         FROM   products p
         LEFT JOIN product_categories c ON c.id = p.category_id
         ORDER BY p.homepage_order ASC, p.created_at DESC'
    );
    $products = $stmt->fetchAll();
    foreach ($products as &$p) {
        $p['price_amount']     = (int)$p['price_amount'];
        $p['show_on_homepage'] = (bool)$p['show_on_homepage'];
        $p['is_active']        = (bool)$p['is_active'];
        $p['booking_count']    = (int)$p['booking_count'];
    }
    unset($p);
    jsonSuccess($products);
}

// ── POST (create) ──────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'slug', 'priceAmount']);

    $name             = str_clean($body['name'] ?? '', 200);
    $slug             = str_clean($body['slug'] ?? '', 200);
    $shortDescription = str_clean($body['shortDescription'] ?? '', 500);
    $fullDescription  = str_clean($body['fullDescription'] ?? '', 20000);
    $priceAmount      = max(0, (int)($body['priceAmount'] ?? 0));
    $priceLabel       = 'Rp ' . number_format($priceAmount, 0, ',', '.');
    $durationMinutes  = isset($body['durationMinutes']) ? max(1, (int)$body['durationMinutes']) : null;
    $imageUrl         = str_clean($body['imageUrl'] ?? '', 500);
    $label            = str_clean($body['label'] ?? '', 50);
    $isActive         = isset($body['isActive']) ? (bool)$body['isActive'] : true;
    $showOnHomepage   = isset($body['showOnHomepage']) ? (bool)$body['showOnHomepage'] : false;
    $homepageOrder    = (int)($body['homepageOrder'] ?? 0);
    $categoryId       = isset($body['categoryId']) ? str_clean($body['categoryId'], 191) : null;
    $benefits         = isset($body['benefits']) && is_array($body['benefits']) ? $body['benefits'] : [];

    if (!preg_match('/^[a-z0-9-]+$/', $slug)) jsonError('Slug hanya boleh huruf kecil, angka, dan tanda hubung', 422);

    // Check slug uniqueness
    $chk = $db->prepare('SELECT id FROM products WHERE slug = ? LIMIT 1');
    $chk->execute([$slug]);
    if ($chk->fetch()) jsonError('Slug sudah dipakai', 409);

    $productId = generateId();
    $now       = date('Y-m-d H:i:s');

    $stmt = $db->prepare(
        'INSERT INTO products
         (id, category_id, name, slug, short_description, full_description,
          price_amount, price_label, duration_minutes, image_url, label,
          is_active, show_on_homepage, homepage_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $productId,
        $categoryId ?: null,
        $name, $slug,
        $shortDescription ?: null,
        $fullDescription ?: null,
        $priceAmount,
        $priceLabel ?: null,
        $durationMinutes,
        $imageUrl ?: null,
        $label ?: null,
        $isActive ? 1 : 0,
        $showOnHomepage ? 1 : 0,
        $homepageOrder,
        $now, $now,
    ]);

    foreach ($benefits as $i => $benefitText) {
        $benId = generateId();
        $benStmt = $db->prepare('INSERT INTO product_benefits (id, product_id, benefit_text, sort_order) VALUES (?, ?, ?, ?)');
        $benStmt->execute([$benId, $productId, str_clean((string)$benefitText, 500), $i]);
    }

    auditLog('CREATE_PRODUCT', $admin['admin_id'], 'Product', $productId, ['name' => $name]);
    jsonSuccess(['id' => $productId, 'name' => $name, 'slug' => $slug], 'Product dibuat', 201);
}

// ── PATCH (update) ─────────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    if (!$id) jsonError('Product ID required', 400);

    $chk = $db->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    if (!$chk->fetch()) jsonError('Product not found', 404);

    $body    = getBodyJson();
    $updates = [];
    $params  = [];

    $allowed = ['name', 'short_description', 'full_description', 'price_amount', 'price_label',
                'duration_minutes', 'image_url', 'label', 'is_active', 'show_on_homepage',
                'homepage_order', 'category_id'];

    // Map camelCase → snake_case (priceLabel removed; auto-generated from priceAmount)
    $fieldMap = [
        'shortDescription' => 'short_description',
        'fullDescription'  => 'full_description',
        'priceAmount'      => 'price_amount',
        'durationMinutes'  => 'duration_minutes',
        'imageUrl'         => 'image_url',
        'isActive'         => 'is_active',
        'showOnHomepage'   => 'show_on_homepage',
        'homepageOrder'    => 'homepage_order',
        'categoryId'       => 'category_id',
        'name'             => 'name',
        'label'            => 'label',
    ];

    foreach ($fieldMap as $camel => $snake) {
        if (!array_key_exists($camel, $body)) continue;
        $val = $body[$camel];
        if (in_array($snake, ['is_active', 'show_on_homepage'], true)) {
            $val = $val ? 1 : 0;
        } elseif ($snake === 'price_amount' || $snake === 'homepage_order') {
            $val = (int)$val;
        }
        $updates[] = "`$snake` = ?";
        $params[]  = $val;
        // Auto-regenerate price_label whenever price_amount is updated
        if ($snake === 'price_amount') {
            $updates[] = '`price_label` = ?';
            $params[]  = 'Rp ' . number_format((int)$val, 0, ',', '.');
        }
    }

    if (!empty($updates)) {
        $updates[] = 'updated_at = ?';
        $params[]  = date('Y-m-d H:i:s');
        $params[]  = $id;
        $db->prepare('UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = ?')->execute($params);
    }

    // Update benefits if provided
    if (isset($body['benefits']) && is_array($body['benefits'])) {
        $db->prepare('DELETE FROM product_benefits WHERE product_id = ?')->execute([$id]);
        foreach ($body['benefits'] as $i => $bt) {
            $db->prepare('INSERT INTO product_benefits (id, product_id, benefit_text, sort_order) VALUES (?, ?, ?, ?)')
               ->execute([generateId(), $id, str_clean((string)$bt, 500), $i]);
        }
    }

    auditLog('UPDATE_PRODUCT', $admin['admin_id'], 'Product', $id);
    jsonSuccess(null, 'Product diperbarui');
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) jsonError('Product ID required', 400);

    $chk = $db->prepare('SELECT id, name FROM products WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $product = $chk->fetch();
    if (!$product) jsonError('Product not found', 404);

    $db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    auditLog('DELETE_PRODUCT', $admin['admin_id'], 'Product', $id, ['name' => $product['name']]);
    jsonSuccess(null, 'Product dihapus');
}

jsonError('Method not allowed', 405);

<?php
// GET /php-api/crm/options.php — dropdown data for CRM forms
// Returns active products, service areas (with visit fee), and active nurses.

require_once __DIR__ . '/_crm.php';
handleCors();
requireMethod('GET');

$staff = requireCRMAuth(); // any authenticated CRM staff
$db    = getDb();

$products = $db->query(
    "SELECT id, name, price_amount, price_label FROM products WHERE is_active = 1 ORDER BY name ASC"
)->fetchAll();

$areas = $db->query(
    "SELECT id, name, COALESCE(visit_fee_amount, extra_fee_amount, 0) AS visit_fee, estimated_arrival_minutes
     FROM service_areas WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
)->fetchAll();

$nurses = $db->query(
    "SELECT id, name FROM nurses WHERE is_active = 1 ORDER BY name ASC"
)->fetchAll();

$inventory = $db->query(
    "SELECT id, name, unit, stock_current FROM inventory_items WHERE is_active = 1 ORDER BY name ASC"
)->fetchAll();

jsonSuccess([
    'products'  => $products,
    'areas'     => $areas,
    'nurses'    => $nurses,
    'inventory' => $inventory,
]);

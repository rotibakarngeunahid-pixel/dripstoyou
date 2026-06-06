<?php
// GET /api/areas.php — list all active service areas

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
$stmt = $db->query(
    'SELECT id, name, slug, estimated_arrival_minutes, extra_fee_amount, note
     FROM   service_areas
     WHERE  is_active = 1
     ORDER BY sort_order ASC, name ASC'
);
$areas = $stmt->fetchAll();

foreach ($areas as &$a) {
    $a['estimated_arrival_minutes'] = $a['estimated_arrival_minutes'] !== null ? (int)$a['estimated_arrival_minutes'] : null;
    $a['extra_fee_amount']          = $a['extra_fee_amount'] !== null ? (int)$a['extra_fee_amount'] : null;
}
unset($a);

jsonSuccess($areas);

<?php
// GET /api/faqs.php — public FAQ list

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
$stmt = $db->query('SELECT id, question, answer, sort_order FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC');
$faqs = $stmt->fetchAll();

foreach ($faqs as &$f) $f['sort_order'] = (int)$f['sort_order'];
unset($f);

jsonSuccess($faqs);

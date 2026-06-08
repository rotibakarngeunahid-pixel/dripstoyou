<?php
// GET /api/availability.php?date=YYYY-MM-DD - check time slot availability

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$dateStr = $_GET['date'] ?? '';
if (parseDateYmdStrict($dateStr) === null) {
    jsonError('date parameter required (YYYY-MM-DD)', 400);
}

$db = getDb();

try {
    $availability = getDateAvailability($db, $dateStr);
} catch (InvalidArgumentException $e) {
    jsonError('Invalid date', 400);
}

jsonSuccess([
    'available' => (bool)$availability['available'],
    'slots' => $availability['slots'],
]);

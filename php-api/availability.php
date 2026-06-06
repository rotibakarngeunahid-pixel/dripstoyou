<?php
// GET /api/availability.php?date=YYYY-MM-DD — check time slot availability

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$dateStr = $_GET['date'] ?? '';
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) {
    jsonError('date parameter required (YYYY-MM-DD)', 400);
}

// Validate the date is actually a real date
$ts = strtotime($dateStr);
if ($ts === false) {
    jsonError('Invalid date', 400);
}

$dayOfWeek = (int)date('w', $ts); // 0=Sun … 6=Sat

$db = getDb();

// Check schedule for this day
$stmt = $db->prepare(
    'SELECT is_open, open_time, close_time, slot_duration_minutes, max_bookings_per_slot
     FROM   schedule_settings
     WHERE  day_of_week = ?
     LIMIT  1'
);
$stmt->execute([$dayOfWeek]);
$schedule = $stmt->fetch();

if (!$schedule || !(bool)$schedule['is_open']) {
    jsonSuccess(['available' => false, 'slots' => []]);
}

// Check if the day is fully blocked
$stmt = $db->prepare(
    'SELECT id FROM blocked_dates WHERE date = ? AND is_full_day = 1 LIMIT 1'
);
$stmt->execute([$dateStr]);
if ($stmt->fetch()) {
    jsonSuccess(['available' => false, 'slots' => []]);
}

// Generate time slots
[$openH, $openM]   = array_map('intval', explode(':', $schedule['open_time']));
[$closeH, $closeM] = array_map('intval', explode(':', $schedule['close_time']));
$openMinutes  = $openH * 60 + $openM;
$closeMinutes = $closeH * 60 + $closeM;
$slotDur      = (int)$schedule['slot_duration_minutes'];

$slots = [];
for ($m = $openMinutes; $m < $closeMinutes; $m += $slotDur) {
    $h      = intdiv($m, 60);
    $min    = $m % 60;
    $slots[] = sprintf('%02d:%02d', $h, $min);
}

// Count existing bookings per slot
$stmt = $db->prepare(
    "SELECT booking_time, COUNT(*) AS cnt
     FROM   bookings
     WHERE  booking_date = ?
       AND  status NOT IN ('DIBATALKAN')
     GROUP  BY booking_time"
);
$stmt->execute([$dateStr]);
$counts = [];
foreach ($stmt->fetchAll() as $r) {
    $counts[$r['booking_time']] = (int)$r['cnt'];
}

$maxPerSlot     = (int)$schedule['max_bookings_per_slot'];
$availableSlots = array_values(array_filter($slots, fn($s) => ($counts[$s] ?? 0) < $maxPerSlot));

jsonSuccess(['available' => count($availableSlots) > 0, 'slots' => $availableSlots]);

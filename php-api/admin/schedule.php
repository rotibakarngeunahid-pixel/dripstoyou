<?php
// GET /api/admin/schedule.php — get schedule settings
// PUT /api/admin/schedule.php — update schedule settings (array of days)

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin  = requireAuth();
// Jadwal adalah ranah operasional — CONTENT_ADMIN tidak punya akses
// (konsisten dengan pemeriksaan di route Next.js).
requireRole($admin, 'SUPER_ADMIN', 'ADMIN_OPERASIONAL');
$method = getMethod();
$db     = getDb();

if ($method === 'GET') {
    $stmt     = $db->query('SELECT * FROM schedule_settings ORDER BY day_of_week ASC');
    $schedule = $stmt->fetchAll();
    foreach ($schedule as &$s) {
        $s['day_of_week']             = (int)$s['day_of_week'];
        $s['is_open']                 = (bool)$s['is_open'];
        $s['slot_duration_minutes']   = (int)$s['slot_duration_minutes'];
        $s['max_bookings_per_slot']   = (int)$s['max_bookings_per_slot'];
        $s['min_prebooking_minutes']  = (int)$s['min_prebooking_minutes'];
    }
    unset($s);
    jsonSuccess($schedule);
}

if ($method === 'PUT') {
    $body = getBodyJson();
    if (!is_array($body) || empty($body)) {
        jsonError('Array of schedule days required', 422);
    }

    $now = date('Y-m-d H:i:s');

    foreach ($body as $day) {
        if (!is_array($day) || !isset($day['dayOfWeek'])) continue;

        $dow = (int)$day['dayOfWeek'];
        if ($dow < 0 || $dow > 6) continue;

        $isOpen          = isset($day['isOpen']) ? ((bool)$day['isOpen'] ? 1 : 0) : 1;
        $openTime        = preg_match('/^\d{2}:\d{2}$/', $day['openTime'] ?? '') ? $day['openTime'] : '08:00';
        $closeTime       = preg_match('/^\d{2}:\d{2}$/', $day['closeTime'] ?? '') ? $day['closeTime'] : '22:00';
        $slotDur         = max(15, min(480, (int)($day['slotDurationMinutes'] ?? 60)));
        $maxPerSlot      = max(1, min(20, (int)($day['maxBookingsPerSlot'] ?? 3)));
        $minPrebooking   = max(0, (int)($day['minPrebookingMinutes'] ?? 60));

        // Check if exists
        $chk = $db->prepare('SELECT id FROM schedule_settings WHERE day_of_week = ? LIMIT 1');
        $chk->execute([$dow]);
        $existing = $chk->fetch();

        if ($existing) {
            $db->prepare(
                'UPDATE schedule_settings
                 SET is_open = ?, open_time = ?, close_time = ?,
                     slot_duration_minutes = ?, max_bookings_per_slot = ?, min_prebooking_minutes = ?
                 WHERE day_of_week = ?'
            )->execute([$isOpen, $openTime, $closeTime, $slotDur, $maxPerSlot, $minPrebooking, $dow]);
        } else {
            $db->prepare(
                'INSERT INTO schedule_settings
                 (id, day_of_week, is_open, open_time, close_time, slot_duration_minutes, max_bookings_per_slot, min_prebooking_minutes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([generateId(), $dow, $isOpen, $openTime, $closeTime, $slotDur, $maxPerSlot, $minPrebooking]);
        }
    }

    auditLog('UPDATE_SCHEDULE', $admin['admin_id'], 'ScheduleSetting');

    $stmt     = $db->query('SELECT * FROM schedule_settings ORDER BY day_of_week ASC');
    $schedule = $stmt->fetchAll();
    jsonSuccess($schedule, 'Jadwal diperbarui');
}

jsonError('Method not allowed', 405);

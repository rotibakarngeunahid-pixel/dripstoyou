<?php
// One-time infrastructure seed. Public content is managed from the admin panel.

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');

$secret = $_GET['secret'] ?? '';
if (!defined('SEED_SECRET') || empty($secret) || !hash_equals((string)SEED_SECRET, (string)$secret)) {
    jsonError('Forbidden', 403);
}

if (!defined('INITIAL_ADMIN_EMAIL') || !defined('INITIAL_ADMIN_PASSWORD')) {
    jsonError('Initial admin credentials are not configured', 500);
}

$initialEmail = strtolower(trim((string)INITIAL_ADMIN_EMAIL));
$initialPassword = (string)INITIAL_ADMIN_PASSWORD;
if (!filter_var($initialEmail, FILTER_VALIDATE_EMAIL) || strlen($initialPassword) < 12) {
    jsonError('Initial admin credentials are invalid', 500);
}

$db = getDb();
$log = [];
$now = date('Y-m-d H:i:s');

try {
    $scheduleInserted = 0;
    for ($day = 0; $day <= 6; $day++) {
        $check = $db->prepare('SELECT id FROM schedule_settings WHERE day_of_week = ? LIMIT 1');
        $check->execute([$day]);
        if ($check->fetch()) continue;

        $db->prepare(
            'INSERT INTO schedule_settings
             (id, day_of_week, is_open, open_time, close_time, slot_duration_minutes, max_bookings_per_slot, min_prebooking_minutes)
             VALUES (?, ?, 1, ?, ?, 60, 3, 60)'
        )->execute([generateId(), $day, '08:00', '22:00']);
        $scheduleInserted++;
    }
    $log[] = "$scheduleInserted schedule rows created";

    $settings = [
        'whatsapp_number' => defined('WHATSAPP_NUMBER') ? WHATSAPP_NUMBER : '',
        'business_hours' => '08:00-22:00',
        'response_time_minutes' => '60',
        'site_name' => 'Drips To You - Bali',
        'site_email' => 'hello@dripstoyou.com',
    ];
    $settingsInserted = 0;
    foreach ($settings as $key => $value) {
        $check = $db->prepare('SELECT `key` FROM site_settings WHERE `key` = ? LIMIT 1');
        $check->execute([$key]);
        if ($check->fetch()) continue;
        setSiteSetting($key, (string)$value);
        $settingsInserted++;
    }
    $log[] = "$settingsInserted site settings created";

    $adminCount = (int)$db->query('SELECT COUNT(*) FROM admins')->fetchColumn();
    if ($adminCount === 0) {
        $db->prepare(
            'INSERT INTO admins
             (id, name, email, password_hash, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
        )->execute([
            generateId(),
            'Super Admin',
            $initialEmail,
            hashPassword($initialPassword),
            'SUPER_ADMIN',
            $now,
            $now,
        ]);
        $log[] = "Super admin created: $initialEmail";
    } else {
        $log[] = 'Admin already exists';
    }

    $log[] = 'Products, service areas, FAQs, and other public content were not seeded';
    jsonSuccess(['log' => $log], 'Seeding completed');
} catch (Throwable $error) {
    jsonError('Seeding failed', 500);
}

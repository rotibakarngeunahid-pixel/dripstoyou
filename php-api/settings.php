<?php
// GET /api/settings.php — public site settings (whatsapp, hours, response time)

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
$keys = ['whatsapp_number', 'business_hours', 'response_time_minutes'];
$in   = implode(',', array_fill(0, count($keys), '?'));

$stmt = $db->prepare("SELECT `key`, value_encrypted_or_json FROM site_settings WHERE `key` IN ($in)");
$stmt->execute($keys);
$rows = $stmt->fetchAll();

$map = [];
foreach ($rows as $r) {
    $map[$r['key']] = $r['value_encrypted_or_json'];
}

jsonSuccess([
    'whatsappNumber'      => $map['whatsapp_number']       ?? (defined('WHATSAPP_NUMBER') ? WHATSAPP_NUMBER : '6281200000000'),
    'businessHours'       => $map['business_hours']        ?? '08:00-22:00',
    'responseTimeMinutes' => (int)($map['response_time_minutes'] ?? 60),
]);

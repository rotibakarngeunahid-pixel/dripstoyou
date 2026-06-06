<?php
// GET   /api/admin/settings.php — get all site settings
// PATCH /api/admin/settings.php — update one or more settings

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin  = requireAuth();
$method = getMethod();
$db     = getDb();

if ($method === 'GET') {
    $stmt = $db->query("SELECT `key`, value_encrypted_or_json FROM site_settings");
    $rows = $stmt->fetchAll();
    $map  = [];
    foreach ($rows as $r) {
        $map[$r['key']] = $r['value_encrypted_or_json'];
    }
    jsonSuccess($map);
}

if ($method === 'PATCH') {
    $body = getBodyJson();
    if (empty($body)) jsonError('No settings provided', 422);

    $allowedKeys = [
        'whatsapp_number'       => '/^\d{10,15}$/',
        'business_hours'        => null,
        'response_time_minutes' => '/^\d+$/',
        'site_name'             => null,
        'site_email'            => null,
    ];

    $now = date('Y-m-d H:i:s');

    foreach ($body as $key => $value) {
        if (!array_key_exists($key, $allowedKeys)) continue;

        $value = (string)$value;
        if ($allowedKeys[$key] && !preg_match($allowedKeys[$key], $value)) {
            jsonError("Nilai untuk '$key' tidak valid", 422);
        }

        $chk = $db->prepare("SELECT `key` FROM site_settings WHERE `key` = ? LIMIT 1");
        $chk->execute([$key]);
        if ($chk->fetch()) {
            $db->prepare("UPDATE site_settings SET value_encrypted_or_json = ?, updated_by_admin_id = ?, updated_at = ? WHERE `key` = ?")
               ->execute([$value, $admin['admin_id'], $now, $key]);
        } else {
            $db->prepare("INSERT INTO site_settings (`key`, value_encrypted_or_json, updated_by_admin_id, updated_at) VALUES (?, ?, ?, ?)")
               ->execute([$key, $value, $admin['admin_id'], $now]);
        }
    }

    auditLog('UPDATE_WHATSAPP', $admin['admin_id'], 'SiteSetting', null, ['keys' => array_keys($body)]);
    jsonSuccess(null, 'Settings diperbarui');
}

jsonError('Method not allowed', 405);

<?php
// GET   /api/admin/settings.php — get all site settings
// PATCH /api/admin/settings.php — update one or more settings

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin  = requireAuth();
$method = getMethod();
$db     = getDb();
ensureCurrencySchema($db);

if ($method === 'GET') {
    $stmt = $db->query("SELECT `key`, value_encrypted_or_json FROM site_settings");
    $rows = $stmt->fetchAll();
    $map  = [];
    foreach ($rows as $r) {
        $map[$r['key']] = $r['value_encrypted_or_json'];
    }
    $map['default_currency'] = $map['default_currency'] ?? 'IDR';
    $map['currencySettings'] = getCurrencySettings($db);
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
        'default_currency'      => '/^(IDR|USD|AUD|EUR|SGD)$/',
        'currencySettings'      => null,
    ];

    $now = date('Y-m-d H:i:s');

    foreach ($body as $key => $value) {
        if (!array_key_exists($key, $allowedKeys)) continue;

        if ($key === 'currencySettings' && is_array($value)) {
            $stmt = $db->prepare(
                'UPDATE currency_settings
                 SET is_active = ?, manual_rate_to_idr = ?, updated_at = ?
                 WHERE code = ?'
            );
            foreach ($value as $currency) {
                if (!is_array($currency)) continue;
                $code = normalizeCurrencyCode($currency['code'] ?? '');
                $manualRate = isset($currency['manualRateToIdr']) && $currency['manualRateToIdr'] !== ''
                    ? max(0, (float)$currency['manualRateToIdr'])
                    : null;
                $stmt->execute([
                    isset($currency['isActive']) ? ((bool)$currency['isActive'] ? 1 : 0) : 1,
                    $manualRate,
                    $now,
                    $code,
                ]);
            }
            continue;
        }

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

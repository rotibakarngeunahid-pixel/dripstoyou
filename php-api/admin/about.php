<?php
// GET/PUT /api/admin/about.php

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
$method = getMethod();
$settingKey = 'about_content';

$empty = [
    'en' => [
        'heroTagline' => '',
        'heroParagraph' => '',
        'missionStatement' => '',
        'teamIntro' => '',
    ],
    'id' => [
        'heroTagline' => '',
        'heroParagraph' => '',
        'missionStatement' => '',
        'teamIntro' => '',
    ],
];

if ($method === 'GET') {
    $stored = json_decode(getSiteSetting($settingKey, '') ?? '', true);
    jsonSuccess(is_array($stored) ? array_replace_recursive($empty, $stored) : $empty);
}

if ($method === 'PUT') {
    $body = getBodyJson();
    $clean = $empty;
    foreach (['en', 'id'] as $lang) {
        $source = isset($body[$lang]) && is_array($body[$lang]) ? $body[$lang] : [];
        foreach (array_keys($empty[$lang]) as $field) {
            $clean[$lang][$field] = str_clean($source[$field] ?? '', 5000);
        }
    }
    setSiteSetting($settingKey, json_encode($clean, JSON_UNESCAPED_UNICODE), $admin['admin_id']);
    jsonSuccess($clean, 'Konten About berhasil disimpan');
}

jsonError('Method not allowed', 405);

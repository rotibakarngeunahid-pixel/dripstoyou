<?php
// GET /api/social-links.php

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

function publicSocialUrl(string $platform, string $value): ?string {
    $value = trim($value);
    if ($platform === 'WHATSAPP') {
        $digits = preg_replace('/\D/', '', $value);
        if (str_starts_with($digits, '0')) $digits = '62' . substr($digits, 1);
        elseif (str_starts_with($digits, '8')) $digits = '62' . $digits;
        return preg_match('/^\d{10,15}$/', $digits) ? 'https://wa.me/' . $digits : null;
    }
    if ($platform === 'INSTAGRAM') return 'https://instagram.com/' . ltrim($value, '@/');
    if ($platform === 'TIKTOK') return 'https://tiktok.com/@' . ltrim($value, '@/');
    if ($platform === 'EMAIL') return filter_var($value, FILTER_VALIDATE_EMAIL) ? 'mailto:' . $value : null;
    $url = preg_match('/^https?:\/\//i', $value) ? $value : 'https://' . $value;
    return filter_var($url, FILTER_VALIDATE_URL) ? $url : null;
}

$decoded = json_decode(getSiteSetting('social_links', '[]') ?? '[]', true);
$links = is_array($decoded) ? $decoded : [];
$public = [];
foreach ($links as $link) {
    if (empty($link['isActive'])) continue;
    $url = publicSocialUrl((string)($link['platform'] ?? ''), (string)($link['value'] ?? ''));
    if (!$url) continue;
    $public[] = [
        'id' => (string)($link['id'] ?? ''),
        'platform' => (string)($link['platform'] ?? ''),
        'label' => (string)($link['label'] ?? ''),
        'value' => (string)($link['value'] ?? ''),
        'normalizedUrl' => $url,
        'sortOrder' => (int)($link['sortOrder'] ?? 0),
    ];
}
usort($public, fn($a, $b) => $a['sortOrder'] <=> $b['sortOrder']);
jsonSuccess($public);

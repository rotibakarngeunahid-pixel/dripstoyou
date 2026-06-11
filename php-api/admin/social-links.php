<?php
// CRUD /api/admin/social-links.php

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
$method = getMethod();
// Menulis konten hanya untuk SUPER_ADMIN dan CONTENT_ADMIN.
if ($method !== 'GET') {
    requireRole($admin, 'SUPER_ADMIN', 'CONTENT_ADMIN');
}
$id = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$settingKey = 'social_links';

function loadSocialLinks(): array {
    $decoded = json_decode(getSiteSetting('social_links', '[]') ?? '[]', true);
    return is_array($decoded) ? array_values($decoded) : [];
}

function saveSocialLinks(array $links, string $adminId): void {
    setSiteSetting('social_links', json_encode(array_values($links), JSON_UNESCAPED_UNICODE), $adminId);
}

function socialUrl(string $platform, string $value): ?string {
    $value = trim($value);
    if ($value === '') return null;

    if ($platform === 'WHATSAPP') {
        $digits = preg_replace('/\D/', '', $value);
        if (str_starts_with($digits, '0')) $digits = '62' . substr($digits, 1);
        elseif (str_starts_with($digits, '8')) $digits = '62' . $digits;
        return preg_match('/^\d{10,15}$/', $digits) ? 'https://wa.me/' . $digits : null;
    }
    if ($platform === 'INSTAGRAM') {
        return 'https://instagram.com/' . ltrim($value, '@/');
    }
    if ($platform === 'TIKTOK') {
        return 'https://tiktok.com/@' . ltrim($value, '@/');
    }
    if ($platform === 'EMAIL') {
        return filter_var($value, FILTER_VALIDATE_EMAIL) ? 'mailto:' . $value : null;
    }
    if (in_array($platform, ['FACEBOOK', 'GOOGLE_MAPS', 'WEBSITE', 'CUSTOM'], true)) {
        $url = preg_match('/^https?:\/\//i', $value) ? $value : 'https://' . $value;
        return filter_var($url, FILTER_VALIDATE_URL) ? $url : null;
    }
    return null;
}

function formatSocialLink(array $link): array {
    return [
        'id' => (string)$link['id'],
        'platform' => (string)$link['platform'],
        'label' => (string)$link['label'],
        'value' => (string)$link['value'],
        'normalizedUrl' => socialUrl((string)$link['platform'], (string)$link['value']),
        'isActive' => (bool)$link['isActive'],
        'sortOrder' => (int)$link['sortOrder'],
    ];
}

function findSocialIndex(array $links, string $id): int {
    foreach ($links as $index => $link) {
        if (($link['id'] ?? null) === $id) return $index;
    }
    jsonError('Social link tidak ditemukan', 404);
}

if ($method === 'GET') {
    $links = array_map('formatSocialLink', loadSocialLinks());
    usort($links, fn($a, $b) => $a['sortOrder'] <=> $b['sortOrder']);
    jsonSuccess($links);
}

if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['platform', 'label', 'value']);
    $link = [
        'id' => generateId(),
        'platform' => strtoupper(str_clean($body['platform'], 30)),
        'label' => str_clean($body['label'], 100),
        'value' => str_clean($body['value'], 500),
        'isActive' => isset($body['isActive']) ? (bool)$body['isActive'] : true,
        'sortOrder' => (int)($body['sortOrder'] ?? 0),
    ];
    if (!socialUrl($link['platform'], $link['value'])) jsonError('Nilai social link tidak valid', 422);

    $links = loadSocialLinks();
    $links[] = $link;
    saveSocialLinks($links, $admin['admin_id']);
    jsonSuccess(formatSocialLink($link), 'Social link berhasil ditambahkan', 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) jsonError('ID social link wajib diisi', 400);
    $links = loadSocialLinks();
    $index = findSocialIndex($links, $id);
    $body = getBodyJson();
    $current = $links[$index];

    foreach (['platform', 'label', 'value', 'isActive', 'sortOrder'] as $field) {
        if (!array_key_exists($field, $body)) continue;
        $value = $body[$field];
        if ($field === 'platform') $value = strtoupper(str_clean($value, 30));
        if ($field === 'label') $value = str_clean($value, 100);
        if ($field === 'value') $value = str_clean($value, 500);
        if ($field === 'isActive') $value = (bool)$value;
        if ($field === 'sortOrder') $value = (int)$value;
        $current[$field] = $value;
    }
    if (!socialUrl($current['platform'], $current['value'])) jsonError('Nilai social link tidak valid', 422);

    $links[$index] = $current;
    saveSocialLinks($links, $admin['admin_id']);
    jsonSuccess(formatSocialLink($current), 'Social link berhasil diperbarui');
}

if ($method === 'DELETE') {
    if (!$id) jsonError('ID social link wajib diisi', 400);
    $links = loadSocialLinks();
    $index = findSocialIndex($links, $id);
    array_splice($links, $index, 1);
    saveSocialLinks($links, $admin['admin_id']);
    jsonSuccess(null, 'Social link berhasil dihapus');
}

jsonError('Method not allowed', 405);

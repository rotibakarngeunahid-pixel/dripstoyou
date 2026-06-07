<?php
// CRUD /api/admin/coverage.php

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
$method = getMethod();
$id = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db = getDb();

function formatArea(array $area): array {
    return [
        'id' => $area['id'],
        'name' => $area['name'],
        'slug' => $area['slug'],
        'isActive' => (bool)$area['is_active'],
        'estimatedArrivalMinutes' => $area['estimated_arrival_minutes'] !== null
            ? (int)$area['estimated_arrival_minutes']
            : null,
        'extraFeeAmount' => $area['extra_fee_amount'] !== null
            ? (int)$area['extra_fee_amount']
            : null,
        'note' => $area['note'],
        'sortOrder' => (int)$area['sort_order'],
    ];
}

function findArea(PDO $db, string $id): array {
    $stmt = $db->prepare('SELECT * FROM service_areas WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $area = $stmt->fetch();
    if (!$area) jsonError('Area layanan tidak ditemukan', 404);
    return $area;
}

if ($method === 'GET') {
    if ($id) jsonSuccess(formatArea(findArea($db, $id)));

    $rows = $db->query(
        'SELECT * FROM service_areas ORDER BY sort_order ASC, name ASC'
    )->fetchAll();
    jsonSuccess(array_map('formatArea', $rows));
}

if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'slug']);

    $name = str_clean($body['name'], 100);
    $slug = strtolower(str_clean($body['slug'], 100));
    if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
        jsonError('Slug hanya boleh berisi huruf kecil, angka, dan tanda minus', 422);
    }

    $check = $db->prepare('SELECT id FROM service_areas WHERE slug = ? LIMIT 1');
    $check->execute([$slug]);
    if ($check->fetch()) jsonError('Slug area sudah digunakan', 409);

    $newId = generateId();
    $stmt = $db->prepare(
        'INSERT INTO service_areas
         (id, name, slug, is_active, estimated_arrival_minutes, extra_fee_amount, note, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $newId,
        $name,
        $slug,
        isset($body['isActive']) ? ((bool)$body['isActive'] ? 1 : 0) : 1,
        isset($body['estimatedArrivalMinutes']) && $body['estimatedArrivalMinutes'] !== null
            ? max(1, (int)$body['estimatedArrivalMinutes'])
            : null,
        isset($body['extraFeeAmount']) && $body['extraFeeAmount'] !== null
            ? max(0, (int)$body['extraFeeAmount'])
            : null,
        isset($body['note']) && $body['note'] !== null ? str_clean($body['note'], 500) : null,
        (int)($body['sortOrder'] ?? 0),
    ]);

    auditLog('UPDATE_AREA', $admin['admin_id'], 'ServiceArea', $newId, ['operation' => 'create']);
    jsonSuccess(formatArea(findArea($db, $newId)), 'Area layanan berhasil ditambahkan', 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) jsonError('ID area wajib diisi', 400);
    findArea($db, $id);

    $body = getBodyJson();
    $map = [
        'name' => 'name',
        'slug' => 'slug',
        'isActive' => 'is_active',
        'estimatedArrivalMinutes' => 'estimated_arrival_minutes',
        'extraFeeAmount' => 'extra_fee_amount',
        'note' => 'note',
        'sortOrder' => 'sort_order',
    ];
    $updates = [];
    $params = [];

    foreach ($map as $input => $column) {
        if (!array_key_exists($input, $body)) continue;
        $value = $body[$input];

        if ($input === 'name') $value = str_clean($value, 100);
        if ($input === 'slug') {
            $value = strtolower(str_clean($value, 100));
            if (!preg_match('/^[a-z0-9-]+$/', $value)) {
                jsonError('Slug hanya boleh berisi huruf kecil, angka, dan tanda minus', 422);
            }
            $check = $db->prepare('SELECT id FROM service_areas WHERE slug = ? AND id <> ? LIMIT 1');
            $check->execute([$value, $id]);
            if ($check->fetch()) jsonError('Slug area sudah digunakan', 409);
        }
        if ($input === 'isActive') $value = $value ? 1 : 0;
        if ($input === 'estimatedArrivalMinutes') {
            $value = $value === null || $value === '' ? null : max(1, (int)$value);
        }
        if ($input === 'extraFeeAmount') {
            $value = $value === null || $value === '' ? null : max(0, (int)$value);
        }
        if ($input === 'note') $value = $value === null ? null : str_clean($value, 500);
        if ($input === 'sortOrder') $value = (int)$value;

        $updates[] = "`$column` = ?";
        $params[] = $value;
    }

    if (!empty($updates)) {
        $params[] = $id;
        $db->prepare('UPDATE service_areas SET ' . implode(', ', $updates) . ' WHERE id = ?')
            ->execute($params);
    }

    auditLog('UPDATE_AREA', $admin['admin_id'], 'ServiceArea', $id, ['operation' => 'update']);
    jsonSuccess(formatArea(findArea($db, $id)), 'Area layanan berhasil diperbarui');
}

if ($method === 'DELETE') {
    if (!$id) jsonError('ID area wajib diisi', 400);
    findArea($db, $id);
    $db->prepare('UPDATE service_areas SET is_active = 0 WHERE id = ?')->execute([$id]);
    auditLog('UPDATE_AREA', $admin['admin_id'], 'ServiceArea', $id, ['operation' => 'deactivate']);
    jsonSuccess(null, 'Area layanan dinonaktifkan');
}

jsonError('Method not allowed', 405);

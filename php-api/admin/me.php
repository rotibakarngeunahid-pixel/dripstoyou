<?php
// GET /api/admin/me.php — verify token and return current admin info

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');

$admin = requireAuth();

// Fetch permissions_json for the current admin
$db   = getDb();
$stmt = $db->prepare('SELECT permissions_json FROM admins WHERE id = ? LIMIT 1');
$stmt->execute([$admin['admin_id']]);
$row  = $stmt->fetch();
$perms = null;
if ($row && !empty($row['permissions_json'])) {
    $decoded = json_decode($row['permissions_json'], true);
    $perms   = is_array($decoded) ? $decoded : null;
}

jsonSuccess([
    'id'          => $admin['admin_id'],
    'name'        => $admin['name'],
    'email'       => $admin['email'],
    'role'        => $admin['role'],
    'permissions' => $perms,
]);

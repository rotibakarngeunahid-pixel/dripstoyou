<?php
// GET /api/admin/me.php — verify token and return current admin info

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('GET');

$admin = requireAuth();

jsonSuccess([
    'id'    => $admin['admin_id'],
    'name'  => $admin['name'],
    'email' => $admin['email'],
    'role'  => $admin['role'],
]);

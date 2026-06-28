<?php
// GET /php-api/crm/auth/me.php — verify token and return current CRM staff info

require_once __DIR__ . '/../_crm.php';
handleCors();
requireMethod('GET');

$staff = requireCRMAuth();

$perms = null;
if (!empty($staff['permissions_json'])) {
    $decoded = json_decode($staff['permissions_json'], true);
    $perms   = is_array($decoded) ? $decoded : null;
}

jsonSuccess([
    'id'          => $staff['staff_id'],
    'name'        => $staff['name'],
    'email'       => $staff['email'],
    'role'        => $staff['role'],
    'permissions' => $perms,
    'modules'     => crmEffectiveModules($staff),
]);

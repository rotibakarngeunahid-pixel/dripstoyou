<?php
// CRM Staff & Role endpoint (OWNER only — gated by 'staff' permission)
//   GET    /php-api/crm/staff.php          — list staff
//   POST   /php-api/crm/staff.php          — create/update (id optional)
//   DELETE /php-api/crm/staff.php?id=xxx   — permanently delete (hard delete)
//
// On create without a password, a strong one is generated and returned ONCE.

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'staff');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();

if ($method === 'GET') {
    $rows = $db->query('SELECT id, name, email, role, is_active, permissions_json, last_login_at FROM crm_staff ORDER BY created_at ASC')->fetchAll();
    foreach ($rows as &$r) {
        $r['permissions'] = !empty($r['permissions_json']) ? json_decode($r['permissions_json'], true) : null;
        unset($r['permissions_json']);
    }
    unset($r);
    jsonSuccess(['items' => $rows]);
}

if ($method === 'DELETE') {
    $delId = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
    if (!$delId) jsonError('ID wajib diisi', 400);

    $chk = $db->prepare('SELECT id, name, role FROM crm_staff WHERE id = ? LIMIT 1');
    $chk->execute([$delId]);
    $target = $chk->fetch();
    if (!$target) jsonError('Staff tidak ditemukan', 404);

    if ($delId === $staff['staff_id']) jsonError('Tidak bisa menghapus akun sendiri', 422);
    if ($target['role'] === 'OWNER') {
        $ownerCount = (int)$db->query("SELECT COUNT(*) FROM crm_staff WHERE role = 'OWNER'")->fetchColumn();
        if ($ownerCount <= 1) jsonError('Tidak bisa menghapus OWNER terakhir', 422);
    }

    $db->prepare('DELETE FROM crm_staff WHERE id = ?')->execute([$delId]);
    crmAuditLog($staff, 'STAFF', 'DELETE', $delId, "Hapus staff {$target['name']} ({$target['role']})");
    jsonSuccess(['id' => $delId], 'Staff dihapus');
}

if ($method === 'POST') {
    $body  = getBodyJson();
    $roles = ['OWNER', 'ADMIN', 'NURSE', 'FINANCE'];
    $sid   = !empty($body['id']) ? str_clean($body['id'], 191) : null;
    $now   = date('Y-m-d H:i:s');

    $name     = str_clean($body['name'] ?? '', 100);
    $role     = in_array($body['role'] ?? '', $roles, true) ? $body['role'] : null;
    $active   = array_key_exists('is_active', $body) ? (int)(bool)$body['is_active'] : 1;
    $permsArr = (isset($body['permissions']) && is_array($body['permissions'])) ? array_values($body['permissions']) : null;

    if ($sid) {
        // Update
        $chk = $db->prepare('SELECT id, role FROM crm_staff WHERE id = ? LIMIT 1');
        $chk->execute([$sid]);
        $existing = $chk->fetch();
        if (!$existing) jsonError('Staff tidak ditemukan', 404);
        if (!$name || !$role) jsonError('Nama dan role wajib diisi', 422);
        if ($permsArr !== null) {
            $permErr = crmValidateCustomModules($role, $permsArr);
            if ($permErr) jsonError($permErr, 422);
        }
        $perms = $permsArr !== null ? json_encode($permsArr) : null;

        $sets = ['name = ?', 'role = ?', 'is_active = ?', 'permissions_json = ?', 'updated_at = ?'];
        $args = [$name, $role, $active, $perms, $now];

        // Optional password reset
        $newPass = null;
        if (!empty($body['password'])) {
            $newPass = (string)$body['password'];
            if (strlen($newPass) < 8) jsonError('Password minimal 8 karakter', 422);
            $sets[] = 'password_hash = ?';
            $args[] = hashPassword($newPass);
        }
        $args[] = $sid;
        $db->prepare('UPDATE crm_staff SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
        crmAuditLog($staff, 'STAFF', 'UPDATE', $sid, "Update staff $name ($role)");
        jsonSuccess(['id' => $sid], 'Staff diperbarui');
    }

    // Create
    requireFields($body, ['name', 'email', 'role']);
    if (!$role) jsonError('Role tidak valid', 422);
    if ($permsArr !== null) {
        $permErr = crmValidateCustomModules($role, $permsArr);
        if ($permErr) jsonError($permErr, 422);
    }
    $perms = $permsArr !== null ? json_encode($permsArr) : null;
    $email = strtolower(trim((string)$body['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Email tidak valid', 422);

    $dup = $db->prepare('SELECT id FROM crm_staff WHERE email = ? LIMIT 1');
    $dup->execute([$email]);
    if ($dup->fetch()) jsonError('Email sudah terdaftar', 422);

    $generated = null;
    $password  = !empty($body['password']) ? (string)$body['password'] : null;
    if ($password === null) {
        $password  = rtrim(strtr(base64_encode(random_bytes(12)), '+/', 'Aa'), '=');
        $generated = $password;
    } elseif (strlen($password) < 8) {
        jsonError('Password minimal 8 karakter', 422);
    }

    $sid = generateId();
    $db->prepare('INSERT INTO crm_staff (id, name, email, password_hash, role, is_active, permissions_json, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
       ->execute([$sid, $name, $email, hashPassword($password), $role, $active, $perms, $now, $now]);

    // Link a nurse roster row for NURSE staff
    if ($role === 'NURSE') {
        $db->prepare('INSERT INTO nurses (id, staff_id, name, phone_encrypted, phone_last4, is_active, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
           ->execute([generateId(), $sid, $name, encryptField('0000000000'), '0000', $now, $now]);
    }

    crmAuditLog($staff, 'STAFF', 'CREATE', $sid, "Buat staff $name ($role)");
    jsonSuccess(['id' => $sid, 'generated_password' => $generated], 'Staff dibuat', 201);
}

jsonError('Method not allowed', 405);

<?php
// CRUD /api/admin/users.php — admin user management (SUPER_ADMIN only)

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin  = requireAuth();
$method = getMethod();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;
$db     = getDb();

$VALID_ROLES = ['SUPER_ADMIN', 'ADMIN_OPERASIONAL', 'CONTENT_ADMIN'];

// All operations require SUPER_ADMIN
if ($admin['role'] !== 'SUPER_ADMIN') {
    jsonError('Forbidden: SUPER_ADMIN only', 403);
}

function parsePermissions($json): ?array {
    if (empty($json)) return null;
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : null;
}

// ── GET — list all admins ──────────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare(
        'SELECT id, name, email, role, is_active, permissions_json, last_login_at, created_at
           FROM admins
          ORDER BY created_at ASC'
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $admins = array_map(function ($row) {
        return [
            'id'            => $row['id'],
            'name'          => $row['name'],
            'email'         => $row['email'],
            'role'          => $row['role'],
            'isActive'      => (bool)$row['is_active'],
            'permissions'   => parsePermissions($row['permissions_json']),
            'lastLoginAt'   => $row['last_login_at'],
            'createdAt'     => $row['created_at'],
        ];
    }, $rows);

    jsonSuccess($admins);
}

// ── POST — create new admin ────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'email', 'password', 'role']);

    $name     = str_clean($body['name'], 191);
    $email    = strtolower(trim(str_clean($body['email'], 191)));
    $password = (string)($body['password'] ?? '');
    $role     = str_clean($body['role'], 32);
    $isActive = isset($body['isActive']) ? (bool)$body['isActive'] : true;
    $permJson = isset($body['permissions']) && is_array($body['permissions'])
                ? json_encode($body['permissions']) : null;

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Email tidak valid', 422);
    if (!in_array($role, $VALID_ROLES, true)) jsonError('Role tidak valid', 422);
    if (strlen($password) < 8) jsonError('Password minimal 8 karakter', 422);
    if (mb_strlen($name) < 2) jsonError('Nama minimal 2 karakter', 422);

    // Email uniqueness check
    $check = $db->prepare('SELECT id FROM admins WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) jsonError('Email sudah digunakan', 409);

    $newId    = generateId();
    $passHash = hashPassword($password);
    $now      = date('Y-m-d H:i:s');

    $stmt = $db->prepare(
        'INSERT INTO admins (id, name, email, password_hash, role, is_active, permissions_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$newId, $name, $email, $passHash, $role, $isActive ? 1 : 0, $permJson, $now, $now]);

    auditLog('CREATE_ADMIN', $admin['admin_id'], 'Admin', $newId, [
        'name'  => $name,
        'email' => $email,
        'role'  => $role,
    ]);

    jsonSuccess([
        'id'          => $newId,
        'name'        => $name,
        'email'       => $email,
        'role'        => $role,
        'isActive'    => $isActive,
        'permissions' => parsePermissions($permJson),
    ], 'Admin berhasil dibuat', 201);
}

// ── PUT — update admin ────────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) jsonError('ID diperlukan', 400);

    $body = getBodyJson();

    // Fetch existing admin
    $fetch = $db->prepare('SELECT id, name, email, role, is_active, permissions_json FROM admins WHERE id = ? LIMIT 1');
    $fetch->execute([$id]);
    $target = $fetch->fetch();
    if (!$target) jsonError('Admin tidak ditemukan', 404);

    // Cannot deactivate or change role of self
    if ($id === $admin['admin_id']) {
        if (isset($body['isActive']) && !(bool)$body['isActive']) {
            jsonError('Anda tidak dapat menonaktifkan akun sendiri', 403);
        }
        if (isset($body['role']) && $body['role'] !== $target['role']) {
            jsonError('Anda tidak dapat mengubah role akun sendiri', 403);
        }
    }

    $name     = isset($body['name'])     ? str_clean($body['name'], 191)     : $target['name'];
    $email    = isset($body['email'])    ? strtolower(trim(str_clean($body['email'], 191))) : $target['email'];
    $role     = isset($body['role'])     ? str_clean($body['role'], 32)      : $target['role'];
    $isActive = isset($body['isActive']) ? (bool)$body['isActive']           : (bool)$target['is_active'];
    $permJson = isset($body['permissions']) && is_array($body['permissions'])
                ? json_encode($body['permissions']) : $target['permissions_json'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Email tidak valid', 422);
    if (!in_array($role, $VALID_ROLES, true)) jsonError('Role tidak valid', 422);
    if (mb_strlen($name) < 2) jsonError('Nama minimal 2 karakter', 422);

    // Email uniqueness (allow same email for same admin)
    if ($email !== $target['email']) {
        $check = $db->prepare('SELECT id FROM admins WHERE email = ? AND id != ? LIMIT 1');
        $check->execute([$email, $id]);
        if ($check->fetch()) jsonError('Email sudah digunakan', 409);
    }

    $sets  = 'name = ?, email = ?, role = ?, is_active = ?, permissions_json = ?, updated_at = ?';
    $binds = [$name, $email, $role, $isActive ? 1 : 0, $permJson, date('Y-m-d H:i:s')];

    // Optional password change
    if (!empty($body['password'])) {
        $newPass = (string)$body['password'];
        if (strlen($newPass) < 8) jsonError('Password minimal 8 karakter', 422);
        $sets    .= ', password_hash = ?';
        $binds[]  = hashPassword($newPass);
    }

    $binds[] = $id;
    $stmt    = $db->prepare("UPDATE admins SET {$sets} WHERE id = ?");
    $stmt->execute($binds);

    auditLog('UPDATE_ADMIN', $admin['admin_id'], 'Admin', $id, [
        'name'     => $name,
        'email'    => $email,
        'role'     => $role,
        'isActive' => $isActive,
    ]);

    jsonSuccess([
        'id'          => $id,
        'name'        => $name,
        'email'       => $email,
        'role'        => $role,
        'isActive'    => $isActive,
        'permissions' => parsePermissions($permJson),
    ], 'Admin berhasil diperbarui');
}

// ── DELETE — deactivate admin (soft delete) ────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) jsonError('ID diperlukan', 400);

    if ($id === $admin['admin_id']) {
        jsonError('Anda tidak dapat menghapus akun sendiri', 403);
    }

    $fetch = $db->prepare('SELECT id, name, email FROM admins WHERE id = ? LIMIT 1');
    $fetch->execute([$id]);
    $target = $fetch->fetch();
    if (!$target) jsonError('Admin tidak ditemukan', 404);

    // Revoke all active sessions for this admin
    $db->prepare('UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = ? AND revoked_at IS NULL')
       ->execute([$id]);

    // Soft delete: deactivate
    $db->prepare('UPDATE admins SET is_active = 0, updated_at = NOW() WHERE id = ?')
       ->execute([$id]);

    auditLog('DELETE_ADMIN', $admin['admin_id'], 'Admin', $id, [
        'name'  => $target['name'],
        'email' => $target['email'],
    ]);

    jsonSuccess(null, 'Admin berhasil dinonaktifkan');
}

jsonError('Method not allowed', 405);

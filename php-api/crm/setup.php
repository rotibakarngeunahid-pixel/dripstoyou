<?php
// CRM first-run setup — create the very first OWNER account from the panel,
// so the seed endpoint is NOT required.
//
//   GET  /php-api/crm/setup.php           → { needs_setup: bool }
//   POST /php-api/crm/setup.php {name,email,password}  → creates first OWNER
//
// POST only works while crm_staff is EMPTY. Once any staff exists it returns 403,
// so this can never be used to escalate after initial setup. All further accounts
// are managed from /crm/staff (OWNER only).

require_once __DIR__ . '/_crm.php';
handleCors();

$db    = getDb();
$count = (int)$db->query('SELECT COUNT(*) FROM crm_staff')->fetchColumn();

// An active website admin that maps to a CRM role can already log in via the
// single-login bridge, so setup is only needed when there is no way in at all.
$bridgeAdmins = (int)$db->query(
    "SELECT COUNT(*) FROM admins WHERE is_active = 1 AND role IN ('SUPER_ADMIN','ADMIN_OPERASIONAL')"
)->fetchColumn();

if (getMethod() === 'GET') {
    jsonSuccess(['needs_setup' => ($count === 0 && $bridgeAdmins === 0)]);
}

requireMethod('POST');

if ($count > 0) {
    jsonError('Setup sudah selesai. Tambah akun lewat menu Staff & Role.', 403);
}

$body = getBodyJson();
requireFields($body, ['name', 'email', 'password']);

$name     = str_clean($body['name'], 100);
$email    = strtolower(trim((string)$body['email']));
$password = (string)$body['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Email tidak valid', 422);
if (strlen($password) < 8) jsonError('Password minimal 8 karakter', 422);

$now = date('Y-m-d H:i:s');
$sid = generateId();
$db->prepare('INSERT INTO crm_staff (id, name, email, password_hash, role, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, "OWNER", 1, ?, ?)')
   ->execute([$sid, $name, $email, hashPassword($password), $now, $now]);

crmAuditLog(['staff_id' => $sid, 'name' => $name, 'role' => 'OWNER'], 'STAFF', 'SETUP', $sid, 'Akun OWNER pertama dibuat');

jsonSuccess(['id' => $sid], 'Akun OWNER berhasil dibuat. Silakan login.', 201);

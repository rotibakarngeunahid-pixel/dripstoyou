<?php
// POST /php-api/crm/auth/login.php — CRM staff authentication
//
// Single login portal: accepts either a CRM-native account (crm_staff) OR an
// existing website admin (admins). Admins are mapped to a CRM role via
// crmRoleForAdmin() (SUPER_ADMIN→OWNER, ADMIN_OPERASIONAL→ADMIN) and get an
// auto-provisioned crm_staff identity row so sessions/audit/FKs work unchanged.
// The admin password stays the single source of truth (re-verified every login).
//
// Returns: { success, data: { token, staff, modules } }

require_once __DIR__ . '/../_crm.php';
handleCors();
requireMethod('POST');

$body = getBodyJson();
requireFields($body, ['email', 'password']);

$email    = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 1) {
    jsonError('Email atau password salah', 401);
}

$ipHash    = getIpHash();
$emailHash = hash('sha256', $email);
checkLoginRateLimit($ipHash, $emailHash);

$db        = getDb();
$now       = date('Y-m-d H:i:s');
$attemptId = generateId();

function crmLogFailed(PDO $db, string $attemptId, string $emailHash, string $ipHash, string $now, string $reason): void {
    $db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, failure_reason, created_at) VALUES (?, ?, ?, 0, ?, ?)')
       ->execute([$attemptId, $emailHash, $ipHash, $reason, $now]);
}

$authed = null; // ['id','name','email','role','permissions_json']

// 1. CRM-native account
$stmt = $db->prepare('SELECT id, name, email, password_hash, role, is_active, permissions_json FROM crm_staff WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$staff = $stmt->fetch();

if ($staff && (bool)$staff['is_active'] && verifyPassword($password, $staff['password_hash'])) {
    $authed = $staff;
} else {
    // 2. Bridge to existing website admin
    $aStmt = $db->prepare('SELECT id, name, email, password_hash, role, is_active FROM admins WHERE email = ? LIMIT 1');
    $aStmt->execute([$email]);
    $admin = $aStmt->fetch();

    if ($admin && (bool)$admin['is_active'] && verifyPassword($password, $admin['password_hash'])) {
        $crmRole = crmRoleForAdmin((string)$admin['role']);
        if ($crmRole === null) {
            jsonError('Akun ini tidak memiliki akses CRM.', 403);
        }
        if ($staff) {
            // Existing CRM identity row for this email — reuse (keeps any custom role/permissions)
            $authed = $staff;
        } else {
            // Auto-provision a CRM identity row. Password is a random placeholder —
            // this account always authenticates via the admin record above.
            $sid = generateId();
            $db->prepare('INSERT INTO crm_staff (id, name, email, password_hash, role, is_active, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
               ->execute([$sid, $admin['name'], $admin['email'], hashPassword(bin2hex(random_bytes(32))), $crmRole, $now, $now]);
            $authed = ['id' => $sid, 'name' => $admin['name'], 'email' => $admin['email'], 'role' => $crmRole, 'permissions_json' => null];
        }
    }
}

if (!$authed) {
    crmLogFailed($db, $attemptId, $emailHash, $ipHash, $now, 'crm_invalid');
    jsonError('Email atau password salah', 401);
}

// Create session
$rawToken  = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);
$hours     = defined('SESSION_DURATION_HOURS') ? (int)SESSION_DURATION_HOURS : 8;
$expiresAt = date('Y-m-d H:i:s', strtotime("+{$hours} hours"));

$db->prepare('INSERT INTO crm_sessions (id, staff_id, session_token_hash, ip_address_hash, expires_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?)')
   ->execute([generateId(), $authed['id'], $tokenHash, $ipHash, $expiresAt, $now]);

$db->prepare('UPDATE crm_staff SET last_login_at = ? WHERE id = ?')->execute([$now, $authed['id']]);
$db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, created_at) VALUES (?, ?, ?, 1, ?)')
   ->execute([$attemptId, $emailHash, $ipHash, $now]);

crmAuditLog(['staff_id' => $authed['id'], 'name' => $authed['name'], 'role' => $authed['role']], 'AUTH', 'LOGIN', $authed['id'], 'Login success');

jsonSuccess([
    'token'   => $rawToken,
    'staff'   => [
        'id'    => $authed['id'],
        'name'  => $authed['name'],
        'email' => $authed['email'],
        'role'  => $authed['role'],
    ],
    'modules' => crmEffectiveModules($authed),
]);

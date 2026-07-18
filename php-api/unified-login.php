<?php
// POST /php-api/unified-login.php — single-portal login (website admin + CRM staff)
//
// The /login page used to authenticate by calling admin/login.php and
// crm/auth/login.php back-to-back. Each endpoint records its own row in
// login_attempts, so a single user action could count 2 failures (wrong
// password) — and even a SUCCESSFUL login of a CRM-only account (nurse/
// finance) still logged 1 failure from the admin lookup. With the shared
// 5-failures-per-15-minutes limit, real users got locked out after ~3 typos.
//
// This endpoint checks both identities in ONE request and records exactly one
// login_attempts row per call. The old endpoints remain for backward compat
// (the Next.js route falls back to them until this file is deployed).
//
// Returns: { success, data: { admin?: {token, admin}, crm?: {token, staff, modules} } }

require_once __DIR__ . '/crm/_crm.php';
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

$db  = getDb();
$now = date('Y-m-d H:i:s');

// ── Website admin identity ─────────────────────────────────────────────────────
$aStmt = $db->prepare('SELECT id, name, email, password_hash, role, is_active FROM admins WHERE email = ? LIMIT 1');
$aStmt->execute([$email]);
$admin   = $aStmt->fetch();
$adminOk = $admin && (bool)$admin['is_active'] && verifyPassword($password, $admin['password_hash']);

// ── CRM identity (native crm_staff, or bridged from the admin record) ──────────
$crmAuthed = null;
$staffRow  = null;
if (tableExists($db, 'crm_staff')) {
    $sStmt = $db->prepare('SELECT id, name, email, password_hash, role, is_active, permissions_json FROM crm_staff WHERE email = ? LIMIT 1');
    $sStmt->execute([$email]);
    $staffRow = $sStmt->fetch();

    if ($staffRow && (bool)$staffRow['is_active'] && verifyPassword($password, $staffRow['password_hash'])) {
        $crmAuthed = $staffRow;
    } elseif ($adminOk) {
        $crmRole = crmRoleForAdmin((string)$admin['role']);
        if ($crmRole !== null) {
            if ($staffRow && (bool)$staffRow['is_active']) {
                // Existing CRM identity row for this email — reuse (keeps custom role/permissions).
                $crmAuthed = $staffRow;
            } elseif (!$staffRow) {
                // Auto-provision a CRM identity row. Password is a random placeholder —
                // this account always authenticates via the admin record above.
                $sid = generateId();
                $db->prepare('INSERT INTO crm_staff (id, name, email, password_hash, role, is_active, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
                   ->execute([$sid, $admin['name'], $admin['email'], hashPassword(bin2hex(random_bytes(32))), $crmRole, $now, $now]);
                $crmAuthed = ['id' => $sid, 'name' => $admin['name'], 'email' => $admin['email'], 'role' => $crmRole, 'permissions_json' => null];
            }
            // $staffRow inactive → no CRM session (deactivation is respected).
        }
    }
}

$attemptId = generateId();

if (!$adminOk && !$crmAuthed) {
    $db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, failure_reason, created_at) VALUES (?, ?, ?, 0, ?, ?)')
       ->execute([$attemptId, $emailHash, $ipHash, 'unified_invalid', $now]);
    auditLog('LOGIN_FAILED', null, null, null, ['reason' => 'unified_invalid']);
    jsonError('Email atau password salah', 401);
}

$db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, created_at) VALUES (?, ?, ?, 1, ?)')
   ->execute([$attemptId, $emailHash, $ipHash, $now]);

$data = [];

if ($adminOk) {
    $rawToken  = bin2hex(random_bytes(32));
    $hours     = defined('SESSION_DURATION_HOURS') ? (int)SESSION_DURATION_HOURS : 8;
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$hours} hours"));
    $db->prepare('INSERT INTO admin_sessions (id, admin_id, session_token_hash, ip_address_hash, expires_at, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)')
       ->execute([generateId(), $admin['id'], hash('sha256', $rawToken), $ipHash, $expiresAt, $now]);
    $db->prepare('UPDATE admins SET last_login_at = ? WHERE id = ?')->execute([$now, $admin['id']]);
    auditLog('LOGIN_SUCCESS', $admin['id']);
    $data['admin'] = [
        'token' => $rawToken,
        'admin' => ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'], 'role' => $admin['role']],
    ];
}

if ($crmAuthed) {
    $rawToken  = bin2hex(random_bytes(32));
    $hours     = defined('SESSION_DURATION_HOURS') ? (int)SESSION_DURATION_HOURS : 8;
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$hours} hours"));
    $db->prepare('INSERT INTO crm_sessions (id, staff_id, session_token_hash, ip_address_hash, expires_at, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)')
       ->execute([generateId(), $crmAuthed['id'], hash('sha256', $rawToken), $ipHash, $expiresAt, $now]);
    $db->prepare('UPDATE crm_staff SET last_login_at = ? WHERE id = ?')->execute([$now, $crmAuthed['id']]);
    crmAuditLog(['staff_id' => $crmAuthed['id'], 'name' => $crmAuthed['name'], 'role' => $crmAuthed['role']], 'AUTH', 'LOGIN', $crmAuthed['id'], 'Login success');
    $data['crm'] = [
        'token'   => $rawToken,
        'staff'   => ['id' => $crmAuthed['id'], 'name' => $crmAuthed['name'], 'email' => $crmAuthed['email'], 'role' => $crmAuthed['role']],
        'modules' => crmEffectiveModules($crmAuthed),
    ];
}

jsonSuccess($data);

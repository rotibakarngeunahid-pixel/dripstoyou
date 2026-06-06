<?php
// POST /api/admin/login.php — admin authentication
// Returns: { success, data: { token, admin } }

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('POST');

$body = getBodyJson();
requireFields($body, ['email', 'password']);

$email    = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 1) {
    jsonError('Kredensial tidak valid', 401);
}

$ipHash    = getIpHash();
$emailHash = hash('sha256', $email);

// Rate limit: max 5 failed attempts per 15 min per email/IP
checkLoginRateLimit($ipHash, $emailHash);

$db = getDb();

// Look up admin by email
$stmt = $db->prepare('SELECT id, name, email, password_hash, role, is_active FROM admins WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$admin = $stmt->fetch();

// Record attempt
$attemptId = generateId();
$now       = date('Y-m-d H:i:s');

if (!$admin || !(bool)$admin['is_active']) {
    // Log failed attempt
    $ins = $db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, failure_reason, created_at) VALUES (?, ?, ?, 0, ?, ?)');
    $ins->execute([$attemptId, $emailHash, $ipHash, 'not_found', $now]);
    auditLog('LOGIN_FAILED', null, null, null, ['reason' => 'not_found']);
    jsonError('Kredensial tidak valid', 401);
}

if (!verifyPassword($password, $admin['password_hash'])) {
    $ins = $db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, failure_reason, created_at) VALUES (?, ?, ?, 0, ?, ?)');
    $ins->execute([$attemptId, $emailHash, $ipHash, 'wrong_password', $now]);
    auditLog('LOGIN_FAILED', $admin['id'], null, null, ['reason' => 'wrong_password']);
    jsonError('Kredensial tidak valid', 401);
}

// Generate session token
$rawToken   = bin2hex(random_bytes(32)); // 64-char hex
$tokenHash  = hash('sha256', $rawToken);
$expiresAt  = date('Y-m-d H:i:s', strtotime('+' . SESSION_DURATION_HOURS . ' hours'));
$sessionId  = generateId();

$ins = $db->prepare(
    'INSERT INTO admin_sessions (id, admin_id, session_token_hash, ip_address_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$ins->execute([$sessionId, $admin['id'], $tokenHash, $ipHash, $expiresAt, $now]);

// Update last_login_at
$db->prepare('UPDATE admins SET last_login_at = ? WHERE id = ?')->execute([$now, $admin['id']]);

// Log success
$ins = $db->prepare('INSERT INTO login_attempts (id, email_hash, ip_address_hash, success, created_at) VALUES (?, ?, ?, 1, ?)');
$ins->execute([$attemptId, $emailHash, $ipHash, $now]);
auditLog('LOGIN_SUCCESS', $admin['id']);

jsonSuccess([
    'token' => $rawToken,
    'admin' => [
        'id'    => $admin['id'],
        'name'  => $admin['name'],
        'email' => $admin['email'],
        'role'  => $admin['role'],
    ],
]);

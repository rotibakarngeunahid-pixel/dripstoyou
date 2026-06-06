<?php
// POST /api/admin/logout.php — revoke admin session token

require_once __DIR__ . '/../helpers.php';
handleCors();
requireMethod('POST');

$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
    $token = trim($m[1]);
    $hash  = hash('sha256', $token);

    $db   = getDb();
    $stmt = $db->prepare(
        'SELECT s.id, s.admin_id FROM admin_sessions s
         WHERE  s.session_token_hash = ? AND s.revoked_at IS NULL LIMIT 1'
    );
    $stmt->execute([$hash]);
    $session = $stmt->fetch();

    if ($session) {
        $db->prepare('UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ?')->execute([$session['id']]);
        auditLog('LOGOUT', $session['admin_id']);
    }
}

jsonSuccess(null, 'Logged out');

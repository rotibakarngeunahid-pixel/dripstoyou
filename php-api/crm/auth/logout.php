<?php
// POST /php-api/crm/auth/logout.php — revoke CRM session token

require_once __DIR__ . '/../_crm.php';
handleCors();
requireMethod('POST');

$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
    $token = trim($m[1]);
    $hash  = hash('sha256', $token);

    $db   = getDb();
    $stmt = $db->prepare('SELECT id, staff_id FROM crm_sessions WHERE session_token_hash = ? AND revoked_at IS NULL LIMIT 1');
    $stmt->execute([$hash]);
    $session = $stmt->fetch();

    if ($session) {
        $db->prepare('UPDATE crm_sessions SET revoked_at = NOW(3) WHERE id = ?')->execute([$session['id']]);
        crmAuditLog(['staff_id' => $session['staff_id']], 'AUTH', 'LOGOUT', $session['staff_id'], 'Logout');
    }
}

jsonSuccess(null, 'Logged out');

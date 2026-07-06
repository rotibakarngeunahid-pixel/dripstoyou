<?php
// CRM Consent Link endpoint — generate/revoke a shareable public link so the
// client can fill informed consent themselves, instead of only the nurse
// handing over her phone/tablet in person. The public side lives at
// /php-api/consent-public.php (no CRM auth — the token itself is the credential).
//   GET  /php-api/crm/consent-link.php?bookingId=xxx   → current active link status
//   POST /php-api/crm/consent-link.php?bookingId=xxx   → { action?: "revoke" }, default creates

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'consent');

$linkTtlHours = 48;

$method    = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db        = getDb();
$bookingId = !empty($_GET['bookingId']) ? str_clean($_GET['bookingId'], 191) : null;
if (!$bookingId) jsonError('bookingId wajib diisi', 400);

$b = $db->prepare('SELECT crm_status FROM bookings WHERE id = ? LIMIT 1');
$b->execute([$bookingId]);
$booking = $b->fetch();
if (!$booking) jsonError('Booking tidak ditemukan', 404);

if ($method === 'GET') {
    $l = $db->prepare(
        'SELECT expires_at, used_at, created_at FROM consent_links
         WHERE booking_id = ? AND revoked_at IS NULL AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1'
    );
    $l->execute([$bookingId]);
    jsonSuccess(['active' => $l->fetch() ?: null]);
}

if ($method === 'POST') {
    $body   = getBodyJson();
    $action = $body['action'] ?? 'create';

    if ($action === 'revoke') {
        $db->prepare(
            'UPDATE consent_links SET revoked_at = NOW(3)
             WHERE booking_id = ? AND used_at IS NULL AND revoked_at IS NULL'
        )->execute([$bookingId]);
        crmAuditLog($staff, 'CONSENT', 'LINK_REVOKE', $bookingId, 'Link consent dicabut');
        jsonSuccess(null, 'Link dicabut');
    }

    // Same clinical guard as consent.php: only after screening is done, never on
    // a terminal booking (crmStatusRank is negative for NOT_ELIGIBLE/CANCELLED/etc).
    if (crmStatusRank((string)$booking['crm_status']) < crmStatusRank('SCREENING_COMPLETED')) {
        jsonError('Screening belum diselesaikan. Selesaikan screening sebelum mengirim link consent.', 409);
    }

    // Only one active (unused, unexpired, unrevoked) link per booking at a time —
    // sending a new link should invalidate any older one still floating in a chat.
    $db->prepare(
        'UPDATE consent_links SET revoked_at = NOW(3)
         WHERE booking_id = ? AND used_at IS NULL AND revoked_at IS NULL'
    )->execute([$bookingId]);

    $token = null;
    $tokenHash = null;
    for ($i = 0; $i < 5; $i++) {
        $candidate = crmGenerateShortToken();
        $hash = hash('sha256', $candidate);
        $chk = $db->prepare('SELECT id FROM consent_links WHERE token_hash = ? LIMIT 1');
        $chk->execute([$hash]);
        if (!$chk->fetch()) { $token = $candidate; $tokenHash = $hash; break; }
    }
    if (!$token) jsonError('Gagal membuat link, coba lagi', 500);

    $now = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$linkTtlHours} hours"));
    $id = generateId();
    $db->prepare(
        'INSERT INTO consent_links (id, booking_id, token_hash, created_by_staff_id, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$id, $bookingId, $tokenHash, $staff['staff_id'], $expiresAt, $now]);

    crmAuditLog($staff, 'CONSENT', 'LINK_CREATE', $bookingId, "Link consent dibuat, berlaku {$linkTtlHours} jam");

    jsonSuccess(['token' => $token, 'expiresAt' => $expiresAt], 'Link dibuat');
}

jsonError('Method not allowed', 405);

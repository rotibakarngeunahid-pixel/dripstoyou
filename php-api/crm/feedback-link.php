<?php
// CRM Feedback Link endpoint — generate/revoke/mark-sent a shareable public link
// so the client can rate & comment on a completed treatment themselves. The
// public side lives at /php-api/feedback-public.php (no CRM auth — the token
// itself is the credential).
//   GET  /php-api/crm/feedback-link.php?bookingId=xxx   → current active link status
//   POST /php-api/crm/feedback-link.php?bookingId=xxx   → { action?: "revoke"|"mark_sent" }, default creates

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'feedback');

$linkTtlHours = 168; // 7 hari — feedback diisi setelah treatment, tidak seurgent consent

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
        'SELECT expires_at, sent_at, viewed_at, used_at, created_at FROM feedback_links
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
            'UPDATE feedback_links SET revoked_at = NOW(3)
             WHERE booking_id = ? AND used_at IS NULL AND revoked_at IS NULL'
        )->execute([$bookingId]);
        crmAuditLog($staff, 'FEEDBACK', 'LINK_REVOKE', $bookingId, 'Link feedback dicabut');
        jsonSuccess(null, 'Link dicabut');
    }

    if ($action === 'mark_sent') {
        // Best-effort marker: set the moment the staff actually clicked "Kirim
        // WhatsApp"/"Salin Link" in the UI, distinct from when the link was
        // merely generated — there's no delivery receipt from wa.me itself.
        $db->prepare(
            'UPDATE feedback_links SET sent_at = NOW(3)
             WHERE booking_id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > NOW() AND sent_at IS NULL'
        )->execute([$bookingId]);
        crmAuditLog($staff, 'FEEDBACK', 'LINK_SENT', $bookingId, 'Link feedback ditandai terkirim');
        jsonSuccess(null, 'Ditandai terkirim');
    }

    // Feedback hanya masuk akal setelah treatment benar-benar selesai.
    if (crmStatusRank((string)$booking['crm_status']) < crmStatusRank('TREATMENT_COMPLETED')) {
        jsonError('Treatment belum ditandai selesai. Selesaikan treatment sebelum mengirim link feedback.', 409);
    }

    // Only one active (unused, unexpired, unrevoked) link per booking at a time.
    $db->prepare(
        'UPDATE feedback_links SET revoked_at = NOW(3)
         WHERE booking_id = ? AND used_at IS NULL AND revoked_at IS NULL'
    )->execute([$bookingId]);

    $token = null;
    $tokenHash = null;
    for ($i = 0; $i < 5; $i++) {
        $candidate = crmGenerateShortToken();
        $hash = hash('sha256', $candidate);
        $chk = $db->prepare('SELECT id FROM feedback_links WHERE token_hash = ? LIMIT 1');
        $chk->execute([$hash]);
        if (!$chk->fetch()) { $token = $candidate; $tokenHash = $hash; break; }
    }
    if (!$token) jsonError('Gagal membuat link, coba lagi', 500);

    $now = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$linkTtlHours} hours"));
    $id = generateId();
    $db->prepare(
        'INSERT INTO feedback_links (id, booking_id, token_hash, created_by_staff_id, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$id, $bookingId, $tokenHash, $staff['staff_id'], $expiresAt, $now]);

    crmAuditLog($staff, 'FEEDBACK', 'LINK_CREATE', $bookingId, "Link feedback dibuat, berlaku {$linkTtlHours} jam");

    jsonSuccess(['token' => $token, 'expiresAt' => $expiresAt], 'Link dibuat');
}

jsonError('Method not allowed', 405);

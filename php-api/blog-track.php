<?php
// POST /api/blog-track.php — public, fire-and-forget analytics beacon for the
// blog. Called from BlogArticleContent.tsx (view on mount, cta_click on the
// two CTA buttons, link_click on in-article links). Never blocks/breaks the
// article page: every failure path still returns a 2xx-shaped JSON body.
//
// Body: { postId, eventType, visitorId, referrer?, meta? }
//   - postId:    blog_posts.id, must currently be published
//   - eventType: 'view' | 'cta_click' | 'link_click' (extensible allow-list)
//   - visitorId: random client-generated id (cookie), NOT derived from IP/UA
//   - referrer:  client's `document.referrer` (original referring page, not
//                the HTTP Referer header of this beacon call itself)
//   - meta:      small optional object (e.g. { target }), stored as JSON,
//                capped at 500 chars

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('POST');

const SELF_HOST = 'dripstoyou.com';
const ALLOWED_EVENT_TYPES = ['view', 'cta_click', 'link_click'];
const TRACK_RATE_WINDOW_MINUTES = 5;
const TRACK_RATE_MAX_EVENTS = 120;

$ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');

// Bot traffic should never be logged, but must not error either — a scraper
// probing the endpoint shouldn't learn anything from the response.
if (botLikeUserAgent($ua)) {
    jsonSuccess(null, 'OK');
}

$ipHash = getIpHash();
$db = getDb();

// Lightweight abuse throttle, self-contained in the events table (no
// dependency on the CRM's audit-log-based limiter, which is semantically a
// different subsystem).
$rateStmt = $db->prepare(
    'SELECT COUNT(*) AS cnt FROM blog_post_events
     WHERE ip_hash = ? AND created_at > ?'
);
$rateStmt->execute([$ipHash, date('Y-m-d H:i:s', strtotime('-' . TRACK_RATE_WINDOW_MINUTES . ' minutes'))]);
if ((int)($rateStmt->fetch()['cnt'] ?? 0) >= TRACK_RATE_MAX_EVENTS) {
    // Quietly no-op instead of 429 — this is a passive beacon, not a form
    // submission the visitor needs feedback about.
    jsonSuccess(null, 'OK');
}

$body = getBodyJson();

$postId = isset($body['postId']) ? str_clean($body['postId'], 191) : '';
$eventType = isset($body['eventType']) ? str_clean($body['eventType'], 40) : '';
$visitorId = isset($body['visitorId']) ? str_clean($body['visitorId'], 64) : '';

if ($postId === '' || $visitorId === '' || !in_array($eventType, ALLOWED_EVENT_TYPES, true)) {
    jsonSuccess(null, 'OK'); // malformed beacon — ignore silently, don't error the page
}

$postStmt = $db->prepare(
    "SELECT id FROM blog_posts
     WHERE id = ? AND status = 'published' AND published_at IS NOT NULL AND published_at <= NOW()
     LIMIT 1"
);
$postStmt->execute([$postId]);
if (!$postStmt->fetch()) {
    jsonSuccess(null, 'OK'); // unknown/unpublished post — don't leak existence via error codes
}

$referrerInfo = classifyReferrer($body['referrer'] ?? null, SELF_HOST);
$deviceInfo = classifyDeviceUa($ua);
$country = isset($_SERVER['HTTP_CF_IPCOUNTRY']) ? strtoupper(str_clean($_SERVER['HTTP_CF_IPCOUNTRY'], 2)) : null;
if ($country === 'XX' || $country === '') $country = null;

$meta = null;
if (isset($body['meta']) && is_array($body['meta']) && !empty($body['meta'])) {
    $meta = str_clean(json_encode($body['meta'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 500);
}

$stmt = $db->prepare(
    'INSERT INTO blog_post_events
     (id, post_id, event_type, visitor_id, ip_hash, referrer_host, referrer_source, device_type, browser, os, country, meta_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
);
$stmt->execute([
    generateId(),
    $postId,
    $eventType,
    $visitorId,
    $ipHash,
    $referrerInfo['host'],
    $referrerInfo['source'],
    $deviceInfo['device'],
    $deviceInfo['browser'],
    $deviceInfo['os'],
    $country,
    $meta,
]);

if ($eventType === 'view') {
    $db->prepare('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?')->execute([$postId]);
}

jsonSuccess(null, 'OK');

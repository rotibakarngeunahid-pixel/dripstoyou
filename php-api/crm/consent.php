<?php
// CRM Consent endpoint
//   GET  /php-api/crm/consent.php?bookingId=xxx
//   POST /php-api/crm/consent.php   (record signed consent → CONSENT_SIGNED)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'consent');

$method    = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db        = getDb();
$bookingId = !empty($_GET['bookingId']) ? str_clean($_GET['bookingId'], 191) : null;

if ($method === 'GET') {
    if (!$bookingId) jsonError('bookingId wajib diisi', 400);
    $b = $db->prepare('SELECT b.id, b.booking_code_display, b.customer_name, b.crm_status, p.name AS product_name
                       FROM bookings b JOIN products p ON p.id = b.product_id WHERE b.id = ? LIMIT 1');
    $b->execute([$bookingId]);
    $booking = $b->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);

    $c = $db->prepare('SELECT id, patient_name, patient_name_signed, agreed_at, created_at FROM consents WHERE booking_id = ? LIMIT 1');
    $c->execute([$bookingId]);
    jsonSuccess(['booking' => $booking, 'consent' => $c->fetch() ?: null]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    $bookingId = str_clean($body['booking_id'] ?? $bookingId ?? '', 191);
    requireFields($body, ['patient_name_signed']);
    if (!$bookingId) jsonError('booking_id wajib diisi', 400);

    $b = $db->prepare('SELECT customer_name FROM bookings WHERE id = ? LIMIT 1');
    $b->execute([$bookingId]);
    $booking = $b->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);

    $nameSigned = str_clean($body['patient_name_signed'], 100);
    $sig        = !empty($body['signature_data']) ? encryptField((string)$body['signature_data']) : null;
    $now        = date('Y-m-d H:i:s');
    $ipHash     = getIpHash();

    $exists = $db->prepare('SELECT id FROM consents WHERE booking_id = ? LIMIT 1');
    $exists->execute([$bookingId]);
    $row = $exists->fetch();

    if ($row) {
        $db->prepare('UPDATE consents SET patient_name=?, patient_name_signed=?, signature_data_encrypted=?, agreed_at=?, ip_address_hash=? WHERE id=?')
           ->execute([$booking['customer_name'], $nameSigned, $sig, $now, $ipHash, $row['id']]);
        $cid = $row['id'];
    } else {
        $cid = generateId();
        $db->prepare('INSERT INTO consents (id, booking_id, patient_name, patient_name_signed, signature_data_encrypted, agreed_at, ip_address_hash, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
           ->execute([$cid, $bookingId, $booking['customer_name'], $nameSigned, $sig, $now, $ipHash, $now]);
    }

    crmAdvanceBookingStatus($db, $bookingId, 'CONSENT_SIGNED');
    crmAuditLog($staff, 'CONSENT', 'SIGN', $bookingId, "Consent ditandatangani: $nameSigned");

    jsonSuccess(['id' => $cid], 'Consent tersimpan');
}

jsonError('Method not allowed', 405);

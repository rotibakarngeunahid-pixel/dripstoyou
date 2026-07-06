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
    $b = $db->prepare('SELECT b.id, b.booking_code_display, b.customer_name, b.customer_phone_encrypted, b.crm_status, p.name AS product_name
                       FROM bookings b JOIN products p ON p.id = b.product_id WHERE b.id = ? LIMIT 1');
    $b->execute([$bookingId]);
    $booking = $b->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);
    $booking['phone'] = crmTryDecrypt($booking['customer_phone_encrypted'] ?? null, null);
    unset($booking['customer_phone_encrypted']);

    $c = $db->prepare('SELECT id, patient_name, patient_name_signed, consent_language, filled_by, agreed_at, created_at, signature_data_encrypted FROM consents WHERE booking_id = ? LIMIT 1');
    $c->execute([$bookingId]);
    $consent = $c->fetch() ?: null;
    if ($consent) {
        $consent['signature_data'] = crmTryDecrypt($consent['signature_data_encrypted'] ?? null, null);
        unset($consent['signature_data_encrypted']);
    }
    jsonSuccess(['booking' => $booking, 'consent' => $consent]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    $bookingId = str_clean($body['booking_id'] ?? $bookingId ?? '', 191);
    requireFields($body, ['patient_name_signed']);
    if (!$bookingId) jsonError('booking_id wajib diisi', 400);

    $b = $db->prepare('SELECT customer_name, crm_status FROM bookings WHERE id = ? LIMIT 1');
    $b->execute([$bookingId]);
    $booking = $b->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);

    // Flow guard: screening → consent → treatment. Consent may only be taken
    // after screening has been submitted (and never on a terminal booking).
    if (crmStatusRank((string)$booking['crm_status']) < crmStatusRank('SCREENING_COMPLETED')) {
        jsonError('Screening belum diselesaikan. Submit hasil screening terlebih dahulu sebelum mengambil consent.', 409);
    }

    $nameSigned = str_clean($body['patient_name_signed'], 100);
    $sig        = !empty($body['signature_data']) ? encryptField((string)$body['signature_data']) : null;
    // Language of the consent text the patient actually read — legal evidence.
    $lang       = in_array(($body['language'] ?? ''), ['en', 'id'], true) ? $body['language'] : null;
    $now        = date('Y-m-d H:i:s');
    $ipHash     = getIpHash();

    $exists = $db->prepare('SELECT id FROM consents WHERE booking_id = ? LIMIT 1');
    $exists->execute([$bookingId]);
    $row = $exists->fetch();

    if ($row) {
        // filled_by/consent_link_id reset to NURSE/NULL: a staff submission through
        // this endpoint always supersedes a prior client self-fill as the record of
        // who is currently vouching for this document.
        $db->prepare('UPDATE consents SET patient_name=?, patient_name_signed=?, signature_data_encrypted=?, consent_language=?, filled_by="NURSE", consent_link_id=NULL, agreed_at=?, ip_address_hash=? WHERE id=?')
           ->execute([$booking['customer_name'], $nameSigned, $sig, $lang, $now, $ipHash, $row['id']]);
        $cid = $row['id'];
    } else {
        $cid = generateId();
        $db->prepare('INSERT INTO consents (id, booking_id, patient_name, patient_name_signed, signature_data_encrypted, consent_language, filled_by, agreed_at, ip_address_hash, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, "NURSE", ?, ?, ?)')
           ->execute([$cid, $bookingId, $booking['customer_name'], $nameSigned, $sig, $lang, $now, $ipHash, $now]);
    }

    crmAdvanceBookingStatus($db, $bookingId, 'CONSENT_SIGNED');
    crmAuditLog($staff, 'CONSENT', 'SIGN', $bookingId, "Consent ditandatangani: $nameSigned" . ($lang ? " (bahasa: $lang)" : ''));

    jsonSuccess(['id' => $cid], 'Consent tersimpan');
}

jsonError('Method not allowed', 405);

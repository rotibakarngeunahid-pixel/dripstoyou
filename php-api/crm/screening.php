<?php
// CRM Screening endpoint
//   GET  /php-api/crm/screening.php?bookingId=xxx
//   POST /php-api/crm/screening.php   (upsert; submit:true advances booking status)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'screening');

$method    = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db        = getDb();
$bookingId = !empty($_GET['bookingId']) ? str_clean($_GET['bookingId'], 191) : (!empty($_GET['booking_id']) ? str_clean($_GET['booking_id'], 191) : null);

if ($method === 'GET') {
    if (!$bookingId) jsonError('bookingId wajib diisi', 400);
    $b = $db->prepare('SELECT b.id, b.booking_code_display, b.customer_name, b.crm_status, p.name AS product_name
                       FROM bookings b JOIN products p ON p.id = b.product_id WHERE b.id = ? LIMIT 1');
    $b->execute([$bookingId]);
    $booking = $b->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);

    $s = $db->prepare('SELECT * FROM screenings WHERE booking_id = ? LIMIT 1');
    $s->execute([$bookingId]);
    $sc = $s->fetch();
    if ($sc) {
        $sc['allergy_notes']    = crmTryDecrypt($sc['allergy_notes_encrypted'] ?? null, null);
        $sc['illness_notes']    = crmTryDecrypt($sc['illness_notes_encrypted'] ?? null, null);
        $sc['medication_notes'] = crmTryDecrypt($sc['medication_notes_encrypted'] ?? null, null);
        $sc['nurse_notes']      = crmTryDecrypt($sc['nurse_notes_encrypted'] ?? null, null);
        unset($sc['allergy_notes_encrypted'], $sc['illness_notes_encrypted'], $sc['medication_notes_encrypted'], $sc['nurse_notes_encrypted']);
    }
    jsonSuccess(['booking' => $booking, 'screening' => $sc ?: null]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    $bookingId = str_clean($body['booking_id'] ?? $bookingId ?? '', 191);
    if (!$bookingId) jsonError('booking_id wajib diisi', 400);

    $bp   = !empty($body['blood_pressure']) ? str_clean($body['blood_pressure'], 20) : null;
    if ($bp !== null && !preg_match('/^\d{2,3}\/\d{2,3}$/', $bp)) jsonError('Format tekanan darah tidak valid (contoh: 120/80)', 422);
    $temp = isset($body['temperature']) && $body['temperature'] !== '' ? (float)$body['temperature'] : null;
    if ($temp !== null && ($temp < 30 || $temp > 45)) jsonError('Suhu tidak valid', 422);
    $pulse = isset($body['pulse']) && $body['pulse'] !== '' ? (int)$body['pulse'] : null;
    if ($pulse !== null && ($pulse < 20 || $pulse > 250)) jsonError('Nadi tidak valid', 422);

    $hasAllergy   = !empty($body['has_allergy']);
    $hasIllness   = !empty($body['has_illness_history']);
    $takingMed    = !empty($body['taking_medication']);
    $pregnant     = in_array(($body['is_pregnant'] ?? 'NA'), ['YES','NO','NA'], true) ? $body['is_pregnant'] : 'NA';
    $conclusion   = in_array(($body['conclusion'] ?? 'NEEDS_REVIEW'), ['SAFE','NEEDS_REVIEW','NOT_RECOMMENDED'], true) ? $body['conclusion'] : 'NEEDS_REVIEW';
    $submit       = !empty($body['submit']);

    // Vitals are optional while drafting, but a final submit must actually
    // record them — the UI previously let nurses submit a completely empty
    // form since nothing here required it.
    if ($submit && ($bp === null || $temp === null || $pulse === null)) {
        jsonError('Tanda vital (tekanan darah, suhu, nadi) wajib diisi sebelum submit screening', 422);
    }

    $allergyNotes = $hasAllergy && !empty($body['allergy_notes']) ? encryptField(str_clean($body['allergy_notes'], 1000)) : null;
    $illnessNotes = $hasIllness && !empty($body['illness_notes']) ? encryptField(str_clean($body['illness_notes'], 1000)) : null;
    $medNotes     = $takingMed && !empty($body['medication_notes']) ? encryptField(str_clean($body['medication_notes'], 1000)) : null;
    $nurseNotes   = !empty($body['nurse_notes']) ? encryptField(str_clean($body['nurse_notes'], 2000)) : null;

    $nurseId = crmNurseIdForStaff($db, $staff['staff_id']);
    $now     = date('Y-m-d H:i:s');
    $submittedAt = $submit ? $now : null;

    $exists = $db->prepare('SELECT id FROM screenings WHERE booking_id = ? LIMIT 1');
    $exists->execute([$bookingId]);
    $row = $exists->fetch();

    if ($row) {
        $db->prepare(
            'UPDATE screenings SET nurse_id=?, blood_pressure=?, temperature=?, pulse=?, has_allergy=?, allergy_notes_encrypted=?,
                has_illness_history=?, illness_notes_encrypted=?, taking_medication=?, medication_notes_encrypted=?,
                is_pregnant=?, nurse_notes_encrypted=?, conclusion=?, submitted_at=COALESCE(?, submitted_at), updated_at=? WHERE id=?'
        )->execute([$nurseId, $bp, $temp, $pulse, (int)$hasAllergy, $allergyNotes, (int)$hasIllness, $illnessNotes,
            (int)$takingMed, $medNotes, $pregnant, $nurseNotes, $conclusion, $submittedAt, $now, $row['id']]);
        $sid = $row['id'];
    } else {
        $sid = generateId();
        $db->prepare(
            'INSERT INTO screenings (id, booking_id, nurse_id, blood_pressure, temperature, pulse, has_allergy, allergy_notes_encrypted,
                has_illness_history, illness_notes_encrypted, taking_medication, medication_notes_encrypted, is_pregnant,
                nurse_notes_encrypted, conclusion, submitted_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([$sid, $bookingId, $nurseId, $bp, $temp, $pulse, (int)$hasAllergy, $allergyNotes, (int)$hasIllness, $illnessNotes,
            (int)$takingMed, $medNotes, $pregnant, $nurseNotes, $conclusion, $submittedAt, $now, $now]);
    }

    if ($submit) {
        $target = $conclusion === 'NOT_RECOMMENDED' ? 'NOT_ELIGIBLE' : 'SCREENING_COMPLETED';
        if ($target === 'NOT_ELIGIBLE') {
            $db->prepare('UPDATE bookings SET crm_status=?, status=?, updated_at=? WHERE id=?')
               ->execute(['NOT_ELIGIBLE', crmStatusToLegacy('NOT_ELIGIBLE'), $now, $bookingId]);
        } else {
            crmAdvanceBookingStatus($db, $bookingId, 'SCREENING_COMPLETED');
        }
        crmAuditLog($staff, 'SCREENING', 'SUBMIT', $bookingId, "Screening submit: $conclusion");
    } else {
        // A saved draft means screening has begun — reflect it on the timeline.
        crmAdvanceBookingStatus($db, $bookingId, 'SCREENING_STARTED');
        crmAuditLog($staff, 'SCREENING', 'SAVE_DRAFT', $bookingId, 'Screening draft disimpan');
    }

    jsonSuccess(['id' => $sid, 'submitted' => $submit], $submit ? 'Screening disubmit' : 'Draft disimpan');
}

jsonError('Method not allowed', 405);

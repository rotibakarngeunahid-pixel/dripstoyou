<?php
// CRM Treatment endpoint
//   GET  /php-api/crm/treatment.php?bookingId=xxx
//   POST /php-api/crm/treatment.php   (upsert; complete:true → TREATMENT_COMPLETED + stock deduction)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'treatment');

$method    = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db        = getDb();
$bookingId = !empty($_GET['bookingId']) ? str_clean($_GET['bookingId'], 191) : null;

if ($method === 'GET') {
    if (!$bookingId) jsonError('bookingId wajib diisi', 400);
    $b = $db->prepare('SELECT b.id, b.booking_code_display, b.customer_name, b.booking_date, b.booking_time, b.crm_status, p.name AS product_name
                       FROM bookings b JOIN products p ON p.id = b.product_id WHERE b.id = ? LIMIT 1');
    $b->execute([$bookingId]);
    $booking = $b->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);
    $booking = crmAttachFormWindow($booking);

    $t = $db->prepare('SELECT * FROM treatments WHERE booking_id = ? LIMIT 1');
    $t->execute([$bookingId]);
    $tr = $t->fetch();
    if ($tr) {
        $tr['checklist']   = $tr['checklist_json'] ? json_decode($tr['checklist_json'], true) : [];
        $tr['items_used']  = $tr['items_used_json'] ? json_decode($tr['items_used_json'], true) : [];
        $tr['nurse_notes'] = crmTryDecrypt($tr['nurse_notes_encrypted'] ?? null, null);
        unset($tr['checklist_json'], $tr['items_used_json'], $tr['nurse_notes_encrypted']);
    }

    $c = $db->prepare('SELECT id, agreed_at FROM consents WHERE booking_id = ? LIMIT 1');
    $c->execute([$bookingId]);
    jsonSuccess(['booking' => $booking, 'treatment' => $tr ?: null, 'consent' => $c->fetch() ?: null]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    $bookingId = str_clean($body['booking_id'] ?? $bookingId ?? '', 191);
    if (!$bookingId) jsonError('booking_id wajib diisi', 400);

    $b = $db->prepare('SELECT id FROM bookings WHERE id = ? LIMIT 1');
    $b->execute([$bookingId]);
    if (!$b->fetch()) jsonError('Booking tidak ditemukan', 404);

    // Time gate: treatment hanya boleh didokumentasikan mendekati jadwal booking.
    crmRequireFormWindowOpen($db, $bookingId);

    // Flow guard: informed consent must be signed before any treatment record
    // is created or updated (screening → consent → treatment).
    $c = $db->prepare('SELECT agreed_at FROM consents WHERE booking_id = ? LIMIT 1');
    $c->execute([$bookingId]);
    $consent = $c->fetch();
    if (!$consent || empty($consent['agreed_at'])) {
        jsonError('Informed consent belum ditandatangani. Lengkapi consent pasien terlebih dahulu sebelum treatment.', 409);
    }

    $checklist  = isset($body['checklist']) && is_array($body['checklist']) ? $body['checklist'] : [];
    $itemsUsed  = isset($body['items_used']) && is_array($body['items_used']) ? $body['items_used'] : [];
    $nurseNotes = !empty($body['nurse_notes']) ? encryptField(str_clean($body['nurse_notes'], 2000)) : null;
    $condAfter  = !empty($body['patient_condition_after']) ? str_clean($body['patient_condition_after'], 500) : null;
    $followUp   = !empty($body['follow_up_recommendation']) ? str_clean($body['follow_up_recommendation'], 500) : null;
    $complete   = !empty($body['complete']);
    $nurseId    = crmNurseIdForStaff($db, $staff['staff_id']);
    $now        = date('Y-m-d H:i:s');

    $exists = $db->prepare('SELECT id, completed_at FROM treatments WHERE booking_id = ? LIMIT 1');
    $exists->execute([$bookingId]);
    $row = $exists->fetch();
    $alreadyCompleted = $row && !empty($row['completed_at']);

    $completedAt = $complete ? $now : null;
    $checklistJson = json_encode($checklist, JSON_UNESCAPED_UNICODE);
    $itemsJson     = json_encode($itemsUsed, JSON_UNESCAPED_UNICODE);

    if ($row) {
        $tid = $row['id'];
        $db->prepare('UPDATE treatments SET nurse_id=?, checklist_json=?, items_used_json=?, nurse_notes_encrypted=?,
            patient_condition_after=?, follow_up_recommendation=?, completed_at=COALESCE(?, completed_at), updated_at=? WHERE id=?')
           ->execute([$nurseId, $checklistJson, $itemsJson, $nurseNotes, $condAfter, $followUp, $completedAt, $now, $tid]);
    } else {
        $tid = generateId();
        $db->prepare('INSERT INTO treatments (id, booking_id, nurse_id, checklist_json, items_used_json, nurse_notes_encrypted,
            patient_condition_after, follow_up_recommendation, completed_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
           ->execute([$tid, $bookingId, $nurseId, $checklistJson, $itemsJson, $nurseNotes, $condAfter, $followUp, $completedAt, $now, $now]);
    }

    // A saved draft means the nurse is at the patient's side working — reflect
    // it on the timeline. Rank-based advance, so it never regresses a booking.
    if (!$complete) crmAdvanceBookingStatus($db, $bookingId, 'TREATMENT_IN_PROGRESS');

    if ($complete && !$alreadyCompleted) {
        // Deduct inventory once, at completion. Roll back the completion on failure.
        try {
            $db->beginTransaction();
            crmDeductInventory($db, $itemsUsed, $tid, $staff['staff_id']);
            crmAdvanceBookingStatus($db, $bookingId, 'TREATMENT_COMPLETED');
            $db->commit();
        } catch (RuntimeException $e) {
            if ($db->inTransaction()) $db->rollBack();
            // Revert completed_at so the nurse can fix items and retry.
            $db->prepare('UPDATE treatments SET completed_at = NULL WHERE id = ?')->execute([$tid]);
            jsonError($e->getMessage(), 422);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            jsonError('Gagal menyelesaikan treatment', 500);
        }
        crmAuditLog($staff, 'TREATMENT', 'COMPLETE', $bookingId, 'Treatment selesai, stok dikurangi');
        jsonSuccess(['id' => $tid, 'completed' => true], 'Treatment selesai');
    }

    crmAuditLog($staff, 'TREATMENT', 'SAVE', $bookingId, 'Treatment disimpan');
    jsonSuccess(['id' => $tid, 'completed' => $alreadyCompleted], 'Treatment disimpan');
}

jsonError('Method not allowed', 405);

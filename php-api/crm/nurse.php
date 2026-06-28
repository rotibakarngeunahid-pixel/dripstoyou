<?php
// CRM Nurse endpoint
//   GET  /php-api/crm/nurse.php                       — list nurses (+ workload for ?date=)
//   GET  /php-api/crm/nurse.php?portal=1&date=YYYY-MM-DD — bookings assigned to the logged-in nurse
//   POST /php-api/crm/nurse.php  {action:'assign', booking_id, nurse_id} — assign nurse to booking

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
$canManage = crmCan($staff, 'nurse');                       // ADMIN / OWNER
$canPortal = $canManage || crmCan($staff, 'nurse_portal');  // + NURSE
if (!$canPortal) jsonError('Forbidden', 403);

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();
$date   = !empty($_GET['date']) ? str_clean($_GET['date'], 10) : date('Y-m-d');

// ── Nurse portal: my bookings for a date ───────────────────────────────────────
if ($method === 'GET' && !empty($_GET['portal'])) {
    $nurseId = crmNurseIdForStaff($db, $staff['staff_id']);
    if (!$nurseId) jsonSuccess(['items' => [], 'nurse_id' => null]);

    $stmt = $db->prepare(
        "SELECT b.id, b.booking_code_display, b.booking_date, b.booking_time, b.crm_status, b.customer_name,
                p.name AS product_name, sa.name AS service_area_name
         FROM bookings b JOIN products p ON p.id = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         WHERE b.nurse_id = ? AND b.booking_date = ?
         ORDER BY b.booking_time ASC"
    );
    $stmt->execute([$nurseId, $date]);
    jsonSuccess(['items' => $stmt->fetchAll(), 'nurse_id' => $nurseId, 'date' => $date]);
}

// ── List nurses + workload ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare(
        "SELECT n.id, n.name, n.phone_last4, n.is_active, n.availability_json,
                (SELECT COUNT(*) FROM bookings b WHERE b.nurse_id = n.id AND b.booking_date = ?) AS today_count
         FROM nurses n ORDER BY n.is_active DESC, n.name ASC"
    );
    $stmt->execute([$date]);
    jsonSuccess(['items' => $stmt->fetchAll(), 'date' => $date]);
}

// ── Assign nurse ───────────────────────────────────────────────────────────────
if ($method === 'POST') {
    if (!$canManage) jsonError('Forbidden', 403);
    $body = getBodyJson();
    requireFields($body, ['booking_id', 'nurse_id']);
    $bookingId = str_clean($body['booking_id'], 191);
    $nurseId   = str_clean($body['nurse_id'], 191);

    $nchk = $db->prepare('SELECT id, name FROM nurses WHERE id = ? AND is_active = 1 LIMIT 1');
    $nchk->execute([$nurseId]);
    $nurse = $nchk->fetch();
    if (!$nurse) jsonError('Nurse tidak ditemukan / nonaktif', 422);

    $bchk = $db->prepare('SELECT id, crm_status, booking_code_display FROM bookings WHERE id = ? LIMIT 1');
    $bchk->execute([$bookingId]);
    $booking = $bchk->fetch();
    if (!$booking) jsonError('Booking tidak ditemukan', 404);

    $now = date('Y-m-d H:i:s');
    $db->prepare('UPDATE bookings SET nurse_id = ?, updated_at = ? WHERE id = ?')->execute([$nurseId, $now, $bookingId]);
    crmAdvanceBookingStatus($db, $bookingId, 'NURSE_ASSIGNED');

    crmAuditLog($staff, 'NURSE', 'ASSIGN', $bookingId, "Assign {$nurse['name']} ke {$booking['booking_code_display']}");
    jsonSuccess(['booking_id' => $bookingId, 'nurse_id' => $nurseId], 'Nurse ditugaskan');
}

jsonError('Method not allowed', 405);

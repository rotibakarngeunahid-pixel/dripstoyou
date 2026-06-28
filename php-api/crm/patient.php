<?php
// CRM Patient endpoint
//   GET  /php-api/crm/patient.php                — list (q, repeat, area_id, sort, limit, offset)
//   GET  /php-api/crm/patient.php?id=xxx         — detail (decrypted PII + bookings + treatments)
//   POST /php-api/crm/patient.php                — create/update (id optional)

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'patient');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();
$id     = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;

// ── Detail ──────────────────────────────────────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare('SELECT pt.*, sa.name AS area_name FROM patients pt LEFT JOIN service_areas sa ON sa.id = pt.area_id WHERE pt.id = ? LIMIT 1');
    $stmt->execute([$id]);
    $pt = $stmt->fetch();
    if (!$pt) jsonError('Pasien tidak ditemukan', 404);

    $pt['phone']         = crmTryDecrypt($pt['phone_encrypted'] ?? null, '···' . ($pt['phone_last4'] ?? ''));
    $pt['email']         = crmTryDecrypt($pt['email_encrypted'] ?? null, null);
    $pt['address']       = crmTryDecrypt($pt['address_encrypted'] ?? null, null);
    $pt['special_notes'] = crmTryDecrypt($pt['special_notes_encrypted'] ?? null, null);
    unset($pt['phone_encrypted'], $pt['email_encrypted'], $pt['address_encrypted'], $pt['special_notes_encrypted']);

    $bk = $db->prepare(
        'SELECT b.id, b.booking_code_display, b.booking_date, b.booking_time, b.crm_status, b.total_fee,
                p.name AS product_name, n.name AS nurse_name
         FROM bookings b JOIN products p ON p.id = b.product_id
         LEFT JOIN nurses n ON n.id = b.nurse_id
         WHERE b.patient_id = ? ORDER BY b.booking_date DESC LIMIT 100'
    );
    $bk->execute([$id]);
    $pt['bookings'] = $bk->fetchAll();

    $tr = $db->prepare(
        'SELECT t.id, t.completed_at, t.patient_condition_after, t.follow_up_recommendation,
                b.booking_code_display, b.booking_date, p.name AS product_name, n.name AS nurse_name
         FROM treatments t
         JOIN bookings b ON b.id = t.booking_id
         JOIN products p ON p.id = b.product_id
         LEFT JOIN nurses n ON n.id = t.nurse_id
         WHERE b.patient_id = ? ORDER BY t.completed_at DESC LIMIT 100'
    );
    $tr->execute([$id]);
    $pt['treatments'] = $tr->fetchAll();

    jsonSuccess($pt);
}

// ── List ────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $where = []; $params = [];

    if (!empty($_GET['q'])) {
        $q = str_clean($_GET['q'], 100);
        $where[] = '(pt.name LIKE ? OR pt.phone_last4 = ?)';
        $params[] = "%$q%"; $params[] = preg_replace('/\D/', '', $q);
    }
    if (!empty($_GET['repeat']) && $_GET['repeat'] === '1') $where[] = 'pt.is_repeat = 1';
    if (!empty($_GET['area_id'])) { $where[] = 'pt.area_id = ?'; $params[] = str_clean($_GET['area_id'], 191); }
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sort = $_GET['sort'] ?? 'newest';
    $orderBy = $sort === 'name' ? 'pt.name ASC' : ($sort === 'bookings' ? 'pt.booking_count DESC' : 'pt.created_at DESC');

    $countStmt = $db->prepare("SELECT COUNT(*) FROM patients pt $whereClause");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare(
        "SELECT pt.id, pt.name, pt.phone_last4, pt.booking_count, pt.total_spend, pt.is_repeat, pt.created_at,
                sa.name AS area_name
         FROM patients pt LEFT JOIN service_areas sa ON sa.id = pt.area_id
         $whereClause ORDER BY $orderBy LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);
    jsonSuccess(['items' => $stmt->fetchAll(), 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
}

// ── Create / Update ───────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBodyJson();
    requireFields($body, ['name', 'phone']);

    $name    = str_clean($body['name'], 100);
    $phone   = preg_replace('/\s+/', '', str_clean($body['phone'], 30));
    $last4   = substr(preg_replace('/\D/', '', $phone), -4) ?: '0000';
    $email   = !empty($body['email']) ? str_clean($body['email'], 255) : null;
    $dob     = !empty($body['dob']) ? str_clean($body['dob'], 10) : null;
    $address = !empty($body['address']) ? str_clean($body['address'], 1000) : null;
    $areaId  = !empty($body['area_id']) ? str_clean($body['area_id'], 191) : null;
    $nat     = !empty($body['nationality']) ? str_clean($body['nationality'], 50) : 'WNI';
    $notes   = !empty($body['special_notes']) ? str_clean($body['special_notes'], 2000) : null;
    $now     = date('Y-m-d H:i:s');

    $pid = !empty($body['id']) ? str_clean($body['id'], 191) : null;

    if ($pid) {
        $chk = $db->prepare('SELECT id FROM patients WHERE id = ? LIMIT 1');
        $chk->execute([$pid]);
        if (!$chk->fetch()) jsonError('Pasien tidak ditemukan', 404);
        $db->prepare(
            'UPDATE patients SET name=?, phone_encrypted=?, phone_last4=?, email_encrypted=?, dob=?, address_encrypted=?, area_id=?, nationality=?, special_notes_encrypted=?, updated_at=? WHERE id=?'
        )->execute([
            $name, encryptField($phone), $last4, $email ? encryptField($email) : null, $dob,
            $address ? encryptField($address) : null, $areaId, $nat, $notes ? encryptField($notes) : null, $now, $pid,
        ]);
        crmAuditLog($staff, 'PATIENT', 'UPDATE', $pid, "Update pasien $name");
        jsonSuccess(['id' => $pid], 'Pasien diperbarui');
    }

    $pid = generateId();
    $db->prepare(
        'INSERT INTO patients (id, name, phone_encrypted, phone_last4, email_encrypted, dob, address_encrypted, area_id, nationality, special_notes_encrypted, booking_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    )->execute([
        $pid, $name, encryptField($phone), $last4, $email ? encryptField($email) : null, $dob,
        $address ? encryptField($address) : null, $areaId, $nat, $notes ? encryptField($notes) : null, $now, $now,
    ]);
    crmAuditLog($staff, 'PATIENT', 'CREATE', $pid, "Buat pasien $name");
    jsonSuccess(['id' => $pid], 'Pasien dibuat', 201);
}

jsonError('Method not allowed', 405);

<?php
// POST /api/bookings.php - create a new booking (public, rate-limited)

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('POST');

checkBookingRateLimit(getIpHash());

$body = getBodyJson();

requireFields($body, [
    'productId',
    'customerName',
    'customerPhone',
    'bookingDate',
    'bookingTime',
    'locationType',
    'serviceAreaId',
    'address',
]);

$productId = str_clean($body['productId'], 191);
$customerName = str_clean($body['customerName'], 100);
$customerPhone = preg_replace('/\D/', '', (string)($body['customerPhone'] ?? ''));
$bookingDate = str_clean($body['bookingDate'] ?? '', 10);
$bookingTime = str_clean($body['bookingTime'] ?? '', 5);
$peopleCount = max(1, min(10, (int)($body['peopleCount'] ?? 1)));
$locationType = str_clean($body['locationType'] ?? '', 20);
$serviceAreaId = str_clean($body['serviceAreaId'], 191);
$address = str_clean($body['address'] ?? '', 500);
$notes = isset($body['notes']) ? str_clean($body['notes'], 1000) : null;

if (strlen($customerName) < 2) jsonError('Nama pelanggan terlalu pendek', 422);
if (!preg_match('/^\d{8,15}$/', $customerPhone)) jsonError('Nomor HP tidak valid', 422);
if (parseDateYmdStrict($bookingDate) === null) jsonError('Format tanggal tidak valid (YYYY-MM-DD)', 422);
if (timeToMinutesStrict($bookingTime) === null) jsonError('Format waktu tidak valid (HH:MM)', 422);
if (!in_array($locationType, ['VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA'], true)) {
    jsonError('Tipe lokasi tidak valid', 422);
}
if (strlen($address) < 5) jsonError('Alamat terlalu pendek', 422);

$db = getDb();

$stmt = $db->prepare('SELECT id, name FROM products WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$productId]);
$product = $stmt->fetch();
if (!$product) jsonError('Treatment tidak ditemukan', 404);

$stmt = $db->prepare('SELECT id FROM service_areas WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$serviceAreaId]);
if (!$stmt->fetch()) jsonError('Area layanan tidak tersedia', 422);

try {
    $availability = getDateAvailability($db, $bookingDate);
} catch (InvalidArgumentException $e) {
    jsonError('Tanggal booking tidak valid', 422);
}
if (!in_array($bookingTime, $availability['slots'], true)) {
    jsonError('Slot waktu tidak tersedia. Silakan pilih waktu lain.', 409);
}
$maxBookingsPerSlot = max(1, (int)($availability['maxBookingsPerSlot'] ?? 1));

$phoneLast4 = substr($customerPhone, -4);
$phoneEncrypted = encryptField($customerPhone);
$addressEncrypted = encryptField($address);
$notesEncrypted = $notes ? encryptField($notes) : null;

$bookingCode = null;
for ($i = 0; $i < 5; $i++) {
    $code = generateBookingCode();
    $chk = $db->prepare('SELECT id FROM bookings WHERE booking_code = ? LIMIT 1');
    $chk->execute([$code]);
    if (!$chk->fetch()) {
        $bookingCode = $code;
        break;
    }
}
if (!$bookingCode) jsonError('Gagal membuat kode booking, silakan coba lagi', 500);

$bookingId = generateId();
$now = date('Y-m-d H:i:s');
$lockName = 'drip_booking_' . $bookingDate . '_' . $bookingTime;

$lockStmt = $db->prepare('SELECT GET_LOCK(?, 5)');
$lockStmt->execute([$lockName]);
if ((int)$lockStmt->fetchColumn() !== 1) {
    jsonError('Slot sedang diproses oleh pelanggan lain. Silakan coba beberapa saat lagi.', 409);
}

try {
    $db->beginTransaction();

    $countStmt = $db->prepare(
        "SELECT COUNT(*) AS cnt
         FROM bookings
         WHERE booking_date = ?
           AND booking_time = ?
           AND status NOT IN ('DIBATALKAN')"
    );
    $countStmt->execute([$bookingDate, $bookingTime]);
    $bookedCount = (int)($countStmt->fetchColumn() ?: 0);
    if ($bookedCount >= $maxBookingsPerSlot) {
        $db->rollBack();
        $releaseStmt = $db->prepare('SELECT RELEASE_LOCK(?)');
        $releaseStmt->execute([$lockName]);
        jsonError('Maaf, slot waktu ini baru saja penuh. Silakan pilih waktu yang berbeda.', 409);
    }

    $stmt = $db->prepare(
        'INSERT INTO bookings
         (id, booking_code, product_id, customer_name, customer_phone_encrypted,
          customer_phone_last4, booking_date, booking_time, people_count,
          location_type, service_area_id, address_encrypted, notes_encrypted,
          status, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "BARU", "WEBSITE", ?, ?)'
    );
    $stmt->execute([
        $bookingId,
        $bookingCode,
        $productId,
        $customerName,
        $phoneEncrypted,
        $phoneLast4,
        $bookingDate,
        $bookingTime,
        $peopleCount,
        $locationType,
        $serviceAreaId,
        $addressEncrypted,
        $notesEncrypted,
        $now,
        $now,
    ]);

    $db->commit();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $releaseStmt = $db->prepare('SELECT RELEASE_LOCK(?)');
    $releaseStmt->execute([$lockName]);
    jsonError('Gagal membuat booking, coba lagi. Jika masalah berlanjut, hubungi kami via WhatsApp.', 500);
} finally {
    $releaseStmt = $db->prepare('SELECT RELEASE_LOCK(?)');
    $releaseStmt->execute([$lockName]);
}

auditLog('CREATE_BOOKING', null, 'Booking', $bookingCode, [
    'product' => $product['name'],
    'phoneLast4' => $phoneLast4,
]);

jsonSuccess([
    'bookingCode' => $bookingCode,
    'bookingDate' => $bookingDate,
    'bookingTime' => $bookingTime,
    'productName' => $product['name'],
], 'Booking berhasil dibuat. Tim kami akan menghubungi Anda segera.', 201);

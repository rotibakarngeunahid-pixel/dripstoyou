<?php
// POST /api/bookings.php — create a new booking (public, rate-limited)

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('POST');

// Rate limit: 5 bookings per IP per 10 minutes
checkBookingRateLimit(getIpHash());

$body = getBodyJson();

// ── Validation ────────────────────────────────────────────────────────────────
requireFields($body, ['productId', 'customerName', 'customerPhone', 'bookingDate', 'bookingTime', 'locationType', 'serviceAreaId', 'address']);

$productId    = str_clean($body['productId'], 191);
$customerName = str_clean($body['customerName'], 100);
$customerPhone = preg_replace('/\D/', '', (string)($body['customerPhone'] ?? ''));
$bookingDate  = str_clean($body['bookingDate'] ?? '', 10);
$bookingTime  = str_clean($body['bookingTime'] ?? '', 5);
$peopleCount  = max(1, min(10, (int)($body['peopleCount'] ?? 1)));
$locationType = str_clean($body['locationType'] ?? '', 20);
$serviceAreaId = str_clean($body['serviceAreaId'], 191);
$address      = str_clean($body['address'] ?? '', 500);
$notes        = isset($body['notes']) ? str_clean($body['notes'], 1000) : null;

// Validate formats
if (strlen($customerName) < 2) jsonError('Nama pelanggan terlalu pendek', 422);
if (!preg_match('/^\d{8,15}$/', $customerPhone)) jsonError('Nomor HP tidak valid', 422);
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $bookingDate)) jsonError('Format tanggal tidak valid (YYYY-MM-DD)', 422);
if (!preg_match('/^\d{2}:\d{2}$/', $bookingTime)) jsonError('Format waktu tidak valid (HH:MM)', 422);
if (!in_array($locationType, ['VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA'], true)) {
    jsonError('Tipe lokasi tidak valid', 422);
}
if (strlen($address) < 5) jsonError('Alamat terlalu pendek', 422);

$db = getDb();

// Check product exists and is active
$stmt = $db->prepare('SELECT id, name FROM products WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$productId]);
$product = $stmt->fetch();
if (!$product) jsonError('Treatment tidak ditemukan', 404);

// Only allow service areas currently enabled by the admin.
$stmt = $db->prepare('SELECT id FROM service_areas WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$serviceAreaId]);
if (!$stmt->fetch()) jsonError('Area layanan tidak tersedia', 422);

// Encrypt PII
$phoneLast4        = substr($customerPhone, -4);
$phoneEncrypted    = encryptField($customerPhone);
$addressEncrypted  = encryptField($address);
$notesEncrypted    = $notes ? encryptField($notes) : null;

// Generate unique booking code (retry up to 5 times to avoid collision)
$bookingCode = null;
for ($i = 0; $i < 5; $i++) {
    $code = generateBookingCode();
    $chk  = $db->prepare('SELECT id FROM bookings WHERE booking_code = ? LIMIT 1');
    $chk->execute([$code]);
    if (!$chk->fetch()) { $bookingCode = $code; break; }
}
if (!$bookingCode) jsonError('Gagal membuat kode booking, silakan coba lagi', 500);

$bookingId = generateId();
$now       = date('Y-m-d H:i:s');

// ── Concurrency check: lock slot to prevent double booking ─────────────────
$db->beginTransaction();
try {
    // Lock any existing active bookings at this exact slot (pessimistic lock)
    $conflict = $db->prepare(
        "SELECT id FROM bookings
         WHERE booking_date = ?
           AND booking_time = ?
           AND service_area_id = ?
           AND status NOT IN ('DIBATALKAN')
         LIMIT 1
         FOR UPDATE"
    );
    $conflict->execute([$bookingDate, $bookingTime, $serviceAreaId]);
    if ($conflict->fetch()) {
        $db->rollBack();
        jsonError(
            'Maaf, slot waktu ini baru saja dipesan oleh orang lain. Silakan pilih waktu yang berbeda.',
            409
        );
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
        $bookingId, $bookingCode, $productId, $customerName,
        $phoneEncrypted, $phoneLast4, $bookingDate, $bookingTime,
        $peopleCount, $locationType, $serviceAreaId,
        $addressEncrypted, $notesEncrypted, $now, $now,
    ]);

    $db->commit();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonError('Gagal membuat booking, coba lagi. Jika masalah berlanjut, hubungi kami via WhatsApp.', 500);
}

auditLog('CREATE_BOOKING', null, 'Booking', $bookingCode, [
    'product'   => $product['name'],
    'phoneLast4' => $phoneLast4,
]);

jsonSuccess([
    'bookingCode' => $bookingCode,
    'bookingDate' => $bookingDate,
    'bookingTime' => $bookingTime,
    'productName' => $product['name'],
], 'Booking berhasil dibuat. Tim kami akan menghubungi Anda segera.', 201);

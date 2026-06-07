<?php
// GET /api/track.php — public booking tracker (no auth required)
// Query: ?code=DRY260608R5X3   OR   ?name=Adithya

require_once __DIR__ . '/helpers.php';
handleCors();
requireMethod('GET');

$db   = getDb();
$code = isset($_GET['code']) ? trim(str_clean($_GET['code'], 30)) : '';
$name = isset($_GET['name']) ? trim(str_clean($_GET['name'], 100)) : '';

if ($code === '' && $name === '') {
    jsonError('Masukkan kode booking atau nama pelanggan', 400);
}

$validStatuses = ['BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN'];

function formatBookingForTrack(array $b): array {
    return [
        'booking_code'      => $b['booking_code'],
        'customer_name'     => $b['customer_name'],
        'booking_date'      => $b['booking_date'],
        'booking_time'      => $b['booking_time'],
        'product_name'      => $b['product_name'],
        'service_area_name' => $b['service_area_name'],
        'location_type'     => $b['location_type'],
        'status'            => $b['status'],
        'created_at'        => $b['created_at'],
    ];
}

if ($code !== '') {
    $stmt = $db->prepare(
        "SELECT b.booking_code, b.customer_name, b.booking_date, b.booking_time,
                b.location_type, b.status, b.created_at,
                p.name AS product_name,
                sa.name AS service_area_name
         FROM   bookings b
         JOIN   products p ON p.id = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         WHERE  UPPER(b.booking_code) = UPPER(?)
         LIMIT  1"
    );
    $stmt->execute([$code]);
    $booking = $stmt->fetch();
    if (!$booking) {
        jsonError('Booking dengan kode tersebut tidak ditemukan.', 404);
    }
    jsonSuccess(formatBookingForTrack($booking));
}

// Search by name — return up to 10 most recent
$stmt = $db->prepare(
    "SELECT b.booking_code, b.customer_name, b.booking_date, b.booking_time,
            b.location_type, b.status, b.created_at,
            p.name AS product_name,
            sa.name AS service_area_name
     FROM   bookings b
     JOIN   products p ON p.id = b.product_id
     LEFT JOIN service_areas sa ON sa.id = b.service_area_id
     WHERE  LOWER(b.customer_name) LIKE LOWER(?)
     ORDER  BY b.created_at DESC
     LIMIT  10"
);
$stmt->execute(['%' . $name . '%']);
$bookings = $stmt->fetchAll();
if (empty($bookings)) {
    jsonError('Tidak ditemukan booking dengan nama tersebut.', 404);
}
jsonSuccess(array_map('formatBookingForTrack', $bookings));

<?php
// GET/PUT /api/admin/wa-template.php

require_once __DIR__ . '/../helpers.php';
handleCors();

$admin = requireAuth();
$method = getMethod();
// Menulis template hanya untuk SUPER_ADMIN dan CONTENT_ADMIN.
if ($method !== 'GET') {
    requireRole($admin, 'SUPER_ADMIN', 'CONTENT_ADMIN');
}
$key = 'whatsapp_booking_template';
$allowed = [
    'customer_name',
    'treatment_name',
    'booking_date',
    'booking_time',
    'location',
    'address',
    'phone',
    'notes',
    'booking_id',
];
$default = "Hello {customer_name},\n\nYour booking for {treatment_name} on {booking_date} at {booking_time} has been received.\n\nBooking ID: {booking_id}\nLocation: {location}\n\nOur team will contact you to confirm the appointment.";

if ($method === 'GET') {
    jsonSuccess([
        'template' => getSiteSetting($key, $default),
        'defaultTemplate' => $default,
        'allowedPlaceholders' => $allowed,
    ]);
}

if ($method === 'PUT') {
    $body = getBodyJson();
    requireFields($body, ['template']);
    $template = str_clean($body['template'], 10000);
    if ($template === '') jsonError('Template tidak boleh kosong', 422);

    preg_match_all('/\{([^}]+)\}/', $template, $matches);
    foreach ($matches[1] as $placeholder) {
        if (!in_array($placeholder, $allowed, true)) {
            jsonError("Placeholder {{$placeholder}} tidak dikenal", 422);
        }
    }

    setSiteSetting($key, $template, $admin['admin_id']);
    jsonSuccess(null, 'Template berhasil disimpan');
}

jsonError('Method not allowed', 405);

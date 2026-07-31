<?php
// CRM Invoice endpoint
//   GET  /php-api/crm/invoice.php?bookingId=xxx
//        Returns the invoice for a booking, creating (numbering) it on first
//        view if the treatment has been completed. 409 if not yet eligible.
//   POST /php-api/crm/invoice.php?bookingId=xxx
//        {action:'update_charges', addon_label, addon_fee, other_label, other_fee,
//         discount_type, discount_value} — edits the invoice's extra charges/discount.

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'booking');

$method    = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db        = getDb();
$bookingId = !empty($_GET['bookingId']) ? str_clean($_GET['bookingId'], 191) : null;
if (!$bookingId) jsonError('bookingId wajib diisi', 400);

function invoiceLoadBooking(PDO $db, string $bookingId): ?array {
    $stmt = $db->prepare(
        'SELECT b.id, b.booking_code_display, b.customer_name, b.customer_phone_encrypted, b.customer_phone_last4,
                b.address_encrypted, b.location_type, b.crm_status,
                b.service_fee, b.visit_fee, b.total_fee,
                b.addon_label, b.addon_fee, b.other_label, b.other_fee, b.discount_type, b.discount_value,
                p.name AS product_name,
                sa.name AS service_area_name,
                n.name AS nurse_name
         FROM   bookings b
         JOIN   products p ON p.id = b.product_id
         LEFT JOIN service_areas sa ON sa.id = b.service_area_id
         LEFT JOIN nurses n ON n.id = b.nurse_id
         WHERE  b.id = ? LIMIT 1'
    );
    $stmt->execute([$bookingId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

$booking = invoiceLoadBooking($db, $bookingId);
if (!$booking) jsonError('Booking tidak ditemukan', 404);

if ($method === 'GET') {
    if (crmStatusRank((string)$booking['crm_status']) < crmStatusRank('TREATMENT_COMPLETED')) {
        jsonError('Invoice hanya bisa dibuat setelah treatment selesai.', 409);
    }

    $inv = $db->prepare('SELECT invoice_number, issued_date, issued_time, payment_method FROM invoices WHERE booking_id = ? LIMIT 1');
    $inv->execute([$bookingId]);
    $invoice = $inv->fetch();

    if (!$invoice) {
        // Derive the payment method once, at creation time, from the most
        // relevant payment row — frozen from here on so a later payment
        // doesn't silently rewrite an already-issued invoice.
        $pm = $db->prepare(
            "SELECT method FROM payments WHERE booking_id = ?
             ORDER BY (status='PAID') DESC, created_at DESC LIMIT 1"
        );
        $pm->execute([$bookingId]);
        $paymentMethod = $pm->fetchColumn() ?: null;

        $now = date('Y-m-d H:i:s');
        $today = date('Y-m-d');
        $time = date('H:i');

        $invoiceNumber = null;
        for ($i = 0; $i < 5; $i++) {
            $candidate = crmNextInvoiceNumber($db, str_replace('-', '', $today));
            try {
                $db->prepare(
                    'INSERT INTO invoices (id, booking_id, invoice_number, issued_date, issued_time, payment_method, created_by_staff_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                )->execute([generateId(), $bookingId, $candidate, $today, $time, $paymentMethod, $staff['staff_id'], $now]);
                $invoiceNumber = $candidate;
                break;
            } catch (PDOException $e) {
                if ($e->getCode() !== '23000') throw $e; // not a duplicate-key race — rethrow
            }
        }
        if (!$invoiceNumber) {
            // Every retry hit a duplicate — most likely a concurrent request for
            // the SAME booking won the race (booking_id is also unique), not
            // that all 5 generated numbers collided. Re-fetch instead of
            // failing the loser with a false 500.
            $inv->execute([$bookingId]);
            $invoice = $inv->fetch();
            if (!$invoice) jsonError('Gagal membuat nomor invoice, coba lagi', 500);
        } else {
            $invoice = ['invoice_number' => $invoiceNumber, 'issued_date' => $today, 'issued_time' => $time, 'payment_method' => $paymentMethod];
            crmAuditLog($staff, 'INVOICE', 'CREATE', $bookingId, "Invoice $invoiceNumber dibuat untuk {$booking['booking_code_display']}");
        }
    }

    jsonSuccess(invoiceBuildPayload($booking, $invoice));
}

if ($method === 'POST') {
    $body = getBodyJson();
    $action = $body['action'] ?? '';

    if ($action === 'update_charges') {
        if (crmStatusRank((string)$booking['crm_status']) < crmStatusRank('TREATMENT_COMPLETED')) {
            jsonError('Invoice hanya bisa diedit setelah treatment selesai.', 409);
        }

        $addonLabel = !empty($body['addon_label']) ? str_clean($body['addon_label'], 100) : null;
        $addonFee   = (float)($body['addon_fee'] ?? 0);
        $otherLabel = !empty($body['other_label']) ? str_clean($body['other_label'], 100) : 'Other';
        $otherFee   = (float)($body['other_fee'] ?? 0);
        $discountType = in_array($body['discount_type'] ?? 'NONE', ['NONE', 'PERCENT', 'NOMINAL'], true) ? $body['discount_type'] : 'NONE';
        $discountValue = (float)($body['discount_value'] ?? 0);

        if ($addonFee < 0 || $otherFee < 0 || $discountValue < 0) jsonError('Nilai tidak boleh negatif', 422);
        if ($discountType === 'PERCENT' && $discountValue > 100) jsonError('Diskon persen tidak boleh lebih dari 100', 422);

        $subtotal = (float)$booking['service_fee'] + (float)$booking['visit_fee'] + $addonFee + $otherFee;
        $discountAmount = $discountType === 'PERCENT' ? ($subtotal * $discountValue / 100) : ($discountType === 'NOMINAL' ? $discountValue : 0);
        $totalFee = max(0, $subtotal - $discountAmount);

        $now = date('Y-m-d H:i:s');
        $db->prepare(
            'UPDATE bookings SET addon_label=?, addon_fee=?, other_label=?, other_fee=?, discount_type=?, discount_value=?, total_fee=?, updated_at=?
             WHERE id=?'
        )->execute([$addonLabel, $addonFee, $otherLabel, $otherFee, $discountType, $discountValue, $totalFee, $now, $bookingId]);

        crmAuditLog($staff, 'INVOICE', 'UPDATE_CHARGES', $bookingId, "Biaya tambahan/diskon diperbarui untuk {$booking['booking_code_display']}");

        $booking = invoiceLoadBooking($db, $bookingId);
        $inv = $db->prepare('SELECT invoice_number, issued_date, issued_time, payment_method FROM invoices WHERE booking_id = ? LIMIT 1');
        $inv->execute([$bookingId]);
        $invoice = $inv->fetch() ?: null;

        jsonSuccess($invoice ? invoiceBuildPayload($booking, $invoice) : null, 'Biaya diperbarui');
    }

    jsonError('Aksi tidak dikenal', 400);
}

jsonError('Method not allowed', 405);

// ── Payload assembly ────────────────────────────────────────────────────────
function invoiceBuildPayload(array $b, array $invoice): array {
    $serviceFee = (float)($b['service_fee'] ?? 0);
    $visitFee   = (float)($b['visit_fee'] ?? 0);
    $addonFee   = (float)($b['addon_fee'] ?? 0);
    $otherFee   = (float)($b['other_fee'] ?? 0);
    $discountType  = $b['discount_type'] ?? 'NONE';
    $discountValue = (float)($b['discount_value'] ?? 0);

    $subtotal = $serviceFee + $visitFee + $addonFee + $otherFee;
    $discountAmount = $discountType === 'PERCENT' ? ($subtotal * $discountValue / 100) : ($discountType === 'NOMINAL' ? $discountValue : 0);
    $grandTotal = max(0, $subtotal - $discountAmount);

    $items = [
        ['description' => $b['product_name'], 'qty' => 1, 'price' => $serviceFee],
    ];
    if ($addonFee > 0 || !empty($b['addon_label'])) {
        $items[] = ['description' => $b['addon_label'] ?: 'Add-on', 'qty' => 1, 'price' => $addonFee];
    }
    $items[] = ['description' => 'Home Visit Fee', 'qty' => 1, 'price' => $visitFee];
    if ($otherFee != 0) {
        $items[] = ['description' => $b['other_label'] ?: 'Other', 'qty' => 1, 'price' => $otherFee];
    }

    return [
        'invoice' => [
            'number'      => $invoice['invoice_number'],
            'issued_date' => $invoice['issued_date'],
            'issued_time' => $invoice['issued_time'],
        ],
        'booking_code_display' => $b['booking_code_display'],
        'patient' => [
            'name'     => $b['customer_name'],
            'phone'    => crmTryDecrypt($b['customer_phone_encrypted'] ?? null, '···' . ($b['customer_phone_last4'] ?? '')),
            'location' => trim(($b['location_type'] ?? '') . (!empty($b['service_area_name']) ? ' — ' . $b['service_area_name'] : '')),
            'address'  => crmTryDecrypt($b['address_encrypted'] ?? null, null),
        ],
        'items'    => $items,
        'charges'  => [
            'addon_label' => $b['addon_label'] ?: '',
            'addon_fee'   => $addonFee,
            'other_label' => $b['other_label'] ?: 'Other',
            'other_fee'   => $otherFee,
        ],
        'subtotal' => $subtotal,
        'discount' => ['type' => $discountType, 'value' => $discountValue, 'amount' => $discountAmount],
        'grand_total' => $grandTotal,
        'payment_method' => $invoice['payment_method'],
        'nurse'  => $b['nurse_name'] ?: null,
    ];
}

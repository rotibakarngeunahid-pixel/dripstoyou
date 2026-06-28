<?php
// CRM Finance endpoint
//   GET  /php-api/crm/finance.php?month=YYYY-MM   — stats + payments + expenses
//   POST /php-api/crm/finance.php {action:'payment', booking_id, amount, method, status, notes}
//   POST /php-api/crm/finance.php {action:'expense', category, description, amount, expense_date}

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'finance');

$method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? getMethod());
$db     = getDb();

if ($method === 'GET') {
    $month = !empty($_GET['month']) ? str_clean($_GET['month'], 7) : date('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) jsonError('Format bulan tidak valid', 422);

    $paid = (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='PAID' AND DATE_FORMAT(paid_at,'%Y-%m')='$month'")->fetchColumn();
    $dp   = (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='DP' AND DATE_FORMAT(paid_at,'%Y-%m')='$month'")->fetchColumn();
    $expense = (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(expense_date,'%Y-%m')='$month'")->fetchColumn();
    $omzet = (float)$db->query("SELECT COALESCE(SUM(total_fee),0) FROM bookings WHERE DATE_FORMAT(booking_date,'%Y-%m')='$month'")->fetchColumn();
    $unpaid = max(0, $omzet - $paid - $dp);

    $pStmt = $db->prepare(
        "SELECT pay.id, pay.amount, pay.method, pay.status, pay.paid_at, pay.notes,
                b.booking_code_display, b.customer_name
         FROM payments pay JOIN bookings b ON b.id = pay.booking_id
         WHERE DATE_FORMAT(pay.created_at,'%Y-%m') = ? OR DATE_FORMAT(pay.paid_at,'%Y-%m') = ?
         ORDER BY pay.created_at DESC LIMIT 200"
    );
    $pStmt->execute([$month, $month]);

    $eStmt = $db->prepare("SELECT id, category, description, amount, expense_date FROM expenses WHERE DATE_FORMAT(expense_date,'%Y-%m') = ? ORDER BY expense_date DESC LIMIT 200");
    $eStmt->execute([$month]);

    jsonSuccess([
        'month' => $month,
        'stats' => [
            'omzet' => $omzet, 'paid' => $paid, 'dp' => $dp, 'unpaid' => $unpaid,
            'expense' => $expense, 'profit' => $paid - $expense,
        ],
        'payments' => $pStmt->fetchAll(),
        'expenses' => $eStmt->fetchAll(),
    ]);
}

if ($method === 'POST') {
    $body = getBodyJson();
    $action = $body['action'] ?? '';

    if ($action === 'payment') {
        requireFields($body, ['booking_id', 'amount', 'method', 'status']);
        $bookingId = str_clean($body['booking_id'], 191);
        $amount = (float)$body['amount'];
        if ($amount <= 0) jsonError('Jumlah harus lebih dari 0', 422);
        $allowedMethods = ['CASH','TRANSFER','QRIS','DP_CASH','DP_TRANSFER','DP_QRIS'];
        $pmethod = in_array($body['method'], $allowedMethods, true) ? $body['method'] : null;
        if (!$pmethod) jsonError('Metode tidak valid', 422);
        $status = in_array($body['status'], ['PAID','DP','UNPAID'], true) ? $body['status'] : 'UNPAID';
        $notes = !empty($body['notes']) ? str_clean($body['notes'], 500) : null;
        $now = date('Y-m-d H:i:s');

        $bchk = $db->prepare('SELECT id, patient_id, booking_code_display FROM bookings WHERE id = ? LIMIT 1');
        $bchk->execute([$bookingId]);
        $booking = $bchk->fetch();
        if (!$booking) jsonError('Booking tidak ditemukan', 404);

        $paidAt = ($status === 'PAID' || $status === 'DP') ? $now : null;
        $db->prepare('INSERT INTO payments (id, booking_id, amount, method, status, paid_at, notes, recorded_by_staff_id, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
           ->execute([generateId(), $bookingId, $amount, $pmethod, $status, $paidAt, $notes, $staff['staff_id'], $now, $now]);

        if ($status === 'PAID') {
            crmAdvanceBookingStatus($db, $bookingId, 'PAYMENT_COMPLETED');
            if (!empty($booking['patient_id'])) {
                $db->prepare('UPDATE patients SET total_spend = total_spend + ?, updated_at = ? WHERE id = ?')
                   ->execute([$amount, $now, $booking['patient_id']]);
            }
        }
        crmAuditLog($staff, 'FINANCE', 'PAYMENT', $bookingId, "Pembayaran $status {$booking['booking_code_display']}");
        jsonSuccess(['booking_id' => $bookingId], 'Pembayaran dicatat');
    }

    if ($action === 'expense') {
        requireFields($body, ['category', 'description', 'amount', 'expense_date']);
        $cat = in_array($body['category'], ['MEDICAL_STOCK','NURSE_TRANSPORT','MARKETING','OPERATIONAL','OTHER'], true) ? $body['category'] : 'OTHER';
        $desc = str_clean($body['description'], 500);
        $amount = (float)$body['amount'];
        if ($amount <= 0) jsonError('Jumlah harus lebih dari 0', 422);
        $date = str_clean($body['expense_date'], 10);
        $eid = generateId();
        $db->prepare('INSERT INTO expenses (id, category, description, amount, expense_date, recorded_by_staff_id, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, NOW(3))')
           ->execute([$eid, $cat, $desc, $amount, $date, $staff['staff_id']]);
        crmAuditLog($staff, 'FINANCE', 'EXPENSE', $eid, "Pengeluaran $cat: $desc");
        jsonSuccess(['id' => $eid], 'Pengeluaran dicatat');
    }

    jsonError('Aksi tidak dikenal', 400);
}

jsonError('Method not allowed', 405);

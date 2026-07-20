<?php
// CRM Feedback endpoint — read-only list + detail of customer feedback
// submitted via public links (see feedback-link.php / feedback-public.php).
// Gated on the 'booking' module (not 'feedback') on purpose: this is a
// cross-booking aggregate view, same access tier as the global booking list —
// NURSE never sees cross-booking data, only their own per-booking actions.
//   GET /php-api/crm/feedback.php                    — list (filters: date_from, date_to, product_id, rating, limit, offset)
//   GET /php-api/crm/feedback.php?id=xxx              — detail by feedback id

require_once __DIR__ . '/_crm.php';
handleCors();

$staff = requireCRMAuth();
requireCRMPermission($staff, 'booking');
requireMethod('GET');

$db = getDb();
$id = isset($_GET['id']) ? str_clean($_GET['id'], 191) : null;

// ── Detail ──────────────────────────────────────────────────────────────────
if ($id) {
    $stmt = $db->prepare(
        'SELECT f.id, f.rating, f.comment_encrypted, f.meets_expectation, f.submitted_at,
                b.id AS booking_id, b.booking_code_display, b.customer_name, b.booking_date,
                p.name AS product_name,
                fl.sent_at, fl.viewed_at, fl.used_at, fl.created_at AS link_created_at,
                st.name AS created_by_name
         FROM   feedbacks f
         JOIN   bookings b ON b.id = f.booking_id
         JOIN   products p ON p.id = b.product_id
         LEFT JOIN feedback_links fl ON fl.id = f.feedback_link_id
         LEFT JOIN crm_staff st ON st.id = fl.created_by_staff_id
         WHERE  f.id = ? LIMIT 1'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonError('Feedback tidak ditemukan', 404);

    $row['comment'] = crmTryDecrypt($row['comment_encrypted'] ?? null, null);
    unset($row['comment_encrypted']);

    jsonSuccess($row);
}

// ── List ────────────────────────────────────────────────────────────────────
$limit  = min(100, max(1, (int)($_GET['limit'] ?? 50)));
$offset = max(0, (int)($_GET['offset'] ?? 0));

$where  = [];
$params = [];

if (!empty($_GET['date_from'])) { $where[] = 'f.submitted_at >= ?'; $params[] = str_clean($_GET['date_from'], 10) . ' 00:00:00'; }
if (!empty($_GET['date_to']))   { $where[] = 'f.submitted_at <= ?'; $params[] = str_clean($_GET['date_to'], 10) . ' 23:59:59'; }
if (!empty($_GET['product_id'])) { $where[] = 'b.product_id = ?'; $params[] = str_clean($_GET['product_id'], 191); }
if (isset($_GET['rating']) && $_GET['rating'] !== '') { $where[] = 'f.rating = ?'; $params[] = (int)$_GET['rating']; }

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare(
    "SELECT COUNT(*) FROM feedbacks f JOIN bookings b ON b.id = f.booking_id $whereClause"
);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Rating rendah (≤2) diurutkan ke atas supaya langsung terlihat admin.
$stmt = $db->prepare(
    "SELECT f.id, f.rating, f.submitted_at,
            b.booking_code_display, b.customer_name,
            p.name AS product_name
     FROM   feedbacks f
     JOIN   bookings b ON b.id = f.booking_id
     JOIN   products p ON p.id = b.product_id
     $whereClause
     ORDER BY (f.rating <= 2) DESC, f.submitted_at DESC
     LIMIT $limit OFFSET $offset"
);
$stmt->execute($params);
$rows = $stmt->fetchAll();

jsonSuccess(['items' => $rows, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);

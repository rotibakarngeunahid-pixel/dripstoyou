<?php
// ─────────────────────────────────────────────────────────────────────────────
// DRIP TO YOU Bali — CRM Internal shared bootstrap
//
// Provides CRM-specific auth (crm_sessions / crm_staff), RBAC, and audit logging.
// Reuses the website's core helpers (DB, encryption, password hashing, rate limit)
// from ../helpers.php so the security model stays identical to the admin panel.
//
// This file must never be requested directly — it is denied in crm/.htaccess.
// ─────────────────────────────────────────────────────────────────────────────

require_once __DIR__ . '/../helpers.php';

// ── RBAC permission map (mirrors src/lib/crm-permissions.ts) ───────────────────

function crmPermissions(): array {
    return [
        'OWNER'   => ['dashboard','booking','patient','nurse','inventory','purchase_order',
                      'finance','whatsapp','staff','area','audit','screening','consent','treatment','service'],
        'ADMIN'   => ['booking','patient','nurse','whatsapp','area','service','screening','consent','treatment'],
        'NURSE'   => ['nurse_portal','screening','consent','treatment'],
        'FINANCE' => ['finance','purchase_order'],
    ];
}

// Every grantable module key (used for OWNER access + custom-permission toggles).
function crmAllModules(): array {
    return ['dashboard','booking','patient','nurse','nurse_portal','service','screening',
            'consent','treatment','inventory','purchase_order','finance','area','whatsapp','staff','audit'];
}

// The modules a staff member may access:
//   OWNER        → everything
//   custom perms → exactly the modules in permissions_json (when set & non-empty)
//   otherwise    → the role's default module set
function crmEffectiveModules(array $staff): array {
    if (($staff['role'] ?? '') === 'OWNER') return crmAllModules();
    if (!empty($staff['permissions_json'])) {
        $decoded = json_decode((string)$staff['permissions_json'], true);
        if (is_array($decoded) && count($decoded) > 0) return array_values($decoded);
    }
    return crmPermissions()[$staff['role'] ?? ''] ?? [];
}

function crmCan(array $staff, string $module): bool {
    if (($staff['role'] ?? '') === 'OWNER') return true;
    return in_array($module, crmEffectiveModules($staff), true);
}

// Single sign-on bridge: map an existing website `admins` role to a CRM role.
// Returns null if that admin role has no CRM access.
function crmRoleForAdmin(string $adminRole): ?string {
    switch ($adminRole) {
        case 'SUPER_ADMIN':       return 'OWNER';
        case 'ADMIN_OPERASIONAL': return 'ADMIN';
        default:                  return null; // CONTENT_ADMIN / unknown → no CRM access
    }
}

// ── Auth (Bearer token → crm_sessions) ─────────────────────────────────────────

function requireCRMAuth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        jsonError('Unauthorized', 401);
    }
    $token = trim($m[1]);
    $hash  = hash('sha256', $token);

    $db   = getDb();
    $stmt = $db->prepare(
        'SELECT s.id AS session_id, st.id AS staff_id, st.name, st.email, st.role, st.permissions_json
         FROM   crm_sessions s
         JOIN   crm_staff st ON st.id = s.staff_id
         WHERE  s.session_token_hash = ?
           AND  s.expires_at > NOW()
           AND  s.revoked_at IS NULL
           AND  st.is_active = 1
         LIMIT  1'
    );
    $stmt->execute([$hash]);
    $staff = $stmt->fetch();

    if (!$staff) {
        jsonError('Unauthorized', 401);
    }
    return $staff;
}

function requireCRMRole(array $staff, string ...$roles): void {
    if (!in_array($staff['role'] ?? '', $roles, true)) {
        jsonError('Forbidden', 403);
    }
}

// Module-level permission gate. PHP is the final trust boundary — checking the
// role in Next.js is not enough because this API can be called directly.
function requireCRMPermission(array $staff, string $module): void {
    if (!crmCan($staff, $module)) {
        jsonError('Forbidden', 403);
    }
}

// ── Audit log ──────────────────────────────────────────────────────────────────

function crmAuditLog(?array $staff, string $module, string $action, ?string $entityId = null, ?string $detail = null): void {
    try {
        $ip     = getClientIp() ?: null;
        $ipHash = $ip ? hash('sha256', $ip) : null;

        $db   = getDb();
        $stmt = $db->prepare(
            'INSERT INTO crm_audit_logs
             (id, staff_id, staff_name, staff_role, module, action, entity_id, detail, ip_address_hash, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))'
        );
        $stmt->execute([
            generateId(),
            $staff['staff_id'] ?? ($staff['id'] ?? null),
            $staff['name'] ?? null,
            $staff['role'] ?? null,
            $module,
            $action,
            $entityId,
            $detail,
            $ipHash,
        ]);
    } catch (Throwable $e) {
        // Audit log must never break the request.
    }
}

// ── ID / code generators ───────────────────────────────────────────────────────

function crmNextPatientCode(PDO $db): string {
    // PT-0001 style, based on current patient count + 1.
    $n = (int)$db->query('SELECT COUNT(*) FROM patients')->fetchColumn() + 1;
    return 'PT-' . str_pad((string)$n, 4, '0', STR_PAD_LEFT);
}

function crmNextPoNumber(PDO $db): string {
    $n = (int)$db->query('SELECT COUNT(*) FROM purchase_orders')->fetchColumn() + 1;
    return 'PO-' . str_pad((string)$n, 3, '0', STR_PAD_LEFT);
}

function crmBookingCodeDisplay(PDO $db): string {
    // DTY-#### sequential display code for CRM-created bookings.
    $n = (int)$db->query("SELECT COUNT(*) FROM bookings WHERE booking_code_display IS NOT NULL")->fetchColumn() + 1042;
    return 'DTY-' . str_pad((string)$n, 4, '0', STR_PAD_LEFT);
}

// ── Booking status state machine (mirrors src/lib/crm-status-machine.ts) ───────

function crmValidTransitions(): array {
    return [
        'PENDING'              => ['NEED_CONFIRMATION', 'CONFIRMED', 'CANCELLED'],
        'NEED_CONFIRMATION'    => ['CONFIRMED', 'CANCELLED', 'RESCHEDULED'],
        'CONFIRMED'            => ['NURSE_ASSIGNED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
        'NURSE_ASSIGNED'       => ['NURSE_ON_THE_WAY', 'CONFIRMED', 'CANCELLED'],
        'NURSE_ON_THE_WAY'     => ['SCREENING_STARTED', 'CANCELLED'],
        'SCREENING_STARTED'    => ['SCREENING_COMPLETED', 'NOT_ELIGIBLE'],
        'SCREENING_COMPLETED'  => ['CONSENT_SIGNED', 'NOT_ELIGIBLE'],
        'CONSENT_SIGNED'       => ['TREATMENT_IN_PROGRESS'],
        'TREATMENT_IN_PROGRESS'=> ['TREATMENT_COMPLETED'],
        'TREATMENT_COMPLETED'  => ['PAYMENT_COMPLETED', 'FOLLOW_UP'],
        'PAYMENT_COMPLETED'    => ['FOLLOW_UP', 'CLOSED'],
        'FOLLOW_UP'            => ['CLOSED'],
        'CLOSED'               => [],
        'CANCELLED'            => [],
        'NOT_ELIGIBLE'         => [],
        'NO_SHOW'              => [],
        'RESCHEDULED'          => ['NEED_CONFIRMATION'],
    ];
}

function crmIsValidTransition(string $from, string $to): bool {
    $map = crmValidTransitions();
    return in_array($to, $map[$from] ?? [], true);
}

// Map a CRM lifecycle status to the legacy bookings.status enum so the existing
// /admin panel stays consistent with CRM-driven changes.
function crmStatusToLegacy(string $crmStatus): string {
    switch ($crmStatus) {
        case 'PENDING':
        case 'NEED_CONFIRMATION':
        case 'RESCHEDULED':
            return 'BARU';
        case 'CONFIRMED':
        case 'NURSE_ASSIGNED':
        case 'NURSE_ON_THE_WAY':
            return 'KONFIRMASI';
        case 'SCREENING_STARTED':
        case 'SCREENING_COMPLETED':
        case 'CONSENT_SIGNED':
        case 'TREATMENT_IN_PROGRESS':
            return 'DIPROSES';
        case 'TREATMENT_COMPLETED':
        case 'PAYMENT_COMPLETED':
        case 'FOLLOW_UP':
        case 'CLOSED':
            return 'SELESAI';
        case 'CANCELLED':
        case 'NOT_ELIGIBLE':
        case 'NO_SHOW':
            return 'DIBATALKAN';
        default:
            return 'BARU';
    }
}

// Safely decrypt a possibly-null encrypted field, returning $fallback on failure.
function crmTryDecrypt(?string $enc, ?string $fallback = null): ?string {
    if ($enc === null || $enc === '') return $fallback;
    try { return decryptField($enc); } catch (Throwable $e) { return $fallback; }
}

// The nurse roster id linked to a CRM staff login (null if not a nurse).
function crmNurseIdForStaff(PDO $db, string $staffId): ?string {
    $s = $db->prepare('SELECT id FROM nurses WHERE staff_id = ? LIMIT 1');
    $s->execute([$staffId]);
    $v = $s->fetchColumn();
    return $v !== false ? (string)$v : null;
}

// Deduct medical stock for items used in a treatment. Creates stock_movement OUT
// rows and decrements inventory_items.stock_current. Throws RuntimeException if any
// item has insufficient stock (caller should report a 422 and NOT complete).
// Items without an inventory_item_id (free-text) are ignored.
function crmDeductInventory(PDO $db, array $itemsUsed, string $treatmentId, ?string $staffId): void {
    foreach ($itemsUsed as $item) {
        $invId = isset($item['inventory_item_id']) ? (string)$item['inventory_item_id'] : '';
        $qty   = (int)($item['qty'] ?? $item['quantity'] ?? 0);
        if ($invId === '' || $qty <= 0) continue;

        $s = $db->prepare('SELECT stock_current, name FROM inventory_items WHERE id = ? LIMIT 1');
        $s->execute([$invId]);
        $inv = $s->fetch();
        if (!$inv) continue;
        if ((int)$inv['stock_current'] < $qty) {
            throw new RuntimeException("Stok '{$inv['name']}' tidak cukup (tersisa {$inv['stock_current']}, butuh {$qty})");
        }
    }
    // Second pass: apply (all checked OK)
    foreach ($itemsUsed as $item) {
        $invId = isset($item['inventory_item_id']) ? (string)$item['inventory_item_id'] : '';
        $qty   = (int)($item['qty'] ?? $item['quantity'] ?? 0);
        if ($invId === '' || $qty <= 0) continue;

        $db->prepare('UPDATE inventory_items SET stock_current = stock_current - ?, updated_at = NOW() WHERE id = ?')
           ->execute([$qty, $invId]);
        $db->prepare(
            'INSERT INTO stock_movements (id, inventory_item_id, type, quantity, reference_type, reference_id, notes, performed_by_staff_id, created_at)
             VALUES (?, ?, "OUT", ?, "TREATMENT", ?, ?, ?, NOW(3))'
        )->execute([generateId(), $invId, $qty, $treatmentId, 'Treatment usage', $staffId]);
    }
}

// Lifecycle position of a crm_status (mirrors STATUS_RANK in src/lib/crm-status.ts).
// Negative = terminal, unknown statuses rank 0.
function crmStatusRank(string $status): int {
    static $rank = [
        'PENDING'=>0,'NEED_CONFIRMATION'=>1,'CONFIRMED'=>2,'NURSE_ASSIGNED'=>3,'NURSE_ON_THE_WAY'=>4,
        'SCREENING_STARTED'=>5,'SCREENING_COMPLETED'=>6,'CONSENT_SIGNED'=>7,'TREATMENT_IN_PROGRESS'=>8,
        'TREATMENT_COMPLETED'=>9,'PAYMENT_COMPLETED'=>10,'FOLLOW_UP'=>11,'CLOSED'=>12,
        'CANCELLED'=>-1,'RESCHEDULED'=>1,'NOT_ELIGIBLE'=>-1,'NO_SHOW'=>-1,
    ];
    return $rank[$status] ?? 0;
}

// Advance a booking's crm_status to $target only if it is currently earlier in
// the lifecycle (and not terminal). Keeps legacy bookings.status in sync.
function crmAdvanceBookingStatus(PDO $db, string $bookingId, string $target): void {
    $s = $db->prepare('SELECT crm_status FROM bookings WHERE id = ? LIMIT 1');
    $s->execute([$bookingId]);
    $cur = (string)($s->fetchColumn() ?: 'PENDING');
    if (crmStatusRank($cur) < 0) return; // terminal — don't override
    if (crmStatusRank($target) <= crmStatusRank($cur)) {
        // still keep legacy status synced
        $db->prepare('UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?')
           ->execute([crmStatusToLegacy($cur), $bookingId]);
        return;
    }
    $db->prepare('UPDATE bookings SET crm_status = ?, status = ?, updated_at = NOW() WHERE id = ?')
       ->execute([$target, crmStatusToLegacy($target), $bookingId]);
}

// ── Public (unauthenticated) link helpers — consent-public.php ────────────────

// Short, URL-safe, alphanumeric-only token for public consent links. No '-'/'_'
// so it can never be misread as WhatsApp italic/markdown when pasted into a chat.
// 14 chars over a 62-char alphabet ≈ 83 bits of entropy — plenty given the link
// also expires and is rate-limited.
function crmGenerateShortToken(int $length = 14): string {
    $alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    $max = strlen($alphabet) - 1;
    $token = '';
    for ($i = 0; $i < $length; $i++) {
        $token .= $alphabet[random_int(0, $max)];
    }
    return $token;
}

// Rate limit for endpoints with no staff session (public consent link). Keyed by
// IP + a named action; backed by crm_audit_logs under module "CONSENT_LINK" so no
// extra table is needed (mirrors checkBookingRateLimit() in helpers.php, which
// counts audit_logs the same way). Every call — pass or fail — is itself logged
// so it counts toward the window.
function crmCheckPublicRateLimit(string $ipHash, string $action, int $windowMinutes, int $maxAttempts): void {
    $db = getDb();
    $windowStart = date('Y-m-d H:i:s', strtotime("-{$windowMinutes} minutes"));
    $stmt = $db->prepare(
        'SELECT COUNT(*) AS cnt FROM crm_audit_logs
         WHERE module = "CONSENT_LINK" AND action = ? AND ip_address_hash = ? AND created_at > ?'
    );
    $stmt->execute([$action, $ipHash, $windowStart]);
    $row = $stmt->fetch();
    if ((int)($row['cnt'] ?? 0) >= $maxAttempts) {
        jsonError('Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.', 429);
    }
    crmAuditLog(null, 'CONSENT_LINK', $action, null, null);
}

<?php
// ─────────────────────────────────────────────────────────────────────────────
// Drips To You - Bali — CRM Internal shared bootstrap
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

// The module(s) that give a role a reachable "home" page (mirrors
// crmLandingModules() in src/lib/crm-permissions.ts). NURSE always lands on
// the nurse portal, which 403s without 'nurse_portal' (or manager-level
// 'nurse') — so that's the one checkbox a custom-access nurse can't skip.
function crmLandingModules(string $role): array {
    if ($role === 'NURSE') return ['nurse_portal', 'nurse'];
    return ['dashboard', 'nurse_portal', 'booking', 'patient', 'finance', 'purchase_order', 'inventory', 'area', 'whatsapp'];
}

// Final trust-boundary validation for a custom-permission module list (the
// Next.js UI enforces the same rule, but this is the check that actually
// matters). Returns an error message if the staff would end up locked out of
// every page, or null if the selection is fine.
function crmValidateCustomModules(string $role, array $modules): ?string {
    if ($role === 'OWNER') return null;
    if (count($modules) === 0) {
        return 'Pilih minimal satu modul akses — tanpa itu staff tidak akan bisa masuk ke akunnya.';
    }
    if (!array_intersect(crmLandingModules($role), $modules)) {
        return $role === 'NURSE'
            ? "Modul 'Portal Nurse' wajib dicentang — itu satu-satunya halaman yang bisa diakses akun nurse."
            : 'Wajib centang minimal satu modul utama (mis. Dashboard, Booking, Pasien, Finance, dll) agar staff punya halaman yang bisa diakses.';
    }
    return null;
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

// ── Time gate form on-site (screening / consent / treatment) ──────────────────
// Form-form ini adalah dokumentasi tindakan di lokasi pasien, jadi baru boleh
// diisi mendekati jadwal booking — bukan berhari-hari sebelumnya. Dibuka
// beberapa menit lebih awal supaya nurse yang tiba duluan tidak terkunci.
// Server berjalan di Asia/Makassar (WITA) — lihat helpers.php.

function crmFormOpenMinutesEarly(): int { return 60; }

// Unix timestamp kapan form booking ini terbuka (null bila tanggal tidak valid).
function crmFormOpenEpoch(?string $bookingDate, ?string $bookingTime): ?int {
    if (empty($bookingDate)) return null;
    $time = (is_string($bookingTime) && preg_match('/^\d{1,2}:\d{2}/', $bookingTime))
        ? substr($bookingTime, 0, 5) : '00:00';
    $ts = strtotime($bookingDate . ' ' . $time . ':00');
    if ($ts === false) return null;
    return $ts - crmFormOpenMinutesEarly() * 60;
}

// Lampirkan status gate ke payload booking (untuk GET, agar UI bisa menampilkan
// lock yang sama dengan yang di-enforce POST). Butuh booking_date/booking_time.
function crmAttachFormWindow(array $booking): array {
    $open = crmFormOpenEpoch($booking['booking_date'] ?? null, $booking['booking_time'] ?? null);
    $booking['forms_open_at'] = $open !== null ? date('Y-m-d H:i:s', $open) : null;
    $booking['forms_locked']  = $open !== null && time() < $open;
    return $booking;
}

// Trust boundary: tolak pengisian form sebelum waktunya (423 Locked).
function crmRequireFormWindowOpen(PDO $db, string $bookingId): void {
    $s = $db->prepare('SELECT booking_date, booking_time FROM bookings WHERE id = ? LIMIT 1');
    $s->execute([$bookingId]);
    $b = $s->fetch();
    if (!$b) return; // booking tidak ada → biarkan pemeriksaan caller yang melapor 404
    $open = crmFormOpenEpoch($b['booking_date'] ?? null, $b['booking_time'] ?? null);
    if ($open !== null && time() < $open) {
        jsonError(
            'Belum waktunya. Jadwal booking ini ' . date('d/m/Y', strtotime((string)$b['booking_date'])) .
            ' jam ' . substr((string)$b['booking_time'], 0, 5) . ' WITA — form baru bisa diisi mulai ' .
            date('d/m/Y H:i', $open) . ' WITA (' . crmFormOpenMinutesEarly() . ' menit sebelum jadwal).',
            423
        );
    }
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
        crmEnsurePatientForBooking($db, $bookingId);
        return;
    }
    $db->prepare('UPDATE bookings SET crm_status = ?, status = ?, updated_at = NOW() WHERE id = ?')
       ->execute([$target, crmStatusToLegacy($target), $bookingId]);
    crmEnsurePatientForBooking($db, $bookingId);
}

// Bookings placed from the public website never set `patient_id` (only CRM's
// own "create booking" form resolves/creates a patient). Once a booking has
// been confirmed, auto-link it to a patient record so it shows up under
// Pasien — matching an existing patient by phone when possible instead of
// creating a duplicate, otherwise creating a new one from the booking's data.
// No-op if already linked, not yet confirmed, or `patients` doesn't exist.
function crmEnsurePatientForBooking(PDO $db, string $bookingId): void {
    if (!tableExists($db, 'patients')) return;

    $stmt = $db->prepare(
        'SELECT patient_id, crm_status, customer_name, customer_phone_encrypted,
                customer_phone_last4, address_encrypted, service_area_id
         FROM   bookings WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$bookingId]);
    $b = $stmt->fetch();
    if (!$b || !empty($b['patient_id'])) return;
    if (crmStatusRank($b['crm_status'] ?? 'PENDING') < crmStatusRank('CONFIRMED')) return;

    $now = date('Y-m-d H:i:s');

    // Dedup: match an existing patient with the same last-4 whose decrypted
    // phone equals the booking's — avoids creating a new patient row every
    // time a repeat customer's booking gets confirmed.
    $patientId = null;
    $bookingPhone = null;
    try { $bookingPhone = decryptField($b['customer_phone_encrypted']); } catch (Exception $e) {}

    if ($bookingPhone !== null) {
        $cand = $db->prepare('SELECT id, phone_encrypted FROM patients WHERE phone_last4 = ?');
        $cand->execute([$b['customer_phone_last4']]);
        foreach ($cand->fetchAll() as $p) {
            try {
                if (decryptField($p['phone_encrypted']) === $bookingPhone) {
                    $patientId = $p['id'];
                    break;
                }
            } catch (Exception $e) {}
        }
    }

    if (!$patientId) {
        $patientId = generateId();
        $db->prepare(
            'INSERT INTO patients (id, name, phone_encrypted, phone_last4, address_encrypted, area_id, booking_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)'
        )->execute([
            $patientId, $b['customer_name'], $b['customer_phone_encrypted'], $b['customer_phone_last4'],
            $b['address_encrypted'], $b['service_area_id'], $now, $now,
        ]);
    }

    $db->prepare('UPDATE bookings SET patient_id = ?, updated_at = ? WHERE id = ?')
       ->execute([$patientId, $now, $bookingId]);
    $db->prepare('UPDATE patients SET booking_count = booking_count + 1, is_repeat = (booking_count + 1 >= 2), updated_at = ? WHERE id = ?')
       ->execute([$now, $patientId]);
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

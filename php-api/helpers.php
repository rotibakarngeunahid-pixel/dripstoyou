<?php
// ─────────────────────────────────────────────────────────────────────────────
// Drips To You - Bali — Shared PHP API Helpers
// ─────────────────────────────────────────────────────────────────────────────

if (!defined('DB_HOST')) {
    require_once __DIR__ . '/config.php';
}

date_default_timezone_set('Asia/Makassar');

// ── Database Connection ───────────────────────────────────────────────────────

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        // Don't expose DB error to client
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    return $pdo;
}

// ── CORS ──────────────────────────────────────────────────────────────────────

function handleCors(): void {
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = defined('ALLOWED_ORIGINS') ? ALLOWED_ORIGINS : [];

    if (!empty($allowed) && in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    } elseif (!empty($allowed)) {
        header('Access-Control-Allow-Origin: ' . $allowed[0]);
        header('Access-Control-Allow-Credentials: true');
    } else {
        // Wildcard origin must not be combined with credentials (browsers reject it)
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ── Response Helpers ──────────────────────────────────────────────────────────

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonSuccess($data = null, string $message = 'Berhasil', int $status = 200): void {
    $resp = ['success' => true, 'message' => $message];
    if ($data !== null) $resp['data'] = $data;
    jsonResponse($resp, $status);
}

function jsonError(string $message, int $status = 400): void {
    jsonResponse(['success' => false, 'message' => $message], $status);
}

// ── Request Parsing ───────────────────────────────────────────────────────────

function getBodyJson(): array {
    $body = file_get_contents('php://input');
    if (empty($body)) return [];
    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Invalid JSON body', 400);
    }
    return $data ?? [];
}

function getMethod(): string {
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function requireMethod(string ...$methods): void {
    if (!in_array(getMethod(), $methods, true)) {
        jsonError('Method not allowed', 405);
    }
}

// ── Auth (Bearer Token) ───────────────────────────────────────────────────────

function requireAuth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        jsonError('Unauthorized', 401);
    }
    $token = trim($m[1]);
    $hash  = hash('sha256', $token);

    $db   = getDb();
    $stmt = $db->prepare(
        'SELECT s.id AS session_id, a.id AS admin_id, a.name, a.email, a.role
         FROM   admin_sessions s
         JOIN   admins a ON a.id = s.admin_id
         WHERE  s.session_token_hash = ?
           AND  s.expires_at > NOW()
           AND  s.revoked_at IS NULL
           AND  a.is_active = 1
         LIMIT  1'
    );
    $stmt->execute([$hash]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonError('Unauthorized', 401);
    }

    return $admin;
}

// RBAC — endpoint/method hanya boleh diakses role tertentu.
// PHP adalah trust boundary terakhir: cek role di Next.js saja tidak cukup
// karena API ini bisa dipanggil langsung tanpa melewati proxy Vercel.
function requireRole(array $admin, string ...$roles): void {
    if (!in_array($admin['role'] ?? '', $roles, true)) {
        jsonError('Forbidden', 403);
    }
}

// ── Rate Limiting (MySQL-based) ───────────────────────────────────────────────

function checkLoginRateLimit(string $ipHash, string $emailHash): void {
    $db          = getDb();
    $windowStart = date('Y-m-d H:i:s', strtotime('-15 minutes'));
    $stmt        = $db->prepare(
        'SELECT COUNT(*) AS cnt FROM login_attempts
         WHERE (ip_address_hash = ? OR email_hash = ?)
           AND success = 0
           AND created_at > ?'
    );
    $stmt->execute([$ipHash, $emailHash, $windowStart]);
    $row = $stmt->fetch();
    if ((int)($row['cnt'] ?? 0) >= 5) {
        jsonError('Too many login attempts. Try again in 15 minutes.', 429);
    }
}

function checkBookingRateLimit(string $ipHash): void {
    $db          = getDb();
    $windowStart = date('Y-m-d H:i:s', strtotime('-10 minutes'));
    $stmt        = $db->prepare(
        'SELECT COUNT(*) AS cnt FROM audit_logs
         WHERE action = "CREATE_BOOKING"
           AND ip_address_hash = ?
           AND created_at > ?'
    );
    $stmt->execute([$ipHash, $windowStart]);
    $row = $stmt->fetch();
    if ((int)($row['cnt'] ?? 0) >= 5) {
        jsonError('Too many booking requests. Please try again later.', 429);
    }
}

// ── Encryption (AES-256-GCM — matches Node.js format) ────────────────────────
// Format: base64( iv[12] + authTag[16] + ciphertext )

function encryptField(string $plaintext): string {
    $key        = hex2bin(FIELD_ENCRYPTION_KEY);
    $iv         = random_bytes(12);
    $tag        = '';
    $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
    if ($ciphertext === false) throw new RuntimeException('Encryption failed');
    return base64_encode($iv . $tag . $ciphertext);
}

function decryptField(?string $b64): string {
    // Accepts null/empty (some legacy or manually-seeded rows have blank
    // encrypted columns) and turns it into a normal catchable RuntimeException
    // instead of a TypeError -- every call site wraps this in
    // `catch (Exception $e)`, which does NOT catch \TypeError (a \Error, not
    // an \Exception), so a bare `string $b64` signature crashed the whole
    // request uncaught whenever the column was NULL.
    if ($b64 === null || $b64 === '') throw new RuntimeException('Empty ciphertext');
    $key        = hex2bin(FIELD_ENCRYPTION_KEY);
    $raw        = base64_decode($b64, true);
    if ($raw === false) throw new RuntimeException('Invalid base64');
    $iv         = substr($raw, 0, 12);
    $tag        = substr($raw, 12, 16);
    $ciphertext = substr($raw, 28);
    $plaintext  = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($plaintext === false) throw new RuntimeException('Decryption failed');
    return $plaintext;
}

// ── ID & Code Generation ──────────────────────────────────────────────────────

function generateId(): string {
    return bin2hex(random_bytes(15)); // 30-char hex, fits VARCHAR(191)
}

function generateBookingCode(): string {
    $yy   = date('y');
    $mm   = date('m');
    $dd   = date('d');
    $pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $rand = '';
    for ($i = 0; $i < 4; $i++) {
        $rand .= $pool[random_int(0, strlen($pool) - 1)];
    }
    return "DRY{$yy}{$mm}{$dd}{$rand}";
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

function auditLog(string $action, ?string $adminId = null, ?string $entityType = null, ?string $entityId = null, array $meta = []): void {
    try {
        $ip     = getClientIp() ?: null;
        $ua     = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $ipHash = $ip ? hash('sha256', $ip) : null;
        $uaHash = $ua ? hash('sha256', $ua) : null;

        $db   = getDb();
        $stmt = $db->prepare(
            'INSERT INTO audit_logs
             (id, actor_admin_id, action, entity_type, entity_id, metadata_json, ip_address_hash, user_agent_hash, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            generateId(),
            $adminId,
            $action,
            $entityType,
            $entityId,
            !empty($meta) ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
            $ipHash,
            $uaHash,
        ]);
    } catch (Exception $e) {
        // Silent — audit log must never break the request
    }
}

// ── Password ──────────────────────────────────────────────────────────────────

function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

// ── Input Sanitization ────────────────────────────────────────────────────────

function str_clean(mixed $v, int $max = 500): string {
    return mb_substr(trim((string)$v), 0, $max);
}

function requireFields(array $data, array $fields): void {
    foreach ($fields as $f) {
        if (!array_key_exists($f, $data) || $data[$f] === '' || $data[$f] === null) {
            jsonError("Field '{$f}' is required", 422);
        }
    }
}

function getClientIp(): string {
    // X-Forwarded-For bisa berisi daftar "client, proxy1, proxy2" dan bisa
    // dipalsukan oleh pemanggil langsung — ambil hanya IP valid pertama.
    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($xff !== '') {
        $first = trim(explode(',', $xff)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP) !== false) {
            return $first;
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '';
}

function getIpHash(): string {
    return hash('sha256', getClientIp());
}

function parseDateYmdStrict(string $dateStr): ?array {
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $dateStr, $m)) {
        return null;
    }
    $year = (int)$m[1];
    $month = (int)$m[2];
    $day = (int)$m[3];
    return checkdate($month, $day, $year) ? [$year, $month, $day] : null;
}

function timeToMinutesStrict(?string $time): ?int {
    if (!is_string($time) || !preg_match('/^(\d{2}):(\d{2})(?::(\d{2}))?$/', $time, $m)) {
        return null;
    }
    $hour = (int)$m[1];
    $minute = (int)$m[2];
    $second = isset($m[3]) ? (int)$m[3] : 0;
    if ($hour < 0 || $hour > 23 || $minute < 0 || $minute > 59 || $second < 0 || $second > 59) {
        return null;
    }
    return $hour * 60 + $minute;
}

function minutesToTime(int $minutes): string {
    return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
}

function getDateAvailability(PDO $db, string $dateStr): array {
    $parts = parseDateYmdStrict($dateStr);
    if ($parts === null) {
        throw new InvalidArgumentException('Invalid date');
    }

    [$year, $month, $day] = $parts;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%04d-%02d-%02d', $year, $month, $day));
    if (!$date) {
        throw new InvalidArgumentException('Invalid date');
    }

    $today = new DateTimeImmutable('today');
    if ($date < $today) {
        return ['available' => false, 'slots' => [], 'maxBookingsPerSlot' => 0];
    }

    $dayOfWeek = (int)$date->format('w');
    $stmt = $db->prepare(
        'SELECT is_open, open_time, close_time, slot_duration_minutes, max_bookings_per_slot, min_prebooking_minutes
         FROM   schedule_settings
         WHERE  day_of_week = ?
         LIMIT  1'
    );
    $stmt->execute([$dayOfWeek]);
    $schedule = $stmt->fetch();

    if (!$schedule || !(bool)$schedule['is_open']) {
        return ['available' => false, 'slots' => [], 'maxBookingsPerSlot' => 0];
    }

    $openMinutes = timeToMinutesStrict($schedule['open_time'] ?? null);
    $closeMinutes = timeToMinutesStrict($schedule['close_time'] ?? null);
    $slotDur = max(1, (int)($schedule['slot_duration_minutes'] ?? 60));
    $maxPerSlot = max(1, (int)($schedule['max_bookings_per_slot'] ?? 1));
    $minPrebooking = max(0, (int)($schedule['min_prebooking_minutes'] ?? 0));

    if ($openMinutes === null || $closeMinutes === null || $closeMinutes <= $openMinutes) {
        return ['available' => false, 'slots' => [], 'maxBookingsPerSlot' => $maxPerSlot];
    }

    $stmt = $db->prepare('SELECT id FROM blocked_dates WHERE date = ? AND is_full_day = 1 LIMIT 1');
    $stmt->execute([$dateStr]);
    if ($stmt->fetch()) {
        return ['available' => false, 'slots' => [], 'maxBookingsPerSlot' => $maxPerSlot];
    }

    $blockedRanges = [];
    $stmt = $db->prepare(
        'SELECT start_time, end_time
         FROM blocked_dates
         WHERE date = ? AND is_full_day = 0 AND start_time IS NOT NULL AND end_time IS NOT NULL'
    );
    $stmt->execute([$dateStr]);
    foreach ($stmt->fetchAll() as $row) {
        $start = timeToMinutesStrict($row['start_time'] ?? null);
        $end = timeToMinutesStrict($row['end_time'] ?? null);
        if ($start !== null && $end !== null && $end > $start) {
            $blockedRanges[] = [$start, $end];
        }
    }

    $stmt = $db->prepare(
        "SELECT booking_time, COUNT(*) AS cnt
         FROM   bookings
         WHERE  booking_date = ?
           AND  status NOT IN ('DIBATALKAN')
         GROUP  BY booking_time"
    );
    $stmt->execute([$dateStr]);
    $counts = [];
    foreach ($stmt->fetchAll() as $r) {
        $bookingMinutes = timeToMinutesStrict($r['booking_time'] ?? null);
        if ($bookingMinutes !== null) {
            $counts[minutesToTime($bookingMinutes)] = (int)$r['cnt'];
        }
    }

    $nowPlusBuffer = (new DateTimeImmutable('now'))->modify('+' . $minPrebooking . ' minutes');
    $slots = [];
    for ($m = $openMinutes; $m + $slotDur <= $closeMinutes; $m += $slotDur) {
        $slot = minutesToTime($m);
        $slotEnd = $m + $slotDur;
        $slotDateTime = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $dateStr . ' ' . $slot);
        if ($slotDateTime && $slotDateTime < $nowPlusBuffer) {
            continue;
        }

        $blocked = false;
        foreach ($blockedRanges as [$blockStart, $blockEnd]) {
            if ($m < $blockEnd && $slotEnd > $blockStart) {
                $blocked = true;
                break;
            }
        }
        if ($blocked) {
            continue;
        }

        if (($counts[$slot] ?? 0) < $maxPerSlot) {
            $slots[] = $slot;
        }
    }

    return [
        'available' => count($slots) > 0,
        'slots' => $slots,
        'maxBookingsPerSlot' => $maxPerSlot,
    ];
}

// Currency helpers

function currencyCatalog(): array {
    return [
        'IDR' => ['symbol' => 'Rp', 'name' => 'Indonesian Rupiah', 'decimal_places' => 0],
        'USD' => ['symbol' => '$',  'name' => 'US Dollar',         'decimal_places' => 2],
        'AUD' => ['symbol' => 'A$', 'name' => 'Australian Dollar', 'decimal_places' => 2],
        'EUR' => ['symbol' => '€',  'name' => 'Euro',              'decimal_places' => 2],
        'SGD' => ['symbol' => 'S$', 'name' => 'Singapore Dollar',  'decimal_places' => 2],
    ];
}

function normalizeCurrencyCode(?string $currency): string {
    $code = strtoupper(trim((string)($currency ?: 'IDR')));
    return array_key_exists($code, currencyCatalog()) ? $code : 'IDR';
}

// ── Multi-Currency Price Helpers ──────────────────────────────────────────────

function ensureProductPricesJsonSchema(PDO $db): void {
    if (!columnExists($db, 'products', 'prices_json')) {
        $db->exec("ALTER TABLE `products` ADD COLUMN `prices_json` JSON NULL AFTER `price_label`");
    }
}

function normalizePricesInput(mixed $raw): array {
    if (empty($raw) || !is_array($raw)) return [];
    $result = [];
    foreach ($raw as $key => $val) {
        if (is_string($key)) {
            // Object format: {"IDR": 50000, "USD": 29.99}
            $code   = normalizeCurrencyCode($key);
            $amount = max(0, (float)$val);
            if ($amount > 0) $result[$code] = $amount;
        } elseif (is_array($val) && isset($val['currency'])) {
            // Array format: [{"currency":"IDR","amount":50000}, ...]
            $code   = normalizeCurrencyCode((string)($val['currency'] ?? ''));
            $amount = max(0, (float)($val['amount'] ?? 0));
            if ($amount > 0) $result[$code] = $amount;
        }
    }
    return $result;
}

function primaryPriceFromPrices(array $prices): array {
    if (empty($prices)) return ['amount' => 0.0, 'currency' => 'IDR'];
    if (isset($prices['IDR'])) return ['amount' => $prices['IDR'], 'currency' => 'IDR'];
    $first = (string)array_key_first($prices);
    return ['amount' => $prices[$first], 'currency' => $first];
}

function formatPricesLabel(array $prices): string {
    $parts = [];
    foreach ($prices as $currency => $amount) {
        $parts[] = formatCurrencyAmount((float)$amount, (string)$currency);
    }
    return implode(' / ', $parts);
}

function decodePricesJson(?string $json, float $fallbackAmount, string $fallbackCurrency): array {
    if ($json !== null) {
        $decoded = json_decode($json, true);
        if (is_array($decoded) && !empty($decoded)) return $decoded;
    }
    if ($fallbackAmount > 0) return [$fallbackCurrency => $fallbackAmount];
    return [];
}

function ensureBookingDeletionLogsTable(PDO $db): void {
    static $done = false;
    if ($done) return;
    $db->exec(
        "CREATE TABLE IF NOT EXISTS `booking_deletion_logs` (
            `id`                      VARCHAR(30)  NOT NULL,
            `booking_id`              VARCHAR(30)  NOT NULL,
            `booking_code`            VARCHAR(20)  NOT NULL,
            `booking_snapshot`        LONGTEXT     NOT NULL,
            `deleted_by_admin_id`     VARCHAR(30)  NOT NULL,
            `deleted_by_admin_name`   VARCHAR(191) NOT NULL,
            `deleted_by_admin_email`  VARCHAR(191) NOT NULL,
            `reason`                  TEXT         NOT NULL,
            `ip_address`              VARCHAR(100) NULL,
            `deleted_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_deleted_at`  (`deleted_at`),
            KEY `idx_booking_code` (`booking_code`),
            KEY `idx_deleted_by`  (`deleted_by_admin_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $done = true;
}

// The legacy /admin/bookings panel writes `bookings.status` (BARU/KONFIRMASI/
// DIPROSES/SELESAI/DIBATALKAN). The newer CRM panel (/crm/booking) reads
// `bookings.crm_status` (PENDING..CLOSED) instead — the two columns are only
// kept in sync one direction (crm_status -> status, via crmStatusToLegacy() in
// php-api/crm/_crm.php). Without this, confirming a booking in the old admin
// panel leaves the CRM panel showing "Pending" forever. Call this right after
// any legacy `status` write so both panels agree.
function syncCrmStatusFromLegacy(PDO $db, string $bookingId, string $legacyStatus, string $now): void {
    if (!columnExists($db, 'bookings', 'crm_status')) return; // CRM migration not applied yet

    $rank = [
        'PENDING' => 0, 'NEED_CONFIRMATION' => 1, 'CONFIRMED' => 2, 'NURSE_ASSIGNED' => 3,
        'NURSE_ON_THE_WAY' => 4, 'SCREENING_STARTED' => 5, 'SCREENING_COMPLETED' => 6,
        'CONSENT_SIGNED' => 7, 'TREATMENT_IN_PROGRESS' => 8, 'TREATMENT_COMPLETED' => 9,
        'PAYMENT_COMPLETED' => 10, 'FOLLOW_UP' => 11, 'CLOSED' => 12,
        'CANCELLED' => -1, 'RESCHEDULED' => 1, 'NOT_ELIGIBLE' => -1, 'NO_SHOW' => -1,
    ];

    $stmt = $db->prepare('SELECT crm_status FROM bookings WHERE id = ? LIMIT 1');
    $stmt->execute([$bookingId]);
    $cur = (string)($stmt->fetchColumn() ?: 'PENDING');

    if ($legacyStatus === 'DIBATALKAN') {
        // Cancellation always wins, even over a booking that has already
        // progressed further in the CRM pipeline.
        if ($cur !== 'CANCELLED') {
            $db->prepare('UPDATE bookings SET crm_status = ?, updated_at = ? WHERE id = ?')
               ->execute(['CANCELLED', $now, $bookingId]);
        }
        return;
    }

    if (($rank[$cur] ?? 0) < 0) return; // already terminal (cancelled/not eligible/no-show) — don't resurrect

    switch ($legacyStatus) {
        case 'BARU':       $target = 'PENDING';             break;
        case 'KONFIRMASI': $target = 'CONFIRMED';            break;
        case 'DIPROSES':   $target = 'SCREENING_STARTED';    break;
        case 'SELESAI':    $target = 'TREATMENT_COMPLETED';  break;
        default:           $target = null;
    }
    if ($target === null) return;

    // Only advance — never regress a booking the CRM panel has already moved
    // further along (e.g. don't knock NURSE_ASSIGNED back down to CONFIRMED).
    if (($rank[$target] ?? 0) > ($rank[$cur] ?? 0)) {
        $db->prepare('UPDATE bookings SET crm_status = ?, updated_at = ? WHERE id = ?')
           ->execute([$target, $now, $bookingId]);
    }
}

function tableExists(PDO $db, string $table): bool {
    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
    );
    $stmt->execute([$table]);
    return (int)$stmt->fetchColumn() > 0;
}

function columnExists(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function ensureCurrencySchema(PDO $db): void {
    static $done = false;
    if ($done) return;

    if (!columnExists($db, 'products', 'currency')) {
        $db->exec("ALTER TABLE `products` ADD COLUMN `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR' AFTER `price_amount`");
    }

    $stmt = $db->prepare("SHOW COLUMNS FROM `products` LIKE 'price_amount'");
    $stmt->execute();
    $priceColumn = $stmt->fetch();
    if ($priceColumn && strpos(strtolower((string)$priceColumn['Type']), 'int') !== false) {
        $db->exec("ALTER TABLE `products` MODIFY COLUMN `price_amount` DECIMAL(12,2) NOT NULL");
    }

    $db->exec(
        "CREATE TABLE IF NOT EXISTS `currency_settings` (
            `code` VARCHAR(10) NOT NULL,
            `symbol` VARCHAR(8) NOT NULL,
            `name` VARCHAR(50) NOT NULL,
            `decimal_places` INTEGER NOT NULL DEFAULT 0,
            `manual_rate_to_idr` DECIMAL(18,6) NULL,
            `is_active` BOOLEAN NOT NULL DEFAULT true,
            `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (`code`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    $stmt = $db->prepare(
        'INSERT INTO currency_settings (code, symbol, name, decimal_places, is_active, updated_at)
         VALUES (?, ?, ?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE
           symbol = VALUES(symbol),
           name = VALUES(name),
           decimal_places = VALUES(decimal_places)'
    );

    foreach (currencyCatalog() as $code => $meta) {
        $stmt->execute([$code, $meta['symbol'], $meta['name'], $meta['decimal_places']]);
    }

    $done = true;
}

function formatCurrencyAmount($amount, ?string $currency = 'IDR'): string {
    $code = normalizeCurrencyCode($currency);
    $meta = currencyCatalog()[$code];
    $decimals = (int)$meta['decimal_places'];
    $formatted = number_format((float)$amount, $decimals, '.', $code === 'IDR' ? '.' : ',');

    if ($code === 'IDR') {
        return 'Rp ' . $formatted;
    }

    return $meta['symbol'] . $formatted;
}

function getCurrencySettings(PDO $db): array {
    ensureCurrencySchema($db);
    $rows = $db->query(
        'SELECT code, symbol, name, decimal_places, manual_rate_to_idr, is_active
         FROM currency_settings
         ORDER BY FIELD(code, "IDR", "USD", "AUD", "EUR", "SGD"), code ASC'
    )->fetchAll();

    foreach ($rows as &$row) {
        $row['decimalPlaces'] = (int)$row['decimal_places'];
        $row['manualRateToIdr'] = $row['manual_rate_to_idr'] !== null ? (float)$row['manual_rate_to_idr'] : null;
        $row['isActive'] = (bool)$row['is_active'];
        unset($row['decimal_places'], $row['manual_rate_to_idr'], $row['is_active']);
    }
    unset($row);

    return $rows;
}

// Site settings helpers

function getSiteSetting(string $key, ?string $default = null): ?string {
    $db = getDb();
    $stmt = $db->prepare('SELECT value_encrypted_or_json FROM site_settings WHERE `key` = ? LIMIT 1');
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : (string)$value;
}

function setSiteSetting(string $key, string $value, ?string $adminId = null): void {
    $db = getDb();
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare(
        'INSERT INTO site_settings (`key`, value_encrypted_or_json, updated_by_admin_id, updated_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           value_encrypted_or_json = VALUES(value_encrypted_or_json),
           updated_by_admin_id = VALUES(updated_by_admin_id),
           updated_at = VALUES(updated_at)'
    );
    $stmt->execute([$key, $value, $adminId, $now]);
}

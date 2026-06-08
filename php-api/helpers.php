<?php
// ─────────────────────────────────────────────────────────────────────────────
// DRIP TO YOU Bali — Shared PHP API Helpers
// ─────────────────────────────────────────────────────────────────────────────

if (!defined('DB_HOST')) {
    require_once __DIR__ . '/config.php';
}

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
    } elseif (!empty($allowed)) {
        header('Access-Control-Allow-Origin: ' . $allowed[0]);
    } else {
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
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

function decryptField(string $b64): string {
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
        $ip     = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
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
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
}

function getIpHash(): string {
    return hash('sha256', getClientIp());
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

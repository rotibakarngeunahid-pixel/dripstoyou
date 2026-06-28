<?php
// GET /php-api/crm/seed.php?secret=SEED_SECRET — one-time CRM staff seeding.
//
// Creates default CRM staff accounts with random strong passwords and returns
// the generated plaintext passwords ONCE in the response. Store them in your
// password manager immediately — they are bcrypt-hashed at rest and cannot be
// recovered afterwards. Re-running will NOT reset existing accounts.

require_once __DIR__ . '/../_crm.php';
handleCors();
requireMethod('GET');

$secret = $_GET['secret'] ?? '';
if (!defined('SEED_SECRET') || empty($secret) || !hash_equals((string)SEED_SECRET, (string)$secret)) {
    jsonError('Forbidden', 403);
}

$db  = getDb();
$now = date('Y-m-d H:i:s');

function crmRandomPassword(): string {
    // 18-char URL-safe password
    return rtrim(strtr(base64_encode(random_bytes(14)), '+/', 'Aa'), '=');
}

$defaults = [
    ['name' => 'Komang (Owner)', 'email' => 'komang@dripstoyou.com', 'role' => 'OWNER'],
    ['name' => 'Made (Admin)',   'email' => 'made@dripstoyou.com',   'role' => 'ADMIN'],
    ['name' => 'Nurse Ayu',      'email' => 'ayu@dripstoyou.com',    'role' => 'NURSE'],
    ['name' => 'Nurse Dewi',     'email' => 'dewi@dripstoyou.com',   'role' => 'NURSE'],
    ['name' => 'Kadek (Finance)','email' => 'kadek@dripstoyou.com',  'role' => 'FINANCE'],
];

$created     = [];
$credentials = [];

try {
    foreach ($defaults as $d) {
        $check = $db->prepare('SELECT id FROM crm_staff WHERE email = ? LIMIT 1');
        $check->execute([$d['email']]);
        $existing = $check->fetch();

        if ($existing) {
            $staffId = $existing['id'];
        } else {
            $staffId  = generateId();
            $password = crmRandomPassword();
            $db->prepare(
                'INSERT INTO crm_staff (id, name, email, password_hash, role, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
            )->execute([$staffId, $d['name'], $d['email'], hashPassword($password), $d['role'], $now, $now]);
            $created[]     = $d['email'] . ' (' . $d['role'] . ')';
            $credentials[] = ['email' => $d['email'], 'password' => $password, 'role' => $d['role']];
        }

        // Create a linked nurse roster row for NURSE staff (if missing).
        if ($d['role'] === 'NURSE') {
            $nc = $db->prepare('SELECT id FROM nurses WHERE staff_id = ? LIMIT 1');
            $nc->execute([$staffId]);
            if (!$nc->fetch()) {
                $db->prepare(
                    'INSERT INTO nurses (id, staff_id, name, phone_encrypted, phone_last4, is_active, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
                )->execute([generateId(), $staffId, $d['name'], encryptField('0000000000'), '0000', $now, $now]);
            }
        }
    }

    crmAuditLog(null, 'STAFF', 'SEED', null, 'CRM staff seeded: ' . implode(', ', $created));

    jsonSuccess([
        'created'     => $created,
        'credentials' => $credentials,
        'note'        => 'Save these passwords now — they are not stored in plaintext and cannot be shown again.',
    ], empty($created) ? 'All CRM staff already exist' : 'CRM staff seeded');
} catch (Throwable $e) {
    jsonError('Seeding failed', 500);
}

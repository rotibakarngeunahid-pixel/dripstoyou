<?php
// ─────────────────────────────────────────────────────────────────────────────
// DRIP TO YOU Bali — PHP API Configuration Template
// Salin file ini ke config.php, lalu isi dengan credential asli Anda.
// JANGAN commit config.php ke Git — sudah ada di .gitignore.
// ─────────────────────────────────────────────────────────────────────────────

// ── Database ──────────────────────────────────────────────────────────────────
define('DB_HOST',    'localhost');
define('DB_NAME',    'your_database_name');       // e.g. rotw4785_dripstoyou
define('DB_USER',    'your_database_username');   // e.g. rotw4785_admin
define('DB_PASS',    'your_database_password');
define('DB_CHARSET', 'utf8mb4');

// ── Field Encryption Key ──────────────────────────────────────────────────────
// 64-char hex string (32 bytes). Harus sama dengan FIELD_ENCRYPTION_KEY di .env lama.
// Generate baru: openssl rand -hex 32
// PENTING: Jika ada data terenkripsi di database, gunakan key yang SAMA.
define('FIELD_ENCRYPTION_KEY', 'your-64-char-hex-encryption-key-here');

// ── CORS — Domain yang boleh akses API ini ────────────────────────────────────
// Tambahkan domain frontend Anda (Vercel URL atau custom domain).
define('ALLOWED_ORIGINS', [
    'https://your-project.vercel.app',
    'https://dripstoyou.com',
    'https://www.dripstoyou.com',
    'http://localhost:3000',   // hapus di production
]);

// ── WhatsApp ──────────────────────────────────────────────────────────────────
define('WHATSAPP_NUMBER', '6281200000000');

// ── Session Duration ──────────────────────────────────────────────────────────
define('SESSION_DURATION_HOURS', 8);

// ── Seed Secret (untuk endpoint seed.php) ────────────────────────────────────
define('SEED_SECRET', 'change-this-to-a-random-secret');

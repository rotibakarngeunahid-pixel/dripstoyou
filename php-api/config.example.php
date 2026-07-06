<?php
// ─────────────────────────────────────────────────────────────────────────────
// Drips To You - Bali — PHP API Configuration Template
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

// ── Upload Storage ────────────────────────────────────────────────────────────
// UPLOAD_DIR: path absolut ke folder uploads (opsional, ada auto-detect dari lokasi file ini).
//   Contoh: /home/rotw4785/public_html/php-api/uploads/products
// UPLOAD_BASE_URL: URL publik root folder php-api ini.
//   TETAP GUNAKAN https://dripstoyou.com/php-api — JANGAN diganti ke api.dripstoyou.com.
//   Vercel akan mem-proxy /php-api/* ke api.dripstoyou.com secara otomatis,
//   sehingga URL gambar di database tetap dripstoyou.com/php-api/uploads/... (tidak berubah).
// define('UPLOAD_DIR', '/home/rotw4785/public_html/php-api/uploads/products');
define('UPLOAD_BASE_URL', 'https://dripstoyou.com/php-api');

// ── Session Duration ──────────────────────────────────────────────────────────
define('SESSION_DURATION_HOURS', 8);

// ── Seed Secret (untuk endpoint seed.php) ────────────────────────────────────
define('SEED_SECRET', 'change-this-to-a-random-secret');

// Initial admin used only when the admins table is empty during seeding.
define('INITIAL_ADMIN_EMAIL', 'owner@example.com');
define('INITIAL_ADMIN_PASSWORD', 'replace-with-a-strong-password');

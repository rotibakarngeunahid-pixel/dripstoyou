# DRIP TO YOU Bali — Deployment Guide

## Arsitektur

```
Browser / Next.js (Vercel)
        │
        ▼ HTTPS fetch (NEXT_PUBLIC_API_BASE_URL)
  PHP API — cPanel / Rumahweb
  public_html/api/
        │
        ▼ PDO / MySQL
  Database MySQL (cPanel)
```

- **Frontend:** Next.js di Vercel
- **Backend API:** PHP di cPanel shared hosting
- **Database:** MySQL di cPanel (included di paket hosting)

---

## Langkah 1 — Import Database ke MySQL cPanel

1. Login ke **cPanel → phpMyAdmin**
2. Buat database baru (misal: `rotw4785_dripstoyou`)
3. Buat user MySQL, beri ALL PRIVILEGES ke database tersebut
4. Klik database → tab **Import** → upload `database-setup.sql`
5. Klik **Go** — semua tabel akan dibuat

---

## Langkah 2 — Upload PHP API ke cPanel

### a) Buat config.php

Salin `php-api/config.example.php` → `php-api/config.php`, isi dengan credential asli:

```php
define('DB_HOST',    'localhost');
define('DB_NAME',    'rotw4785_dripstoyou');
define('DB_USER',    'rotw4785_admin');
define('DB_PASS',    'password-database-anda');
define('DB_CHARSET', 'utf8mb4');

// Key enkripsi — HARUS SAMA dengan FIELD_ENCRYPTION_KEY yang lama di .env
// Jika database baru, generate: openssl rand -hex 32
define('FIELD_ENCRYPTION_KEY', 'bd749e1585fe8f5e2644ad5c6bd35e6097f64af27c3bf906a4e898b6d139719a');

define('ALLOWED_ORIGINS', [
    'https://dripstoyou.com',
    'https://www.dripstoyou.com',
    'https://your-project.vercel.app',  // URL Vercel Anda
    'http://localhost:3000',             // hapus di production
]);

define('WHATSAPP_NUMBER', '6281234567890');
define('SESSION_DURATION_HOURS', 8);
define('SEED_SECRET', 'ganti-dengan-string-acak');
define('INITIAL_ADMIN_EMAIL', 'owner@dripstoyou.com');
define('INITIAL_ADMIN_PASSWORD', 'gunakan-password-kuat-minimal-12-karakter');
```

> ⚠️ **Jangan commit config.php** ke Git. Sudah ada di `.gitignore`.

### b) Upload ke cPanel (File Manager / FTP)

Upload seluruh isi folder `php-api/` ke: `public_html/api/`

Struktur akhir di server:
```
public_html/
└── api/
    ├── .htaccess
    ├── config.php          ← buat manual dari config.example.php
    ├── helpers.php
    ├── products.php
    ├── areas.php
    ├── settings.php
    ├── availability.php
    ├── bookings.php
    └── admin/
        ├── .htaccess
        ├── login.php
        ├── logout.php
        ├── me.php
        ├── dashboard.php
        ├── products.php
        ├── bookings.php
        ├── bookings-export.php
        ├── schedule.php
        ├── settings.php
        └── seed.php
```

---

## Langkah 3 — Environment Variables di Vercel

Di Vercel Dashboard → Project → **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://dripstoyou.com/api` |
| `SESSION_SECRET` | (string acak ≥32 char) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `6281234567890` |
| `NEXT_PUBLIC_APP_URL` | `https://dripstoyou.com` |

Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Langkah 4 — Deploy Next.js ke Vercel

1. Push code ke GitHub (pastikan `php-api/config.php` di-ignore)
2. Import repo di Vercel
3. Set environment variables (Langkah 3)
4. Deploy — build command otomatis: `next build`

---

## Langkah 5 — Seed Database (Satu Kali)

Setelah PHP API online dan database sudah diimport, jalankan seeding:

```
GET https://dripstoyou.com/api/admin/seed.php?secret=SEED_SECRET_DARI_CONFIG
```

Seed membuat:
- Jadwal 7 hari (08:00–22:00)
- Pengaturan dasar situs
- Super Admin dari `INITIAL_ADMIN_EMAIL` dan `INITIAL_ADMIN_PASSWORD`

Produk, area layanan, FAQ, dan konten publik lain sengaja tidak diisi otomatis. Kelola semuanya dari admin panel agar website hanya menampilkan data yang benar-benar Anda atur.

---

## Langkah 6 — Test Manual Endpoint

### Public (buka di browser):
```
https://dripstoyou.com/api/products.php
https://dripstoyou.com/api/areas.php
https://dripstoyou.com/api/settings.php
https://dripstoyou.com/api/availability.php?date=2025-08-01
```

### Admin (gunakan Postman/Insomnia):
```
POST https://dripstoyou.com/api/admin/login.php
Body: { "email": "EMAIL_DARI_INITIAL_ADMIN_EMAIL", "password": "PASSWORD_DARI_INITIAL_ADMIN_PASSWORD" }
→ Response: { "success": true, "data": { "token": "...", "admin": {...} } }

GET https://dripstoyou.com/api/admin/dashboard.php
Headers: Authorization: Bearer <token dari login>
```

---

## Troubleshooting

### ❌ CORS Error di browser
Tambahkan domain frontend ke `ALLOWED_ORIGINS` di `config.php`, lalu re-upload.

### ❌ 500 Internal Server Error
Cek **cPanel → Error Logs**. Penyebab umum:
- `config.php` belum dibuat
- Credential database salah
- PHP extension `openssl` tidak aktif

### ❌ Database Connection Failed
- Pastikan `DB_HOST=localhost` (bukan IP external) di cPanel
- Pastikan user MySQL sudah diberi privilege ke database

### ❌ NEXT_PUBLIC_API_BASE_URL Error
- Tidak ada trailing slash: `https://dripstoyou.com/api` ✓
- Verifikasi: buka URL tersebut di browser → harus kembalikan JSON

### ❌ Data terenkripsi tidak terbaca
`FIELD_ENCRYPTION_KEY` di `config.php` harus identik dengan yang dulu di `.env`:
```
bd749e1585fe8f5e2644ad5c6bd35e6097f64af27c3bf906a4e898b6d139719a
```

### ❌ Admin login selalu gagal
- Pastikan seed sudah dijalankan
- Cek rate limit: max 5 percobaan gagal per 15 menit per IP/email

---

## API Endpoints Reference

### Public (No Auth)

| Method | Path | Keterangan |
|--------|------|-----------|
| GET | `/products.php` | Semua produk aktif |
| GET | `/products.php?slug=xxx` | Satu produk by slug |
| GET | `/products.php?include_benefits=1&include_faqs=1` | Dengan relasi |
| GET | `/areas.php` | Service areas aktif |
| GET | `/settings.php` | WhatsApp, jam, response time |
| GET | `/availability.php?date=YYYY-MM-DD` | Slot waktu tersedia |
| POST | `/bookings.php` | Buat booking baru |

### Admin (Bearer Token Required)

| Method | Path | Keterangan |
|--------|------|-----------|
| POST | `/admin/login.php` | Login → dapat token |
| POST | `/admin/logout.php` | Revoke token |
| GET | `/admin/me.php` | Info admin saat ini |
| GET | `/admin/dashboard.php` | Statistik dashboard |
| GET | `/admin/products.php` | List semua produk |
| POST | `/admin/products.php` | Buat produk baru |
| GET | `/admin/products.php?id=xxx` | Detail produk |
| PATCH | `/admin/products.php?id=xxx` | Update produk |
| DELETE | `/admin/products.php?id=xxx` | Hapus produk |
| GET | `/admin/bookings.php` | List booking |
| GET | `/admin/bookings.php?id=xxx` | Detail booking (decrypted) |
| PATCH | `/admin/bookings.php?id=xxx` | Update status booking |
| GET | `/admin/bookings-export.php` | Export CSV |
| GET | `/admin/schedule.php` | Jadwal operasional |
| PUT | `/admin/schedule.php` | Update jadwal |
| GET | `/admin/settings.php` | Site settings |
| PATCH | `/admin/settings.php` | Update settings |
| GET | `/admin/seed.php?secret=xxx` | Seed database (sekali saja) |

### Response Format

**Sukses:**
```json
{ "success": true, "message": "Berhasil", "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Pesan error" }
```

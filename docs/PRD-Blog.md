# PRD — Fitur Blog

**Produk:** Drips To You - Bali (dripstoyou.com) — Mobile IV Therapy
**Status dokumen:** Draft v1 untuk review tim dev/PM
**Tanggal:** 2026-07-24
**Owner:** —
**Terkait:** `docs/PRD-bugfix-sprint.md`, `docs/CRM-SETUP.md`

> Catatan stack (koreksi CLAUDE.md): frontend **Next.js (App Router, React 19, Tailwind 4, TS)** di **Vercel**; backend **PHP murni + MySQL 8 via PDO prepared statements** di **Rumahweb** (folder `php-api/`). **Tidak ada Prisma.** Next.js API routes (`src/app/api/**`) hanya **proxy tipis** ke PHP lewat `src/lib/php-fetch.ts`, meneruskan session cookie sebagai **Bearer token**. Blog mengikuti pola fitur konten **"products"** yang sudah ada, dan **TIDAK** masuk `/crm`.

---

## 1. Ringkasan & Latar Belakang

### 1.1 Masalah
Website dripstoyou.com saat ini tidak punya kanal konten/edukasi. Semua halaman bersifat transaksional (treatments, booking, FAQ, legal). Akibatnya:

- **Tidak ada surface untuk long-tail keyword** ("manfaat infus vitamin C untuk fatigue", "IV drip untuk hangover Bali", "myers cocktail adalah") yang jadi pintu masuk calon pasien di tahap awareness.
- **Tidak ada aset edukasi** untuk menjawab keraguan medis calon pasien sebelum mereka siap booking (keamanan, indikasi, apa yang terjadi saat kunjungan nurse).
- **Otoritas topikal (topical authority)** untuk domain kesehatan/wellness lemah karena konten tipis; sulit bersaing di SERP untuk keyword non-brand.

### 1.2 Tujuan Bisnis
1. **Organic traffic** — menaikkan trafik non-brand dari Google lewat konten edukasi yang terindeks.
2. **Edukasi calon pasien** — menurunkan friksi konversi dengan menjawab pertanyaan medis/prosedural lebih dulu.
3. **Dukung konversi ke booking** — setiap artikel adalah funnel: internal linking + CTA terarah ke `/booking` dan `/treatments`.

### 1.3 Prinsip Desain
- **Ikuti pola `products` persis** (file, struktur endpoint, proxy, admin UI). Jangan ciptakan arsitektur baru.
- **SEO-first, server-rendered** — konten utama harus terbaca crawler tanpa JS.
- **Extend, jangan duplikasi** infrastruktur SEO yang sudah ada (`src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`).
- **Single-language untuk v1** (lihat §11 Open Questions) — i18n/hreflang **DITUNDA**, tidak masuk PRD ini.

---

## 2. Goals & Success Metrics

| Metrik | Baseline | Target (90 hari pasca-launch) | Cara ukur |
|---|---|---|---|
| Halaman blog terindeks Google | 0 | ≥ 20 URL artikel + halaman listing/kategori | GSC → Coverage / Pages |
| Organic traffic ke `/blog/**` | 0 | ≥ 500 sesi organik/bulan di bulan ke-3 | GA4 / GSC (segment path `/blog`) |
| Keyword non-brand di posisi ≤ 20 | 0 | ≥ 10 keyword target | GSC → Performance / rank tracker |
| CTR artikel → `/booking` atau `/treatments` | — | ≥ 3% klik CTA per artikel view | Event GA4 `blog_cta_click` |
| Lighthouse **SEO** (halaman artikel) | — | **≥ 95** | Lighthouse CI / PSI |
| **LCP** (mobile, artikel) | — | **≤ 2.5 s** (p75) | GSC Core Web Vitals / CrUX |
| **CLS** (artikel) | — | **≤ 0.1** (p75) | CWV |
| **INP** (artikel) | — | **≤ 200 ms** (p75) | CWV |
| Waktu artikel published → muncul di `sitemap.xml` | — | **≤ 1 jam** (window ISR/revalidate) | Fetch `sitemap.xml` |

> Semua metrik konten (traffic, keyword) bergantung pada volume & kualitas artikel yang diproduksi tim konten — di luar kendali engineering. Metrik teknis (Lighthouse, CWV, indexability, sitemap lag) adalah tanggung jawab langsung fitur ini.

---

## 3. Scope

### 3.1 In-scope (v1)
- Tabel `blog_posts` + `blog_categories` (MySQL).
- Endpoint PHP publik (`blog.php`, `blog-categories.php`) & admin (`admin/blog.php`, `admin/blog-categories.php`) mengikuti pola `products.php`.
- Proxy Next.js untuk admin (`src/app/api/admin/blog/**`, `.../blog-categories/**`).
- Halaman publik: `/blog` (listing + pagination), `/blog/[slug]` (detail).
- Halaman kategori `/blog/kategori/[slug]`.
- Admin UI: `/admin/blog` (list), `/admin/blog/new`, `/admin/blog/[id]/edit` (mirror `admin/products`).
- Status lifecycle: **draft → published → archived**, plus **scheduled** (via gate `published_at`).
- SEO lengkap (§8): meta, canonical, OG/Twitter, JSON-LD `BlogPosting` + `BreadcrumbList`, sitemap dinamis, noindex draft, heading hierarchy, alt text wajib, ISR, pagination crawlable.
- Cover image via `php-api/admin/upload.php` (reuse, folder `blog`), kompresi/serve WebP lewat `next/image`.
- Internal linking: CTA ke `/booking` & `/treatments`, related posts by kategori.
- Keamanan: RBAC, audit log, sanitasi input; rate limit **hanya** untuk endpoint publik yang menerima input (relevan hanya jika komentar diaktifkan — lihat out-of-scope).

### 3.2 Out-of-scope (v1) / Future
| Item | Status | Alasan |
|---|---|---|
| **Komentar publik** | Future (v2) | Butuh moderasi, anti-spam, rate limit, PII. Tunda sampai ada kebutuhan. |
| **RSS/Atom feed** | Future (nice-to-have) | Mudah ditambah dari data published; bukan prioritas v1. |
| **Tags (many-to-many)** | Future | v1 cukup kategori tunggal per artikel. |
| **Full-text search di blog** | Future | v1 mengandalkan navigasi kategori + Google. |
| **Scheduled publish via cron** | Diganti pendekatan gate | Shared hosting Rumahweb tidak ideal untuk cron; dipenuhi lewat `status=scheduled` + `published_at <= NOW()` + ISR (§7.3). |
| **Multi-bahasa / hreflang** | **DITUNDA** (kebijakan proyek) | Keputusan i18n ditunda; jangan pasang hreflang tanpa URL per bahasa. |
| **Author sebagai entitas/profil** | Future | v1: nama author sebagai string (default brand). |
| **View counter / popularitas** | Optional v1 | Kolom `view_count` disiapkan tapi increment-nya opsional. |

---

## 4. User Roles & Permissions

Blog memakai permission generik **konten** yang sudah ada di `src/lib/auth.ts` (`content:read` / `content:write`) — **bukan** membuat modul RBAC baru. Ini identik dengan cara `products` memakai `products:write` untuk write.

| Aksi | SUPER_ADMIN | CONTENT_ADMIN | ADMIN_OPERASIONAL |
|---|:--:|:--:|:--:|
| Lihat daftar/detail artikel (admin) | ✅ | ✅ | ❌ |
| Create artikel (draft) | ✅ | ✅ | ❌ |
| Edit artikel | ✅ | ✅ | ❌ |
| **Publish / unpublish / archive** | ✅ | ✅ | ❌ |
| Delete artikel | ✅ | ✅ | ❌ |
| Kelola kategori blog | ✅ | ✅ | ❌ |
| Upload cover image | ✅ | ✅ | ❌ |

**Mapping ke permission:**
- **Read (admin):** `content:read` → SUPER_ADMIN (`*`) + CONTENT_ADMIN.
- **Write/publish/delete:** `content:write` → SUPER_ADMIN (`*`) + CONTENT_ADMIN.
- **ADMIN_OPERASIONAL** tidak punya `content:*` sama sekali (lihat `ROLE_PERMISSIONS` di `src/lib/auth.ts`), jadi seluruh admin blog tertutup untuknya. Ini **lebih ketat** dari products (yang memberi `products:read` ke ADMIN_OPERASIONAL) — dan itu benar: operasional tidak perlu menyentuh konten.

**Penegakan (dua lapis, ikuti pola products):**
1. **Proxy Next.js** — `getSession()` → cek `session.adminId` (401) → `can(session.role, 'content:write')` (403) sebelum forward. (Lihat `src/app/api/admin/products/route.ts`.)
2. **PHP** — `requireAuth()` lalu `requireRole($admin, 'SUPER_ADMIN', 'CONTENT_ADMIN')` untuk semua method non-GET. (Lihat `php-api/admin/products.php:15-17`.)

> Publik (pembaca) tidak butuh auth; endpoint publik `blog.php` hanya mengembalikan artikel **published**.

---

## 5. Data Model

Konvensi mengikuti tabel `products`: PK `CHAR(36)` (UUID via `generateId()`), timestamp `DATETIME` string `Y-m-d H:i:s`, slug `VARCHAR` unik dengan regex `^[a-z0-9-]+$`.

### 5.1 Tabel `blog_categories`

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|:--:|---|---|
| `id` | CHAR(36) | ❌ | — | PK |
| `name` | VARCHAR(120) | ❌ | — | Nama kategori (mis. "Edukasi IV Therapy") |
| `slug` | VARCHAR(160) | ❌ | — | **UNIQUE**, `^[a-z0-9-]+$` |
| `description` | VARCHAR(500) | ✅ | NULL | Ringkasan untuk halaman kategori |
| `meta_title` | VARCHAR(70) | ✅ | NULL | Override SEO halaman kategori |
| `meta_description` | VARCHAR(200) | ✅ | NULL | Override SEO halaman kategori |
| `sort_order` | INT | ❌ | 0 | Urutan tampil |
| `is_active` | TINYINT(1) | ❌ | 1 | Nonaktif = disembunyikan dari publik |
| `created_at` | DATETIME | ❌ | — | |
| `updated_at` | DATETIME | ❌ | — | |

**Index:** `UNIQUE(slug)`, `INDEX(is_active, sort_order)`.

### 5.2 Tabel `blog_posts`

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|:--:|---|---|
| `id` | CHAR(36) | ❌ | — | PK |
| `category_id` | CHAR(36) | ✅ | NULL | FK → `blog_categories.id`, `ON DELETE SET NULL` |
| `title` | VARCHAR(200) | ❌ | — | Judul artikel = **H1** halaman |
| `slug` | VARCHAR(200) | ❌ | — | **UNIQUE**, `^[a-z0-9-]+$`, **permanen** setelah publish (§8.1) |
| `excerpt` | VARCHAR(500) | ✅ | NULL | Ringkasan; fallback untuk meta description & kartu listing |
| `content` | MEDIUMTEXT | ❌ | — | Body artikel (format final: HTML tersanitasi — lihat §10.1) |
| `content_source` | MEDIUMTEXT | ✅ | NULL | Sumber mentah bila format Markdown dipilih (§10.1) |
| `cover_image_url` | VARCHAR(500) | ✅ | NULL | Absolut, hasil `upload.php`; render lewat `toDirectImageUrl()` |
| `cover_image_alt` | VARCHAR(255) | ✅ | NULL | **Wajib diisi bila `cover_image_url` ada** (enforce app-level, §8.9) |
| `meta_title` | VARCHAR(70) | ✅ | NULL | Override; kosong → template default (§8.2) |
| `meta_description` | VARCHAR(200) | ✅ | NULL | Override; kosong → dari `excerpt` (§8.2) |
| `canonical_url` | VARCHAR(500) | ✅ | NULL | Opsional; kosong → self-canonical ke URL artikel |
| `og_image_url` | VARCHAR(500) | ✅ | NULL | Opsional; kosong → `cover_image_url` → `DEFAULT_OG_IMAGE` |
| `author_name` | VARCHAR(120) | ✅ | NULL | Kosong → `SITE_NAME` ("Drips To You - Bali") |
| `author_admin_id` | CHAR(36) | ✅ | NULL | Jejak penulis internal (tidak ditampilkan publik di v1) |
| `status` | ENUM('draft','scheduled','published','archived') | ❌ | 'draft' | Lifecycle (§7.3) |
| `published_at` | DATETIME | ✅ | NULL | Diisi saat publish; untuk `scheduled` = waktu tayang mendatang |
| `reading_minutes` | INT | ✅ | NULL | Estimasi baca (dihitung dari `content` saat simpan) |
| `view_count` | INT | ❌ | 0 | Opsional (increment di v1 bersifat opsional) |
| `created_at` | DATETIME | ❌ | — | |
| `updated_at` | DATETIME | ❌ | — | **`lastmod` sitemap & `article:modified_time`** |

**Index:**
- `UNIQUE(slug)`
- `INDEX(status, published_at)` — query publik `WHERE status='published' AND published_at <= NOW() ORDER BY published_at DESC` + pagination.
- `INDEX(category_id)` — listing kategori & related posts.
- (Opsional future) `FULLTEXT(title, excerpt, content)` untuk search internal.

**Aturan integritas kunci untuk SEO:**
- Publik **hanya** melihat baris dengan `status='published' AND published_at <= NOW()`. Baris `draft`/`scheduled`/`archived` **tidak pernah** keluar dari endpoint publik → otomatis tidak masuk sitemap & tidak bisa diakses via URL (404).
- `slug` unik dan tidak berubah setelah publish (§8.1).

---

## 6. API Design

### 6.1 Endpoint PHP — Publik
Pola persis `php-api/products.php`: `handleCors()` → `requireMethod('GET')` → `getDb()` → prepared statement → `formatPost()` → `jsonSuccess()`. **Selalu** filter `status='published' AND published_at <= NOW()`.

| Method | Path | Query | Auth | Response (`data`) |
|---|---|---|:--:|---|
| GET | `/api/blog.php` | `page`, `per_page`, `category` (slug), `include_content=0` | — | `{ items: Post[], pagination: {page, perPage, total, totalPages} }` |
| GET | `/api/blog.php?slug=xyz` | `include_related=1` | — | `Post` (full `content`) + `related: PostCard[]` opsional |
| GET | `/api/blog-categories.php` | — | — | `Category[]` (hanya `is_active=1`) |

**Bentuk `Post` (listing card):**
```json
{
  "id": "…", "title": "…", "slug": "…", "excerpt": "…",
  "cover_image_url": "https://dripstoyou.com/php-api/uploads/blog/…webp",
  "cover_image_alt": "…", "reading_minutes": 4,
  "published_at": "2026-07-20 09:00:00", "updated_at": "2026-07-21 10:00:00",
  "category": { "name": "…", "slug": "…" }
}
```
Detail menambah: `content`, `meta_title`, `meta_description`, `canonical_url`, `og_image_url`, `author_name`.

**Catatan pagination di query:** untuk `LIMIT/OFFSET` gunakan **bind integer tervalidasi** (cast `(int)`, clamp `per_page` mis. 1–24), **bukan** interpolasi string — konsisten aturan "no raw SQL concat".

### 6.2 Endpoint PHP — Admin
Pola persis `php-api/admin/products.php`: `requireAuth()` → `requireRole()` untuk non-GET → `getBodyJson()` / `requireFields()` → `str_clean()` → cek slug regex + unik → `generateId()` → `auditLog(...)`.

| Method | Path | Query | Auth (PHP) | Aksi |
|---|---|---|---|---|
| GET | `/api/admin/blog.php` | `status`, `category`, `q`, `page` | `requireAuth` | List semua status (+ filter) |
| GET | `/api/admin/blog.php?id=xxx` | — | `requireAuth` | Detail 1 artikel |
| POST | `/api/admin/blog.php` | — | `requireRole(SUPER_ADMIN, CONTENT_ADMIN)` | Create (default `draft`) |
| PATCH | `/api/admin/blog.php?id=xxx` | — | `requireRole(...)` | Update field (termasuk `status`) |
| DELETE | `/api/admin/blog.php?id=xxx` | — | `requireRole(...)` | Hapus artikel |
| GET/POST/PATCH/DELETE | `/api/admin/blog-categories.php` | `?id=` | `requireRole(...)` non-GET | CRUD kategori (pola sama) |
| POST | `/api/admin/upload.php` | `type=blog` | `requireRole(...)` | **Reuse** upload; simpan ke `uploads/blog/`, return `publicUrl` |

**Transisi status & audit (di PHP):**
- `POST` → `auditLog('CREATE_BLOG_POST', $admin['admin_id'], 'BlogPost', $id, ['title'=>$title])`.
- `PATCH` biasa → `auditLog('UPDATE_BLOG_POST', ...)`.
- `PATCH` yang mengubah `status` **menjadi** `published` (dari non-published) → set `published_at = NOW()` bila belum ada, lalu `auditLog('PUBLISH_BLOG_POST', ...)`.
- `PATCH` `published → draft/archived` → `auditLog('UNPUBLISH_BLOG_POST', ...)`.
- `DELETE` → `auditLog('DELETE_BLOG_POST', ..., ['title'=>...])`.

**Publish sebagai field, bukan endpoint terpisah** (ikut pola products `is_active`). Frontend cukup `PATCH { status: 'published' }`; PHP yang menentukan `published_at` & event audit.

**Upload — perubahan minimal pada `upload.php`:** tambah baca `$_GET['type']` / field `type` (`products`|`blog`), tentukan subfolder `uploads/{type}` dan `publicUrl` sesuai; default tetap `products` (backward-compatible). Validasi magic-byte (JPG/PNG/WEBP, ≤5MB) & audit tetap.

### 6.3 Route Proxy Next.js (yang perlu dibuat)
Public blog **tidak** butuh proxy — Server Component fetch PHP langsung (`${NEXT_PUBLIC_API_BASE_URL}/blog.php`), persis seperti `treatments/[slug]/page.tsx` fetch `products.php`. Proxy hanya untuk **admin client (browser)**.

| Route baru | Meneruskan ke | Method |
|---|---|---|
| `src/app/api/admin/blog/route.ts` | `admin/blog.php` | GET (list), POST (create) |
| `src/app/api/admin/blog/[id]/route.ts` | `admin/blog.php?id=…` | GET, PATCH, DELETE |
| `src/app/api/admin/blog-categories/route.ts` | `admin/blog-categories.php` | GET, POST |
| `src/app/api/admin/blog-categories/[id]/route.ts` | `admin/blog-categories.php?id=…` | GET, PATCH, DELETE |
| (reuse) `src/app/api/admin/uploads/route.ts` | `admin/upload.php` | POST (+ param `type=blog`) |

**Setiap proxy WAJIB:**
1. `export const dynamic = 'force-dynamic';`
2. `getSession()` → 401 bila `!session.adminId`.
3. Untuk write: `can(session.role, 'content:write')` → 403.
4. **Teruskan query string secara eksplisit** (`req.nextUrl.searchParams.toString()`), termasuk `id`. — *Gotcha proyek:* proxy CRM pernah gagal 400 diam-diam karena query param tidak diteruskan; jangan ulangi.
5. Header `Authorization: Bearer ${session.adminToken ?? ''}`.
6. **Validasi Zod** body sebelum forward (§10.2).

---

## 7. Halaman & UX Flow

### 7.1 Halaman Publik
| Route | Render | Isi |
|---|---|---|
| `/blog` | Server Component, `revalidate` | Grid kartu artikel published (cover, judul, excerpt, kategori, tanggal), **pagination crawlable** `?page=n`, filter kategori (link, bukan JS-only) |
| `/blog/[slug]` | Server Component, `revalidate` | H1 judul, meta, breadcrumb, cover (`next/image`), body, box author/tanggal, **CTA booking/treatments**, related posts by kategori |
| `/blog/kategori/[slug]` | Server Component, `revalidate` | Listing artikel published dalam 1 kategori + meta title/description kategori sendiri (§8.11) |

Komponen mirror pola treatments: `Header`, `SiteFooter`, `ScrollRevealInit`, `<JsonLd data={...} />`, `loading.tsx` untuk skeleton.

### 7.2 Halaman Admin (mirror `admin/products`)
| Route | Komponen | Fungsi |
|---|---|---|
| `/admin/blog` | `page.tsx` + `BlogListClient.tsx` | Tabel artikel: judul, status badge, kategori, tanggal, aksi (edit/hapus/publish toggle), filter status |
| `/admin/blog/new` | `new/page.tsx` + `BlogForm.tsx` | Editor buat baru (draft) |
| `/admin/blog/[id]/edit` | `[id]/edit/page.tsx` + `BlogForm.tsx` | Editor edit + tombol Publish/Unpublish/Archive |

**Editor (`BlogForm.tsx`) memuat:** judul, slug (auto-generate dari judul, editable saat draft), kategori, excerpt, body (editor konten — §10.1), upload cover + **field alt text wajib**, panel SEO (meta_title/description dengan **penghitung karakter live** 60/160, canonical opsional, og image opsional), status/publish, preview.

### 7.3 Flow Status
```
        create
   ┌───────────────► draft ──publish──► published ──archive──► archived
   │                   ▲  │                 │  ▲                    │
   │        unpublish  │  │  set published_at (future)             │
   │                   │  ▼                 ▼  │  unarchive/republish
   └───────────  scheduled  ───(published_at <= NOW)──► (tampil publik otomatis)
```
- **draft** — noindex, tidak dapat diakses publik (URL → 404), tidak di sitemap.
- **scheduled** — sama seperti draft dari sisi publik **sampai** `published_at <= NOW()`. Karena endpoint publik memfilter `published_at <= NOW()` dan halaman ISR revalidate, artikel "muncul sendiri" saat waktunya tiba tanpa cron. Lag maksimum = window `revalidate`.
- **published** — indexable, di sitemap, dapat diakses.
- **archived** — ditarik dari publik (404 + hilang dari sitemap). URL bisa 301 ke `/blog` atau kategori (future) untuk menjaga link equity; v1 minimal 404/410.

---

## 8. Requirement SEO (WAJIB, paling detail)

### 8.1 Struktur URL / Slug
- Format `/blog/[slug]`; slug **lowercase**, kata dipisah `-`, regex `^[a-z0-9-]+$` (validasi PHP identik `products`).
- **Pendek & kaya kata kunci**, buang stopword berlebih (mis. `manfaat-iv-drip-hangover` bukan `apa-saja-sih-manfaat-dari-iv-drip-untuk-hangover-anda`).
- **Permanen setelah publish.** UI: slug editable saat `draft`; **dikunci** begitu artikel pernah `published`. Perubahan slug pasca-publish memerlukan penanganan redirect 301 (future) — v1 tidak mengizinkan ganti slug untuk mencegah link rot & kanibalisasi.
- Tidak menaruh tanggal/ID di slug (agar stabil & bersih).

### 8.2 Meta Title & Meta Description
- **Meta title** — override `meta_title`; kosong → template default: `"{title} | Drips To You - Bali"`. Hard limit **≤ 60 karакter** (penghitung + peringatan di editor; PHP `str_clean(..., 70)` sebagai batas simpan, target render ≤60).
- **Meta description** — override `meta_description`; kosong → dari `excerpt`; kosong juga → potongan aman dari `content` (strip tag). Target **140–160**, hard limit **≤ 160** (ikuti logika `metaDescription()` di `treatments/[slug]/page.tsx`: ≤160 & ≥80 dipakai apa adanya, >160 dipotong `…`).
- Di-set via `generateMetadata()` App Router (`title.absolute`, `description`).

### 8.3 Canonical URL
- **Setiap** halaman artikel & listing punya canonical eksplisit (`alternates.canonical`).
- Artikel: `canonical_url` bila diisi manual; default **self-canonical** `${SITE_URL}/blog/${slug}`.
- **Strategi pagination canonical:**
  - `/blog` (halaman 1) → canonical `${SITE_URL}/blog`.
  - `/blog?page=n` (n≥2) → **self-canonical** ke `${SITE_URL}/blog?page=n` (BUKAN dikanonikalkan ke halaman 1 — agar artikel di halaman dalam tetap ter-crawl & terindeks). Judul halaman diberi sufiks `"— Halaman n"` agar tidak duplikat.
  - Kategori paginasi mengikuti pola sama pada `/blog/kategori/[slug]?page=n`.
- `rel=prev/next` sudah tidak dipakai Google; cukup **link `<a>` crawlable** antar halaman + self-canonical (§8.12).

### 8.4 Open Graph + Twitter Card
Via `generateMetadata()` (pola treatments):
- `og:title`, `og:description`, `og:url`, **`og:type=article`** (treatments pakai `website`; artikel harus `article`).
- `og:image` = `og_image_url` → `cover_image_url` → `DEFAULT_OG_IMAGE`; **wajib pakai `toPublicImageUrl()`** (URL https publik, bukan host backend). Sertakan `width:1200,height:630,alt`.
- `article:published_time` = `published_at`, `article:modified_time` = `updated_at` (OpenGraph `type:'article'` → field `publishedTime`/`modifiedTime`/`authors`).
- Twitter: `card: 'summary_large_image'`, `title`, `description`, `images`.

### 8.5 Structured Data JSON-LD
Tambah builder baru **`blogPostingJsonLd()` di `src/lib/seo.ts`** (jangan bikin file SEO baru; builder harus di sini agar bisa akses konstanta internal `ORG_ID = ${SITE_URL}/#organization`).

`BlogPosting` (subtipe `Article`) per artikel:
```jsonc
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{title}",                         // ≤110 char
  "image": ["{og/cover image, https}"],
  "datePublished": "{published_at ISO}",
  "dateModified": "{updated_at ISO}",
  "author": { "@type": "Organization", "name": "Drips To You - Bali", "url": "{SITE_URL}" },
  "publisher": { "@id": "{SITE_URL}/#organization" },   // referensi org yg sudah ada
  "mainEntityOfPage": { "@type": "WebPage", "@id": "{SITE_URL}/blog/{slug}" },
  "description": "{meta description}"
}
```
- **`publisher`** memakai `@id` ke Organization yang sudah didefinisikan `organizationJsonLd()` (agar graf konsisten). Pastikan `organizationJsonLd` ter-render di layout root (sudah ada global) sehingga node `#organization` tersedia.
- `author` v1 = Organization brand (string). Bila kelak ada profil penulis → `Person`.
- **BreadcrumbList** di setiap halaman artikel & kategori — **reuse `breadcrumbJsonLd()`** yang sudah ada:
  - Artikel: `Home → Blog → {Kategori} → {Judul}`.
  - Kategori: `Home → Blog → {Kategori}`.
- Render pakai komponen `<JsonLd data={...} />` yang sudah ada.

### 8.6 Sitemap
Extend `src/app/sitemap.ts` (pola `fetchTreatmentSlugs`):
- Tambah `fetchBlogSlugs()` → fetch `${NEXT_PUBLIC_API_BASE_URL}/blog.php` (endpoint publik = **hanya published**), `next: { revalidate: 3600 }`.
- Map ke `${BASE_URL}/blog/${slug}` dengan `lastModified = toIsoDate(updated_at, now)`, `changeFrequency: 'weekly'`, `priority: 0.7`.
- Tambah entri statik `${BASE_URL}/blog` (priority 0.8) dan tiap `/blog/kategori/{slug}` (priority 0.6, dari `blog-categories.php`).
- **draft/scheduled/archived tidak pernah masuk** — otomatis, karena `blog.php` tidak mengembalikannya. (Tidak boleh menambang tabel mentah.)
- Pastikan pagination URL (`?page=n`) **tidak** dimasukkan ke sitemap (hanya URL kanonik artikel & halaman 1 listing/kategori).

### 8.7 Draft = noindex & tidak dapat diakses
- **Akses publik:** halaman `/blog/[slug]` fetch `blog.php?slug=` yang hanya balas published → jika null → `notFound()` (404). Draft/scheduled/archived **tidak** dapat dibuka via URL langsung.
- **Preview draft (admin):** route preview terautentikasi terpisah (mis. `/admin/blog/[id]/preview`) yang fetch via proxy admin (butuh session), **selalu `robots: { index: false, follow: false }`** dan `X-Robots-Tag: noindex`. Tidak memakai path `/blog/*` publik.
- Semua halaman non-public (admin) sudah di-disallow di `robots.ts` (`/admin/`).

### 8.8 Heading Hierarchy Semantik
- **Tepat satu `<h1>`** per halaman artikel = judul artikel (di-render oleh template, **bukan** dari body).
- Editor konten **tidak boleh** mengizinkan penulis menyisipkan H1 di body. Toolbar hanya menawarkan **H2 & H3** (dan konten pendukung). Bila format Markdown: `#` (H1) dinonaktifkan/di-normalisasi menjadi H2 saat render, atau linter editor menolaknya.
- Halaman listing/kategori: H1 = judul halaman ("Blog", "{Nama Kategori}").

### 8.9 Gambar
- **Alt text WAJIB** untuk cover: form memblok simpan/publish bila `cover_image_url` ada tapi `cover_image_alt` kosong (validasi Zod di proxy + cek PHP). Gambar dalam body juga wajib alt (editor enforce).
- Render dengan **`next/image`** (ukuran responsif, `sizes`, `priority` hanya untuk cover LCP), sumber lewat **`toDirectImageUrl()`** agar optimizer Vercel tidak self-loop 403 (gotcha terdokumentasi). `og:image`/JSON-LD lewat **`toPublicImageUrl()`**.
- **Kompresi via `sharp`** (sudah di dependencies) di titik upload/optimasi; **prioritaskan WebP** (upload.php sudah menerima & mendeteksi WebP via magic byte). Serve `format: webp/avif` melalui next/image.

### 8.10 Internal Linking
- **CTA wajib** di setiap artikel: minimal 1 blok CTA ke `/booking` dan/atau link kontekstual ke `/treatments` (atau treatment spesifik). Track klik via event GA4 `blog_cta_click`.
- **Related posts** (3–4) berdasarkan `category_id` yang sama (fallback: artikel terbaru bila kategori kosong), sebagai link `<a>` crawlable.
- Body mendukung link internal ke treatment/artikel lain.

### 8.11 Halaman Kategori
- Punya **meta title & description sendiri** (`blog_categories.meta_title`/`meta_description`); kosong → template `"{Nama Kategori} — Blog | Drips To You - Bali"` + deskripsi dari `description`. **Tidak boleh duplikat** dari `/blog`.
- Self-canonical `${SITE_URL}/blog/kategori/{slug}`.
- H1 = nama kategori; breadcrumb `Home → Blog → {Kategori}`.

### 8.12 Pagination Crawlable
- Pagination memakai **link `<a href="/blog?page=n">`** yang ter-render server-side (bukan infinite scroll murni / tombol JS tanpa href).
- Boleh ada infinite scroll progresif **sebagai enhancement**, tapi **harus** ada fallback link "Halaman berikutnya"/nomor halaman di HTML.
- Tiap halaman paginasi: self-canonical + title bersufiks (§8.3), tetap ISR.

### 8.13 Performance / Rendering
- Konten utama **Server-Rendered** (Server Components) — crawler baca tanpa JS. Tidak ada client-side fetch untuk body artikel.
- **ISR** via `export const revalidate = <n>` mengikuti pola treatments (`revalidate = 60`) / halaman legal. Rekomendasi: listing & detail `revalidate = 60` (bisa dinaikkan ke 300 bila trafik tinggi). Ini juga menentukan **lag publish→tayang & →sitemap** (target ≤1 jam terpenuhi jauh di bawahnya).
- (Opsional) On-demand revalidation saat publish (`revalidatePath('/blog')` + path artikel) untuk tayang instan — future enhancement.
- LCP: cover pakai `next/image priority` + dimensi eksplisit (hindari CLS). Font sudah dioptimasi global (Playfair/DM Sans).

### 8.14 robots.txt
- Cek `src/app/robots.ts`: `/blog` **TIDAK** boleh masuk `disallow`. Saat ini rule `allow: '/'` + disallow `['/admin/','/api/','/crm/','/php-api/','/login','/consent/','/cek-booking']` → `/blog` **sudah diizinkan**, **tidak perlu perubahan**. Admin blog aman karena di bawah `/admin/`.
- `sitemap.xml` sudah dirujuk di robots; artikel akan otomatis masuk setelah §8.6.

---

## 9. Non-Functional Requirements

### 9.1 Keamanan (patuh CLAUDE.md)
- **RBAC dua lapis** (proxy Next `content:write` + PHP `requireRole`) untuk semua mutation.
- **Validasi input:** **Zod** di layer Next.js proxy (§10.2) + sanitasi PHP (`str_clean`, `requireFields`, cast tipe, clamp pagination). PDO prepared statements — **tidak ada** raw SQL concat (termasuk `LIMIT/OFFSET` di-bind sebagai int).
- **Sanitasi konten HTML** (anti-XSS) wajib — konten artikel di-render sebagai HTML; sanitasi di titik simpan dan/atau render (§10.1).
- **Audit log** untuk create/update/delete/publish/unpublish (§6.2) via `auditLog()`.
- **Rate limit:** hanya relevan untuk endpoint publik yang **menerima input** — di v1 **tidak ada** (komentar out-of-scope). Bila komentar diaktifkan (v2), terapkan pola rate limit proyek. Endpoint baca publik (`blog.php`) idempotent/read-only, cukup cache/ISR.
- **Tidak commit** secret; upload validasi magic-byte + batas ukuran (sudah ada di `upload.php`).

### 9.2 Accessibility
- **Alt text wajib** (§8.9); heading hierarki benar (§8.8).
- **Kontras warna** memakai token brand (`--teal #205251`, `--ocean #29808B`, `--gold #C9944C`, teks di atas `--off-white #F3F0E7`) memenuhi **WCAG AA** (≥4.5:1 body). Verifikasi kombinasi CTA gold/teks.
- Fokus keyboard terlihat, link punya teks deskriptif (bukan "klik di sini"), gambar dekoratif `alt=""`, cover informatif alt terisi.
- Bahasa halaman: atribut `lang` sesuai keputusan §11 (ID/EN).

---

## 10. Dependencies & Risks

### 10.1 Editor konten (KEPUTUSAN TERBUKA)
Belum ada library rich text di project. Opsi:

| Opsi | Kelebihan | Kekurangan / Risiko | Sanitasi |
|---|---|---|---|
| **Plain textarea + Markdown** *(rekomendasi awal)* | Ringan, tanpa dependency berat, sumber bersih di `content_source`, mudah enforce "no H1" | Butuh renderer MD→HTML + sanitizer; kurva belajar penulis non-teknis | Render server-side dgn sanitizer (mis. rehype-sanitize / DOMPurify server) |
| **WYSIWYG (mis. Tiptap/Lexical)** | UX penulis nyaman, kontrol toolbar (batasi H2/H3) | Dependency besar, bundle admin naik, kompleksitas | Sanitasi HTML output wajib |
| **Markdown + preview split** | Kompromi UX/ringan | Tetap perlu sanitizer | idem MD |

**Rekomendasi:** mulai **Markdown** (simpan `content_source` MD + `content` HTML tersanitasi hasil render), toolbar/editor membatasi heading ke H2/H3. Finalisasi di §11.
**Wajib apa pun pilihannya:** sanitasi HTML sebelum render publik (whitelist tag/atribut, blok `<script>`/handler inline).

### 10.2 CSRF & Zod server-side (TECHNICAL DEBT — tangani bersamaan)
- CLAUDE.md mensyaratkan **CSRF token** + **Zod** di semua mutation admin. **Realitanya belum konsisten** di seluruh panel: proxy products hanya cek session+RBAC (tanpa Zod & tanpa CSRF), backend PHP validasi manual (`str_clean`/`requireFields`), **bukan** Zod (Zod = TS, tidak jalan di PHP).
- **Risiko:** menambah blog dengan pola "ikut products persis" akan **mewarisi gap** ini (tak ada Zod di proxy, tak ada CSRF).
- **Rencana untuk blog:**
  1. Tambahkan **skema Zod** untuk create/update di proxy Next.js (`src/app/api/admin/blog/**`) — validasi & normalisasi sebelum forward ke PHP. Ini menutup gap Zod untuk fitur baru.
  2. Terapkan **CSRF token** pada mutation blog (double-submit cookie / header token) sesuai infrastruktur yang ada; bila belum ada helper CSRF, angkat sebagai **prasyarat/tech-debt ticket** yang dikerjakan berbarengan (jangan diam-diam skip — ini aturan non-negotiable proyek).
- **Keputusan yang perlu diambil PM/lead:** apakah blog jadi *pilot* penegakan Zod+CSRF (lalu di-backport ke products), atau ikut baseline products dulu dengan tech-debt tercatat. Rekomendasi: **jadikan blog pilot** karena fitur baru & bersih.

### 10.3 Risiko lain
- **Kualitas & kadens konten** menentukan hasil SEO — di luar engineering; butуh komitmen tim konten.
- **Sanitasi HTML** kalau lalai → XSS di halaman publik (severity tinggi). Mitigasi §10.1.
- **Slug immutability** — bila diizinkan berubah tanpa 301 → link rot/kanibalisasi. Mitigasi §8.1.
- **Self-loop `next/image`** bila lupa `toDirectImageUrl()` → gambar 403 (gotcha terdokumentasi). Mitigasi §8.9.
- **ISR lag** — publish tidak instan (maks = `revalidate`). Dapat diterima (target ≤1 jam) atau ditutup dgn on-demand revalidate (future).

---

## 11. Open Questions
1. **Bahasa konten (v1):** ID, EN, atau keduanya? *(i18n/hreflang DITUNDA — jadi v1 harus single-language; tetapkan **satu**.)* Rekomendasi menyusul strategi keyword & audiens (mayoritas pembaca treatment saat ini berbahasa EN — konten EN memengaruhi `og:locale`/`lang`).
2. **Kebijakan komentar publik:** aktif atau tidak? (Default PRD: **tidak** di v1.) Bila ya → butuh moderasi, anti-spam, rate limit, penyimpanan PII → naik jadi epik terpisah.
3. **Penjadwalan publish:** cukup manual publish, atau butuh **scheduled** (`published_at` mendatang + gate)? PRD menyiapkan `status='scheduled'` tapi realisasi otomatisnya bergantung ISR (bukan cron) — konfirmasi ekspektasi ketepatan waktu tayang.
4. **Editor konten:** Markdown vs WYSIWYG (lihat §10.1) — perlu keputusan sebelum implementasi form.
5. **Author display:** tampilkan nama penulis di artikel (butuh entitas Person + kebijakan privasi staf) atau selalu atas nama brand? (Default v1: **brand**.)
6. **Halaman kategori:** rilis di v1 atau v1.1? (PRD default: v1, karena murah & bagus untuk struktur SEO.)

---

## 12. Acceptance Criteria

**Data & API**
- [ ] Migration membuat `blog_categories` & `blog_posts` sesuai §5 (index & unique slug ada).
- [ ] `GET /api/blog.php` hanya mengembalikan artikel `status='published' AND published_at<=NOW()`; mendukung `page`/`per_page`/`category`; pagination di-bind int (bukan concat).
- [ ] `GET /api/blog.php?slug=` mengembalikan 1 artikel published + related (opsional); slug draft/scheduled/archived → 404 dari halaman.
- [ ] CRUD admin (`admin/blog.php`) menegakkan `requireRole(SUPER_ADMIN, CONTENT_ADMIN)` untuk non-GET; slug tervalidasi regex + unik (409 bila bentrok).
- [ ] Audit log tercatat untuk CREATE/UPDATE/DELETE/PUBLISH/UNPUBLISH.
- [ ] Proxy admin menegakkan session (401) + `content:write` (403), meneruskan query `id` secara eksplisit, dan **memvalidasi body dengan Zod**.
- [ ] ADMIN_OPERASIONAL tidak bisa mengakses admin blog (403 di proxy & PHP).

**SEO (verifiable)**
- [ ] Artikel **published muncul di `sitemap.xml` ≤ 1 jam** setelah publish; draft/scheduled/archived **tidak** ada di sitemap.
- [ ] Setiap halaman artikel punya: 1× `<h1>`, canonical benar, OG `type=article` + `article:published_time`/`modified_time`, Twitter card, JSON-LD `BlogPosting` **valid** (lolos Rich Results Test) dengan `publisher` `@id` ke Organization existing, dan `BreadcrumbList`.
- [ ] Halaman `/blog?page=2` self-canonical ke dirinya, title bersufiks halaman, dan tetap ter-crawl (ada link `<a>` antar halaman; tanpa JS pun navigasi jalan).
- [ ] Halaman kategori punya meta title/description sendiri (bukan duplikat `/blog`) + self-canonical + breadcrumb.
- [ ] Draft: URL publik → 404; preview admin ber-`noindex`; tidak ada di sitemap.
- [ ] `robots.ts` tidak memblokir `/blog` (diverifikasi pada `robots.txt` produksi).
- [ ] Cover image: alt text **tidak bisa kosong** saat publish; render `next/image` via `toDirectImageUrl()`, og/JSON-LD via `toPublicImageUrl()`; format WebP.
- [ ] **Semua artikel published dapat di-crawl tanpa JS** (uji: disable JS / `curl` → body & metadata utama ada di HTML).
- [ ] **Lighthouse SEO ≥ 95** di halaman artikel & listing.
- [ ] Core Web Vitals lab (PSI mobile) memenuhi target §2 (LCP ≤2.5s, CLS ≤0.1, INP/TBT dalam batas).

**Keamanan & A11y**
- [ ] Konten HTML tersanitasi (uji payload `<script>` di body → tidak tereksekusi di publik).
- [ ] Kontras teks/CTA memenuhi WCAG AA pada token brand.
- [ ] Tidak ada raw SQL concat; semua query prepared.

**Verifikasi build (aturan CLAUDE.md saat implementasi):**
- [ ] `npm run lint && npm run typecheck` bersih.
- [ ] `npm run build` sukses (tampilkan output sebagai bukti).

---

### Lampiran A — File yang perlu dibuat/diubah (peta implementasi)

| Layer | Baru | Ubah |
|---|---|---|
| DB | migration `blog_categories`, `blog_posts` | — |
| PHP publik | `php-api/blog.php`, `php-api/blog-categories.php` | — |
| PHP admin | `php-api/admin/blog.php`, `php-api/admin/blog-categories.php` | `php-api/admin/upload.php` (param `type=blog`) |
| Proxy Next | `src/app/api/admin/blog/route.ts`, `.../blog/[id]/route.ts`, `.../blog-categories/route.ts`, `.../blog-categories/[id]/route.ts` | `src/app/api/admin/uploads/route.ts` |
| Publik UI | `src/app/blog/page.tsx` (+`loading.tsx`), `src/app/blog/[slug]/page.tsx`, `src/app/blog/kategori/[slug]/page.tsx`, komponen `BlogList`/`BlogArticle`/`RelatedPosts`/`BlogCta` | — |
| Admin UI | `src/app/admin/blog/page.tsx` + `BlogListClient.tsx`, `.../blog/new/page.tsx`, `.../blog/[id]/edit/page.tsx`, `BlogForm.tsx` | sidebar/nav admin (tambah menu Blog) |
| SEO | — | `src/lib/seo.ts` (+`blogPostingJsonLd()`), `src/app/sitemap.ts` (+blog & kategori), verifikasi `src/app/robots.ts` |
| Validasi | `src/lib/validation/blog.ts` (skema Zod) | — |

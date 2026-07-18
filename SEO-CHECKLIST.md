# SEO Checklist — dripstoyou.com

Terakhir diperbarui: 2026-07-18. Hasil audit + optimasi teknis SEO menyeluruh.

---

## A. Ringkasan Perubahan Kode (sudah dikerjakan)

### Sitemap & Robots
- `src/app/robots.ts` — disallow diperluas: `/admin/`, `/api/`, `/crm/`, `/php-api/`, `/login`, `/consent/`, `/cek-booking`. Sitemap tetap menunjuk `https://dripstoyou.com/sitemap.xml`.
- `src/app/sitemap.ts` — tambah halaman legal (priority 0.3); hapus `/cek-booking` (noindex, tak pantas di sitemap); perbaiki `lastModified` treatment yang sebelumnya selalu fallback (field API bernama `updated_at`, bukan `updatedAt`).
- `next.config.ts` — header `X-Robots-Tag: noindex, nofollow` untuk `/admin`, `/crm`, `/login`, `/consent`, `/cek-booking` (lapisan kedua di atas robots.txt).

### Metadata per Halaman
- Bug title dobel brand diperbaiki: template root `%s | Drips To You - Bali` sekarang tidak lagi ditumpuk suffix manual per halaman (sebelumnya render jadi "About Us | Drips To You - Bali Mobile IV Therapy | Drips To You - Bali").
- Semua halaman publik: title unik ±60 kar, description unik 140–160 kar + CTA, canonical absolut, OG + Twitter card lengkap dengan image 1200x630.
- Detail treatment (`generateMetadata`): title format `{Nama} — Mobile IV Therapy Bali | Drips To You` (absolute, bebas template), OG image = gambar treatment, description dari `short_description` di-trim ke 140–160.
- Halaman legal: sebelumnya `noindex` → sekarang indexable + canonical + description (agar konsisten dengan keberadaannya di sitemap).
- `/cek-booking`: layout baru dengan `noindex, follow` + canonical (halaman utilitas).

### Structured Data (JSON-LD, semua server-rendered via `src/components/seo/JsonLd.tsx`)
- Root layout: `Organization` (+logo, telephone +6282314046089, `sameAs` diambil live dari DB social-links — bukan hardcode) dan `WebSite`. Tanpa SearchAction (situs tidak punya fitur search).
- Homepage: `MedicalBusiness` + `HealthAndBeautyBusiness` — telephone live dari settings (fallback nomor resmi; placeholder `62812-0000-0000` tidak akan pernah bocor ke schema), priceRange "Rp 1.500.000 - Rp 2.000.000", openingHours dari settings (fallback `Mo-Su 08:00-22:00`), areaServed live dari DB areas (fallback: Seminyak, Canggu, Uluwatu, Nusa Dua, Ubud, Denpasar, Sanur), address Bali/ID.
- Detail treatment: `Service` (provider ref `#business`, offers IDR, areaServed) + `BreadcrumbList` (Home > Treatments > {Nama}).
- `/faq`: `FAQPage` dari data FAQ live (versi EN, sesuai bahasa default yang di-render server).
- BreadcrumbList juga di: /treatments, /about, /contact, /booking, /legal/*.
- Data palsu lama dihapus (telephone 0000, `instagram.com/dripstoyou` hardcode).

### Semantic HTML & Konten
- Setiap halaman publik: tepat satu `<h1>` (sudah benar sebelumnya, diverifikasi).
- Alt text dirapikan: hero & gallery homepage kini mengikuti bahasa aktif (ID/EN); gambar treatment pakai format `{Nama} IV Therapy Bali - Drips To You`.
- 404 custom sudah ada (link ke home + treatments) — tidak diubah.
- Link internal: home → detail treatment → booking sudah ada; footer → 4 treatment teratas + halaman info.

### Performance / Core Web Vitals
- `unoptimized` DIHAPUS dari semua gambar produk. URL gambar DB (`dripstoyou.com/php-api/...`) ditulis-ulang server-side ke host PHP langsung (`api.dripstoyou.com`) via `src/lib/images.ts` supaya optimizer next/image (WebP/AVIF + srcset) tidak kena 403 self-loop Vercel.
- Hero homepage: 2 `<Image priority>` (desktop+mobile, dua-duanya terdownload di semua device) → 1 `<picture>` art-direction (`getImageProps`, breakpoint 640px selaras CSS). Mobile kini hanya download gambar mobile.
- `preconnect` + `dns-prefetch` ke `ik.imagekit.io` di root layout.
- Font sudah `next/font` + `display: swap` (tidak diubah).
- Gambar di bawah fold: lazy by default (hanya hero yang `priority`).

### i18n / hreflang — KEPUTUSAN: DITUNDA (2026-07-18)
Toggle bahasa saat ini client-side (localStorage, URL sama) → hanya versi EN yang ter-index; hreflang TIDAK dipasang (memasangnya tanpa URL terpisah justru salah). Rencana refactor bila ingin konten ID ter-index:
1. Restrukturisasi halaman publik ke `src/app/(public)/[lang]/...` — `/` = EN (default, tanpa prefix), `/id/...` = Indonesia.
2. `LanguageProvider` dibaca dari URL param (bukan localStorage); toggle bahasa = navigasi, bukan setState.
3. `generateStaticParams` untuk `en`/`id`; metadata + JSON-LD per bahasa.
4. `alternates.languages` reciprocal (`en`, `id`, `x-default` → EN) di semua halaman; `<html lang>` per segmen.
5. Sitemap memuat kedua set URL; canonical per bahasa (bukan cross-language).
6. Middleware opsional untuk redirect preferensi tersimpan; JANGAN auto-redirect berdasarkan Accept-Language untuk Googlebot.

---

## B. Tugas Manual (tidak bisa dari kode — kerjakan sendiri)

### Prioritas 1 — minggu ini
- [ ] **Google Search Console**: verifikasi properti Domain `dripstoyou.com` (via DNS TXT di registrar/Vercel) → submit `https://dripstoyou.com/sitemap.xml` → *URL Inspection* → *Request Indexing* untuk: `/`, `/treatments`, `/booking`, dan tiap detail treatment.
- [ ] **Google Business Profile** (paling krusial untuk brand search + Maps): buat profil "Drips To You - Bali", kategori *IV therapy service* / *Medical service*, tipe **Service Area Business** (tanpa alamat publik), area layanan: Seminyak, Canggu, Uluwatu, Nusa Dua, Ubud, Denpasar, Sanur; jam 08:00–22:00 WITA; nomor +62 823-1404-6089; link ke website. Upload foto asli (tim, treatment, mobil).
- [ ] **Redirect domain**: pastikan di Vercel `www.dripstoyou.com` → 301 → `dripstoyou.com` (Domains → set non-www sebagai primary; Vercel otomatis 301 + HTTPS). Tes: `curl -I http://www.dripstoyou.com`.
- [ ] **Validasi Rich Results**: tes `https://dripstoyou.com`, satu halaman treatment, dan `/faq` di https://search.google.com/test/rich-results setelah deploy.

### Prioritas 2 — bulan ini
- [ ] **Bing Webmaster Tools**: import dari GSC (sekali klik) atau verifikasi manual → submit sitemap.
- [ ] **Konsistensi NAP** di semua platform: nama persis "Drips To You - Bali", nomor +62 823-1404-6089, area layanan sama — di GBP, Instagram bio, Facebook, TripAdvisor, direktori.
- [ ] **Review Google**: minta pelanggan puas tinggalkan review di GBP (target awal 10+; balas semua review).
- [ ] **Sosial media**: pastikan akun Instagram/Facebook/TikTok pakai nama brand konsisten & link ke website, lalu daftarkan di Admin → Social Links agar otomatis masuk `sameAs` JSON-LD (sudah dinamis dari DB).
- [ ] **TripAdvisor + direktori lokal Bali** (Bali Expat directories, Honeycombers Bali, dsb): klaim/daftar listing, konsisten NAP.

### Prioritas 3 — berkelanjutan
- [ ] Lighthouse/PageSpeed (https://pagespeed.web.dev) terhadap URL produksi setelah deploy — bandingkan sebelum/sesudah (lokal tidak representatif karena API PHP tidak tersedia).
- [ ] Konten: pertimbangkan halaman landing per keyword (mis. "Bali Belly IV", "Hangover IV Seminyak") — butuh copy baru, di luar scope teknis ini.
- [ ] (Opsional, butuh keputusan desain) Link "related treatments" di halaman detail + link FAQ → booking — menambah internal linking tapi mengubah UI.
- [ ] Refactor i18n `/id` bila pasar berbahasa Indonesia jadi prioritas (lihat rencana di atas).

---

## C. Cara Verifikasi Setelah Deploy
1. `https://dripstoyou.com/robots.txt` — cek disallow list.
2. `https://dripstoyou.com/sitemap.xml` — semua URL publik + treatment muncul.
3. View-source homepage: 3 blok `application/ld+json` (Organization, WebSite, MedicalBusiness) + `<picture>` di hero.
4. View-source halaman treatment: `Service` + `BreadcrumbList`, title `{Nama} — Mobile IV Therapy Bali | Drips To You`.
5. Rich Results Test untuk `/`, `/faq`, satu halaman treatment.
6. Gambar produk terlayani via `/_next/image?url=https%3A%2F%2Fapi.dripstoyou.com...` (bukan PNG mentah). Jika 502/gagal, cek `PHP_BACKEND_URL` di Vercel env.

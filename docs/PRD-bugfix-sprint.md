# PRD — Bug Fix Sprint: UI & UX Corrections
**Project:** DRIP TO YOU Bali — dripstoyou.com
**Date:** 2026-06-10
**Priority:** High — Production Issues
**Author:** Adithya (via Claude Code audit)

---

## Overview

Lima isu UI/UX ditemukan di production melalui review manual. Semua isu berdampak langsung pada konversi (booking funnel) dan kepercayaan pengguna. Sprint ini tidak menambah fitur baru — murni perbaikan bug dan kualitas.

---

## Issue 1 — Gambar Produk Terpotong (Bukan 1:1) di Halaman Treatment

### Masalah
Di halaman `/treatments/[slug]`, gambar produk terpotong karena container menggunakan **fixed height** tanpa `aspect-ratio`. Pada screenshot, gambar infographic produk yang panjang ke bawah dipotong di bagian bawah.

### Root Cause (Teknis)
**File:** `src/app/globals.css`

```css
/* Desktop */
.td-hero-photo-wrap { height: 420px; }  /* ← fixed, bukan square */
.td-about-img-wrap  { height: 360px; }  /* ← fixed, bukan square */

/* ≤960px */
.td-hero-photo-wrap { height: 300px; }
.td-about-img-wrap  { height: 280px; }
```

Container tidak memiliki `aspect-ratio: 1 / 1`, sehingga gambar product yang di-upload dengan rasio portrait atau berbeda akan terpotong secara tidak konsisten.

### Solusi yang Diharapkan
1. Tambahkan `aspect-ratio: 1 / 1` pada `.td-hero-photo-wrap` dan `.td-about-img-wrap`.
2. Hapus fixed height — biarkan aspect-ratio yang mengontrol tinggi.
3. Pertahankan `object-fit: cover` dan `object-position: center` yang sudah ada.
4. Berlaku di semua breakpoint (desktop, tablet ≤960px, mobile ≤600px).

### Acceptance Criteria
- [ ] Semua gambar produk tampil dalam frame persegi (1:1) tanpa cropping paksa
- [ ] Gambar tetap responsif (lebar mengikuti container)
- [ ] Tidak ada pergeseran layout di sekitar gambar

---

## Issue 2 — Loading Progress Bar Muncul saat Navigasi Antar Seksi di Homepage

### Masalah
Ketika user berada di halaman treatment (`/treatments/[slug]`) dan mengklik link navigasi header seperti "Treatment" atau "How to Book", progress bar emas muncul meski tujuannya hanya scroll ke seksi di homepage — bukan navigasi halaman baru.

### Root Cause (Teknis)
**File:** `src/components/Header.tsx` — fungsi `sectionHref`:
```javascript
function sectionHref(section: string, pathname: string): string {
  return pathname === '/' ? `#${section}` : `/#${section}`;
}
```
Ketika `pathname !== '/'`, href yang dihasilkan adalah `/#how-to-book` (dimulai dengan `/`, bukan `#`).

**File:** `src/components/TopProgressBar.tsx` — kondisi skip:
```javascript
if (
  href.startsWith('http') || href.startsWith('//') ||
  href.startsWith('#') ||           // ← hanya skip pure hash
  href.startsWith('mailto:') || ...
) return;
```
`/#how-to-book` dimulai dengan `/` sehingga **lolos** kondisi skip dan men-trigger progress bar. Karena navigasi ke `/` + hash, bar mulai tapi tidak langsung selesai dengan smooth.

### Solusi yang Diharapkan
Di `TopProgressBar.tsx`, perluas kondisi skip untuk mendeteksi hash navigation ke halaman yang sama:

```javascript
// Tambahkan pengecekan: jika href hanya beda di hash (anchor scroll)
const url = new URL(href, window.location.href);
if (url.pathname === window.location.pathname && url.hash) return;
// Atau: skip semua href yang mengandung '#' (anchor navigation)
if (href.includes('#')) return;
```

### Acceptance Criteria
- [ ] Tidak ada progress bar saat klik link `#treatments`, `#how-to-book`, `#areas` dari halaman manapun
- [ ] Progress bar tetap muncul normal saat navigasi antar halaman yang berbeda (e.g., `/` → `/booking`, `/treatments/slug` → `/about`)

---

## Issue 3 — Placeholder Email Admin Login Bersifat "Kisi-Kisi"

### Masalah
Form login admin di `/admin/login` menampilkan placeholder `admin@dripstoyou.com` yang secara tidak sengaja membocorkan format email admin kepada siapapun yang membuka halaman tersebut.

### Root Cause (Teknis)
**File:** `src/app/admin/login/page.tsx:90`
```jsx
<input
  placeholder="admin@dripstoyou.com"   // ← membocorkan format email
  ...
/>
```

### Solusi yang Diharapkan
Ganti dengan placeholder netral:
```jsx
<input
  placeholder="Enter your email"
  ...
/>
```

Tidak perlu bilingual (halaman admin internal).

### Acceptance Criteria
- [ ] Placeholder email tidak mengandung domain atau format email admin
- [ ] Tetap informatif (contoh: "Enter your email" atau "Email address")

---

## Issue 4 — Fitur "Gunakan Lokasi Saya" Error Langsung tanpa Izin

### Masalah
Di halaman `/booking` Step 2, ketika user menekan tombol "📍 Gunakan lokasi saya", pesan error **"Akses lokasi ditolak"** langsung muncul **tanpa browser menampilkan dialog izin lokasi terlebih dahulu**. User merasa fitur tidak berfungsi dan bingung cara memperbaikinya.

### Root Cause (Teknis)
**File:** `src/app/booking/page.tsx` — `GpsButton` component

Pesan error sudah benar ditampilkan hanya di dalam error callback `getCurrentPosition` (bukan sebelumnya). Namun ada dua skenario yang menyebabkan dialog izin **tidak muncul**:

1. **OS/Browser level denial**: Jika user sebelumnya pernah menolak akses lokasi untuk browser ini di pengaturan OS (khususnya Android), `PERMISSION_DENIED` langsung dikirim tanpa ada dialog prompt.
2. **Site-level denial**: Jika user pernah menekan "Block" untuk site ini, browser langsung mengirim `PERMISSION_DENIED` tanpa dialog ulang.

Pesan error saat ini:
```
ID: "Akses lokasi ditolak. Silakan ketik alamat Anda secara manual."
EN: "Location access was denied. Please type your address manually."
```
Pesan ini tidak memberi tahu user **cara mengizinkan kembali** lokasi di pengaturan browser/OS.

### Solusi yang Diharapkan

**A. Pre-check dengan Permissions API** (sebelum meminta GPS):
```javascript
if ('permissions' in navigator) {
  const perm = await navigator.permissions.query({ name: 'geolocation' });
  if (perm.state === 'denied') {
    // Tampilkan pesan khusus sebelum bahkan mencoba getCurrentPosition
    showError(bk.gpsDeniedPermanent);
    return;
  }
}
```

**B. Perbaiki pesan error `gpsDenied`** agar memberi arahan konkret:
```
ID: "Akses lokasi ditolak. Buka Pengaturan Browser → Izin Situs → Lokasi, lalu izinkan dripstoyou.com."
EN: "Location access was denied. Go to Browser Settings → Site Permissions → Location and allow dripstoyou.com."
```

**C. Tambah string baru `gpsDeniedPermanent`** untuk kasus permanent denial yang lebih spesifik dari `gpsDenied`.

### Acceptance Criteria
- [ ] Jika lokasi di-block di level OS/browser, pesan error menampilkan arahan langkah-langkah untuk mengizinkan
- [ ] Jika browser mendukung Permissions API dan status `'denied'`, pesan langsung muncul tanpa loading state
- [ ] Jika status `'prompt'` (belum pernah diminta), dialog browser muncul seperti biasa
- [ ] Error tetap hanya muncul SETELAH interaksi user (klik tombol), bukan saat halaman load

---

## Issue 5 — Button "Pesan Sekarang" dan Floating WhatsApp Bertabrakan

### Masalah
Di halaman `/treatments/[slug]` pada mobile (≤960px), ketika sticky bottom CTA aktif (muncul setelah scroll 420px), tombol floating WhatsApp (hijau, pojok kanan bawah) **menimpa area tombol WhatsApp di dalam sticky CTA**, sehingga keduanya tertumpuk dan sulit diklik.

### Root Cause (Teknis)
**File:** `src/app/globals.css`

```css
/* Sticky CTA — fixed bottom bar */
.td-sticky-cta {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 90;
  padding: 12px 16px;
  /* Tinggi efektif: ~66px + safe-area-inset-bottom */
}

/* Floating WA button */
.wa-float-wrap {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 999;
}

@media (max-width: 480px) {
  .wa-float-wrap { bottom: 16px; right: 16px; }
}
```

WA float button (`bottom: 16px`) berada di dalam area yang tertutup sticky CTA (`bottom: 0`, tinggi ~66px). Sticky CTA sendiri sudah memiliki tombol WA tersendiri (`.td-sticky-wa`).

### Solusi yang Diharapkan

**Opsi A (Recommended) — Sembunyikan WA Float saat Sticky CTA Aktif:**
Karena sticky CTA sudah mengandung tombol WA, float button redundant saat sticky CTA visible. Sembunyikan float saat sticky aktif.

Implementasi via CSS data attribute pada `<body>`:
```javascript
// TreatmentDetailContent.tsx — di dalam useEffect scroll
document.body.dataset.stickyVisible = stickyVisible ? 'true' : 'false';
```

```css
/* globals.css */
body[data-sticky-visible="true"] .wa-float-wrap {
  display: none;
}
```

**Opsi B — Naikkan posisi WA Float saat Sticky CTA Aktif:**
```css
body[data-sticky-visible="true"] .wa-float-wrap {
  bottom: calc(66px + env(safe-area-inset-bottom) + 16px);
}
```

Opsi A lebih bersih karena menghilangkan duplikasi fungsi.

### Acceptance Criteria
- [ ] Tidak ada tumpang tindih antara floating WA button dan sticky bottom CTA di mobile
- [ ] Floating WA button kembali muncul saat sticky CTA hilang (scroll ke atas / halaman bukan treatment)
- [ ] Tombol WA di dalam sticky CTA tetap berfungsi normal

---

## Issue 6 — Push ke GitHub & Pastikan Tidak Ada Bug

### Scope
Setelah semua fix di atas diimplementasikan:

1. Jalankan `npm run lint` — pastikan 0 error
2. Jalankan `npm run typecheck` — pastikan 0 type error
3. Jalankan `npm run build` — pastikan build sukses
4. Git commit dengan pesan deskriptif per issue atau bundled
5. Push ke branch `main` di GitHub

### Acceptance Criteria
- [ ] `npm run lint` — exit 0
- [ ] `npm run typecheck` — exit 0
- [ ] `npm run build` — exit 0, tidak ada warning kritis
- [ ] Semua perubahan ter-commit dan ter-push ke remote `main`

---

## File yang Akan Dimodifikasi

| File | Issue |
|------|-------|
| `src/app/globals.css` | #1 (image aspect-ratio), #5 (WA float hide) |
| `src/components/TopProgressBar.tsx` | #2 (hash navigation skip) |
| `src/app/admin/login/page.tsx` | #3 (placeholder text) |
| `src/app/booking/page.tsx` | #4 (GPS error message + pre-check) |
| `src/components/public/TreatmentDetailContent.tsx` | #5 (data attribute body) |

---

## Out of Scope

- Perubahan pada alur booking (Step 1, 2, 3)
- Penambahan fitur baru
- Perubahan warna / tipografi / branding
- Modifikasi database / API

---

## Risk Assessment

| Issue | Risk | Notes |
|-------|------|-------|
| #1 Image 1:1 | Low | Pure CSS, tidak menyentuh JS/data |
| #2 Progress Bar | Low | Penambahan kondisi skip, tidak mengubah logic utama |
| #3 Placeholder | Low | Text change only |
| #4 GPS | Medium | Perlu test di device Android nyata, Permissions API bisa tidak tersedia di semua browser |
| #5 WA Overlap | Low | Data attribute CSS, tidak ada state baru |

'use client';

import { useState, useMemo, useRef } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';

/* ── Types ── */
type CalloutType = 'info' | 'warning' | 'danger' | 'tip';
type ContentBlock =
  | { type: 'steps'; items: { title: string; desc: string; detail?: string }[] }
  | { type: 'callout'; variant: CalloutType; text: string }
  | { type: 'mockup'; html: string; caption: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

interface Section {
  id: string;
  icon: string;
  title: string;
  badge?: string;
  blocks: ContentBlock[];
}

/* ── Helpers ── */
function Callout({ variant, text }: { variant: CalloutType; text: string }) {
  const styles: Record<CalloutType, { bg: string; border: string; color: string; icon: string }> = {
    info:    { bg: '#eff8ff', border: '#bfdbfe', color: '#1e4fa8', icon: 'ℹ️' },
    warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠️' },
    danger:  { bg: '#fff1f2', border: '#fecaca', color: '#9f1239', icon: '🚫' },
    tip:     { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
  };
  const s = styles[variant];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
      padding: '12px 16px', fontSize: 13.5, color: s.color, lineHeight: 1.6,
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ flexShrink: 0, fontSize: 16 }}>{s.icon}</span>
      <span style={{ whiteSpace: 'pre-line' }}>{text}</span>
    </div>
  );
}

function Steps({ items }: { items: { title: string; desc: string; detail?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 14 }}>
          <div style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
            background: 'var(--teal)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, marginTop: 1,
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', marginBottom: 3 }}>{step.title}</div>
            <div style={{ fontSize: 13.5, color: '#555', lineHeight: 1.6 }}>{step.desc}</div>
            {step.detail && (
              <div style={{
                marginTop: 6, padding: '6px 12px',
                background: '#f0f9ff', borderLeft: '3px solid var(--ocean)',
                fontSize: 12.5, color: '#1e6f8c', borderRadius: '0 6px 6px 0',
              }}>
                {step.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockupFrame({ html, caption }: { html: string; caption: string }) {
  return (
    <div style={{ border: '1px solid rgba(32,82,81,0.12)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e4da', padding: '8px 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>Admin Panel — Preview</span>
      </div>
      <div
        style={{ padding: '20px', background: 'white', overflowX: 'auto' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {caption && (
        <div style={{ padding: '8px 14px', background: '#fafaf8', borderTop: '1px solid #f0ede8', fontSize: 12, color: '#888' }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(32,82,81,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--pale-aqua)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--teal)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: '1px solid #f0ede8' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '9px 14px', color: '#444', verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Mockup HTML snippets ── */
const BOOKING_TAB_MOCKUP = `
<div style="display:flex;gap:4px;padding:5px;background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;width:fit-content;margin-bottom:14px">
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:var(--teal,#205251);color:white;font-size:12px;font-weight:700;cursor:pointer">Semua Booking <span style="background:rgba(255,255,255,.25);border-radius:999px;padding:2px 6px;font-size:10px">12</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#666;font-size:12px;font-weight:600">Aktif <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px;color:#205251">5</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#666;font-size:12px;font-weight:600">Selesai <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px;color:#205251">4</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#666;font-size:12px;font-weight:600">Dibatalkan <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px;color:#205251">3</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#999;font-size:12px;font-weight:600">Riwayat Dihapus <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px">0</span></button>
</div>
<div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;overflow:hidden">
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#f8f8f8">
      <th style="padding:10px 14px;text-align:left;color:#205251;font-weight:700">Kode</th>
      <th style="padding:10px 14px;text-align:left;color:#205251;font-weight:700">Pelanggan</th>
      <th style="padding:10px 14px;text-align:left;color:#205251;font-weight:700">Treatment</th>
      <th style="padding:10px 14px;text-align:left;color:#205251;font-weight:700">Status</th>
      <th style="padding:10px 14px;text-align:left;color:#205251;font-weight:700">Aksi</th>
    </tr></thead>
    <tbody>
      <tr style="border-top:1px solid #f0ede8">
        <td style="padding:10px 14px;font-weight:800;color:#205251;font-family:monospace">DTY-001</td>
        <td style="padding:10px 14px">Budi Santoso</td>
        <td style="padding:10px 14px">Immunity Boost IV</td>
        <td style="padding:10px 14px"><span style="background:#e7f1ff;color:#1d5f9f;border:1px solid #aad0ff;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700">KONFIRMASI</span></td>
        <td style="padding:10px 14px"><button style="padding:3px 10px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">Detail</button></td>
      </tr>
    </tbody>
  </table>
</div>
`;

const AREA_CARD_MOCKUP = `
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">
  <div style="background:white;border:1.5px solid rgba(32,82,81,.12);border-radius:16px;padding:18px;position:relative">
    <span style="position:absolute;top:12px;right:12px;background:#ead4ae;color:#205251;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px">#1</span>
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>
      <strong style="font-size:15px;color:#205251">Seminyak</strong>
    </div>
    <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 7px;border-radius:4px">seminyak</code>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
      <span style="background:#d6eaea;color:#205251;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px">⏱ 25 menit</span>
      <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px">✓ Gratis</span>
      <span style="background:#d6eaea;color:#205251;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px">Aktif</span>
    </div>
    <div style="border-top:1px solid #f0ede8;padding-top:12px;margin-top:12px;display:flex;gap:7px">
      <button style="flex:1;padding:6px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">Edit</button>
      <button style="padding:6px 12px;font-size:11px;border:1px solid #fecaca;border-radius:7px;background:#fef2f2;color:#dc2626;cursor:pointer">Hapus</button>
    </div>
  </div>
  <div style="background:white;border:1.5px solid rgba(0,0,0,.08);border-radius:16px;padding:18px;opacity:.72;position:relative">
    <span style="position:absolute;top:12px;right:12px;background:#ead4ae;color:#205251;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px">#2</span>
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span style="width:8px;height:8px;border-radius:50%;background:#d1d5db;flex-shrink:0"></span>
      <strong style="font-size:15px;color:#888">Kuta Utara</strong>
    </div>
    <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 7px;border-radius:4px">kuta-utara</code>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
      <span style="background:#e5e7eb;color:#6b7280;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px">Nonaktif</span>
    </div>
    <div style="border-top:1px solid #f0ede8;padding-top:12px;margin-top:12px;display:flex;gap:7px">
      <button style="flex:1;padding:6px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">Edit</button>
      <button style="padding:6px 12px;font-size:11px;border:1px solid #fecaca;border-radius:7px;background:#fef2f2;color:#dc2626;cursor:pointer">Hapus</button>
    </div>
  </div>
</div>
`;

const DELETE_CONFIRM_MOCKUP = `
<div style="background:rgba(0,0,0,.4);border-radius:12px;padding:20px;display:flex;align-items:center;justify-content:center">
  <div style="background:white;border-radius:18px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2)">
    <h3 style="font-size:18px;color:#b33223;margin-bottom:8px">⚠️ Hapus Area Layanan</h3>
    <p style="font-size:13px;color:#555;line-height:1.7;margin-bottom:20px">
      Anda akan menghapus area <strong>"Seminyak"</strong> secara permanen.<br><br>
      Semua booking yang terhubung akan kehilangan referensi area ini. Tindakan ini tidak dapat dibatalkan.
    </p>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button style="padding:8px 18px;font-size:13px;border:1px solid #ddd;border-radius:8px;background:white;cursor:pointer">Cancel</button>
      <button style="padding:8px 18px;font-size:13px;border:none;border-radius:8px;background:#dc2626;color:white;cursor:pointer">Hapus "Seminyak"</button>
    </div>
  </div>
</div>
`;

const STATUS_FLOW_MOCKUP = `
<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px;background:#fafaf8;border-radius:10px">
  <div style="display:flex;align-items:center;gap:8px">
    <span style="background:#fff4ce;color:#8a5b00;border:1px solid #f7d77a;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700">BARU</span>
    <span style="color:#aaa;font-size:16px">→</span>
    <span style="background:#e7f1ff;color:#1d5f9f;border:1px solid #aad0ff;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700">KONFIRMASI</span>
    <span style="color:#aaa;font-size:16px">→</span>
    <span style="background:#e5f4f6;color:#276f73;border:1px solid #b8dfe2;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700">DIPROSES</span>
    <span style="color:#aaa;font-size:16px">→</span>
    <span style="background:#ecfdf3;color:#167a3f;border:1px solid #b7e4c7;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700">SELESAI</span>
  </div>
  <div style="margin-top:8px;display:flex;align-items:center;gap:8px;width:100%">
    <span style="color:#aaa;font-size:12px">atau dari status apapun:</span>
    <span style="background:#fff0ed;color:#b33223;border:1px solid #f2b8ae;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700">DIBATALKAN</span>
  </div>
</div>
`;

/* ── Content ── */
function buildSections(lang: 'id' | 'en'): Section[] {
  const id = lang === 'id';
  return [
    {
      id: 'bookings',
      icon: '📋',
      title: id ? 'Mengelola Booking' : 'Managing Bookings',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka halaman Bookings', desc: 'Klik "Booking" di sidebar kiri untuk melihat semua reservasi.' },
            { title: 'Gunakan tab untuk filter', desc: 'Halaman booking memiliki 5 tab: Semua, Aktif (BARU+KONFIRMASI+DIPROSES), Selesai, Dibatalkan, dan Riwayat Dihapus (hanya SUPER_ADMIN).' },
            { title: 'Cari booking', desc: 'Gunakan kotak pencarian di kanan atas tab untuk mencari berdasarkan kode booking, nama pelanggan, atau nama treatment.' },
            { title: 'Buka detail booking', desc: 'Klik tombol "Detail" pada baris booking untuk melihat informasi lengkap dan mengubah status.' },
            { title: 'Export data', desc: 'Klik "Export CSV" di pojok kanan atas untuk mengunduh semua data booking.' },
          ] : [
            { title: 'Open Bookings page', desc: 'Click "Bookings" in the left sidebar to see all reservations.' },
            { title: 'Use tabs to filter', desc: 'The booking page has 5 tabs: All, Active (BARU+KONFIRMASI+DIPROSES), Completed, Cancelled, and Deletion History (SUPER_ADMIN only).' },
            { title: 'Search bookings', desc: 'Use the search box at the top-right of the tabs to search by booking code, customer name, or treatment name.' },
            { title: 'Open booking detail', desc: 'Click the "Detail" button on a booking row to see full information and change status.' },
            { title: 'Export data', desc: 'Click "Export CSV" at the top-right to download all booking data.' },
          ],
        },
        {
          type: 'mockup',
          html: BOOKING_TAB_MOCKUP,
          caption: id ? 'Tab sistem pada halaman Bookings — klik tab untuk memfilter, cari dengan kotak pencarian di kanan' : 'Tab system on the Bookings page — click tabs to filter, search with the box on the right',
        },
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Data booking diperbarui otomatis setiap 10 detik. Tidak perlu refresh manual.'
            : 'Booking data updates automatically every 10 seconds. No manual refresh needed.',
        },
      ],
    },
    {
      id: 'booking-detail',
      icon: '🔍',
      title: id ? 'Detail & Status Booking' : 'Booking Detail & Status',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka detail', desc: 'Dari halaman Bookings, klik "Detail" pada baris booking yang diinginkan.' },
            { title: 'Lihat informasi pelanggan', desc: 'Detail menampilkan: data pelanggan, treatment, tanggal/waktu, area layanan, catatan, dan riwayat perubahan status.' },
            { title: 'Ubah status booking', desc: 'Klik salah satu tombol status di bagian "Status Booking", tambahkan catatan opsional, lalu klik "Simpan Status".' },
            { title: 'Alur status', desc: 'Status bergerak maju: BARU → KONFIRMASI → DIPROSES → SELESAI. Pembatalan bisa dari status apapun.' },
          ] : [
            { title: 'Open detail', desc: 'From the Bookings page, click "Detail" on the desired booking row.' },
            { title: 'View customer information', desc: 'Detail shows: customer data, treatment, date/time, service area, notes, and status change history.' },
            { title: 'Change booking status', desc: 'Click one of the status buttons in the "Booking Status" section, add an optional note, then click "Save Status".' },
            { title: 'Status flow', desc: 'Status moves forward: BARU → KONFIRMASI → DIPROSES → SELESAI. Cancellation is possible from any status.' },
          ],
        },
        {
          type: 'mockup',
          html: STATUS_FLOW_MOCKUP,
          caption: id ? 'Alur status booking — setiap perubahan dicatat di timeline' : 'Booking status flow — every change is recorded in the timeline',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: id
            ? 'Setiap perubahan status otomatis dicatat di audit log dengan waktu dan admin yang melakukan perubahan.'
            : 'Every status change is automatically recorded in the audit log with the time and admin who made the change.',
        },
      ],
    },
    {
      id: 'delete-booking',
      icon: '🗑️',
      title: id ? 'Hapus Booking (SUPER ADMIN)' : 'Delete Booking (SUPER ADMIN)',
      badge: 'SUPER_ADMIN',
      blocks: [
        {
          type: 'callout',
          variant: 'danger',
          text: id
            ? 'Penghapusan booking bersifat permanen dan tidak dapat dibatalkan. Hanya SUPER_ADMIN yang bisa menghapus booking.'
            : 'Booking deletion is permanent and cannot be undone. Only SUPER_ADMIN can delete bookings.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Tombol Hapus', desc: 'Tombol merah "Hapus" hanya muncul di kolom aksi jika Anda login sebagai SUPER_ADMIN.' },
            { title: 'Isi alasan penghapusan', desc: 'Sebuah modal konfirmasi muncul. Anda WAJIB mengisi alasan penghapusan (contoh: "Double booking", "Test data").' },
            { title: 'Konfirmasi 2 langkah', desc: 'Centang konfirmasi "saya memahami tindakan ini tidak dapat dibatalkan", lalu klik "Hapus Permanen".' },
            { title: 'Log penghapusan', desc: 'Setelah dihapus, booking tercatat di tab "Riwayat Dihapus" dengan snapshot lengkap termasuk data terenkripsi yang sudah didekripsi.' },
          ] : [
            { title: 'Delete button', desc: 'The red "Delete" button only appears in the action column if you are logged in as SUPER_ADMIN.' },
            { title: 'Fill deletion reason', desc: 'A confirmation modal appears. You MUST fill in a deletion reason (e.g. "Double booking", "Test data").' },
            { title: '2-step confirmation', desc: 'Check the confirmation "I understand this action cannot be undone", then click "Delete Permanently".' },
            { title: 'Deletion log', desc: 'After deletion, the booking is recorded in the "Deletion History" tab with a full snapshot including decrypted sensitive data.' },
          ],
        },
      ],
    },
    {
      id: 'products',
      icon: '💉',
      title: id ? 'Mengelola Treatment (Produk)' : 'Managing Treatments (Products)',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Treatment', desc: 'Klik "Treatment" di bagian Layanan pada sidebar.' },
            { title: 'Tambah treatment baru', desc: 'Klik tombol "Tambah Produk" di kanan atas.' },
            { title: 'Isi detail produk', desc: 'Isi nama, deskripsi, harga, durasi (menit), dan jumlah maks peserta.' },
            { title: 'Upload gambar', desc: 'Upload foto treatment. Gambar disimpan sebagai file di server PHP. Format: JPG/PNG/WebP, maks 2MB.' },
            { title: 'Aktif/Nonaktif', desc: 'Centang "Aktif" agar treatment muncul di website publik. Nonaktifkan untuk menyembunyikan tanpa menghapus.' },
          ] : [
            { title: 'Open Treatments menu', desc: 'Click "Treatment" in the Services section of the sidebar.' },
            { title: 'Add a new treatment', desc: 'Click the "Add Product" button at the top right.' },
            { title: 'Fill product details', desc: 'Enter name, description, price, duration (minutes), and max participants.' },
            { title: 'Upload image', desc: 'Upload a treatment photo. Images are stored as files on the PHP server. Format: JPG/PNG/WebP, max 2MB.' },
            { title: 'Active/Inactive', desc: 'Check "Active" to show the treatment on the public website. Deactivate to hide without deleting.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'Konten medis: Gunakan bahasa yang hati-hati.\n✅ "membantu mendukung pemulihan"\n✅ "dirancang untuk mendukung hidrasi"\n❌ "menyembuhkan penyakit"\n❌ "garansi hasil"\n❌ "pasti sembuh"'
            : 'Medical content: Use careful language.\n✅ "helps support recovery"\n✅ "designed to support hydration"\n❌ "cures disease"\n❌ "guaranteed results"\n❌ "definitely heals"',
        },
      ],
    },
    {
      id: 'schedule',
      icon: '📅',
      title: id ? 'Jadwal Operasional' : 'Operating Schedule',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Jadwal', desc: 'Klik "Jadwal" di bagian Layanan pada sidebar.' },
            { title: 'Atur jam per hari', desc: 'Setiap hari memiliki jam buka dan jam tutup yang bisa diatur secara individual.' },
            { title: 'Tandai hari tutup', desc: 'Toggle "Tutup" untuk menandai hari libur atau hari tanpa layanan. Hari tutup ditampilkan dengan jelas di booking form publik.' },
            { title: 'Simpan perubahan', desc: 'Klik "Simpan Jadwal". Jadwal baru langsung aktif di semua halaman.' },
          ] : [
            { title: 'Open Schedule menu', desc: 'Click "Schedule" in the Services section of the sidebar.' },
            { title: 'Set hours per day', desc: 'Each day has opening and closing times that can be set individually.' },
            { title: 'Mark closed days', desc: 'Toggle "Closed" to mark holidays or days without service. Closed days are clearly displayed in the public booking form.' },
            { title: 'Save changes', desc: 'Click "Save Schedule". New schedule is immediately active on all pages.' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Jadwal operasional juga digunakan sebagai referensi pelanggan di halaman publik saat memilih tanggal dan waktu booking.'
            : 'The operating schedule is also used as a reference for customers on the public page when selecting booking date and time.',
        },
      ],
    },
    {
      id: 'coverage',
      icon: '📍',
      title: id ? 'Area Layanan' : 'Service Areas',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Area Layanan', desc: 'Klik "Area Layanan" di bagian Layanan pada sidebar.' },
            { title: 'Tambah area baru', desc: 'Klik "Tambah Area", isi nama area (contoh: Seminyak), slug akan terisi otomatis.' },
            { title: 'Isi estimasi tiba', desc: 'Masukkan estimasi waktu tiba dalam menit (contoh: 30 untuk 30 menit).' },
            { title: 'Isi biaya tambahan', desc: 'Masukkan biaya tambahan dalam Rupiah. Isi 0 untuk gratis. Kosongkan jika tidak ada biaya transport.' },
            { title: 'Urutan tampil', desc: 'Angka "Urutan" menentukan posisi di dropdown booking. Angka kecil = tampil lebih awal.' },
            { title: 'Hapus area', desc: 'Klik tombol "Hapus" (merah) pada kartu area. Penghapusan bersifat permanen — pastikan tidak ada booking aktif di area tersebut.' },
          ] : [
            { title: 'Open Service Areas menu', desc: 'Click "Area Layanan" in the Services section of the sidebar.' },
            { title: 'Add a new area', desc: 'Click "Add Area", fill in the area name (e.g. Seminyak), the slug will be auto-filled.' },
            { title: 'Fill arrival estimate', desc: 'Enter the estimated arrival time in minutes (e.g. 30 for 30 minutes).' },
            { title: 'Fill extra fee', desc: 'Enter extra fee in Rupiah. Enter 0 for free. Leave blank if there is no transport fee.' },
            { title: 'Display order', desc: 'The "Order" number determines position in the booking dropdown. Smaller number = appears earlier.' },
            { title: 'Delete area', desc: 'Click the "Hapus" (red) button on the area card. Deletion is permanent — ensure no active bookings are in that area.' },
          ],
        },
        {
          type: 'mockup',
          html: AREA_CARD_MOCKUP,
          caption: id ? 'Kartu area layanan — area nonaktif tampil redup, tidak ada tombol toggle (hanya edit & hapus)' : 'Service area cards — inactive areas appear dimmed, no toggle button (only edit & delete)',
        },
        {
          type: 'mockup',
          html: DELETE_CONFIRM_MOCKUP,
          caption: id ? 'Dialog konfirmasi hapus area — penghapusan permanen, tidak bisa dibatalkan' : 'Area deletion confirmation dialog — permanent deletion, cannot be undone',
        },
        {
          type: 'callout',
          variant: 'danger',
          text: id
            ? 'Hapus area HANYA jika area tersebut sudah tidak digunakan dan semua booking yang terhubung sudah selesai. Booking yang terhubung ke area yang dihapus akan kehilangan referensi area-nya.'
            : 'Delete an area ONLY if it is no longer in use and all linked bookings are completed. Bookings linked to a deleted area will lose their area reference.',
        },
      ],
    },
    {
      id: 'faqs',
      icon: '❓',
      title: 'FAQ',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu FAQ', desc: 'Klik "FAQ" di bagian Konten Website pada sidebar.' },
            { title: 'Tambah FAQ baru', desc: 'Klik "+ Tambah FAQ", isi pertanyaan (Bahasa Indonesia dan Inggris jika bilingual), dan jawaban lengkap.' },
            { title: 'Atur urutan', desc: 'Ubah angka "Urutan" — angka lebih kecil tampil lebih dulu di website.' },
            { title: 'Aktif/Nonaktif', desc: 'Toggle status untuk menyembunyikan FAQ dari publik tanpa menghapusnya.' },
            { title: 'Edit atau hapus', desc: 'Klik "Edit" untuk mengubah, atau "Hapus" untuk menghapus permanen.' },
          ] : [
            { title: 'Open FAQ menu', desc: 'Click "FAQ" in the Website Content section of the sidebar.' },
            { title: 'Add a new FAQ', desc: 'Click "+ Add FAQ", fill in the question (Indonesian and English if bilingual) and the full answer.' },
            { title: 'Set order', desc: 'Change the "Order" number — smaller number appears first on the website.' },
            { title: 'Active/Inactive', desc: 'Toggle status to hide a FAQ from the public without deleting it.' },
            { title: 'Edit or delete', desc: 'Click "Edit" to modify, or "Delete" to permanently delete.' },
          ],
        },
      ],
    },
    {
      id: 'social',
      icon: '🔗',
      title: id ? 'Social Links & Kontak' : 'Social Links & Contact',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Social Links', desc: 'Klik "Social Links" di bagian Konten Website.' },
            { title: 'Tambah link WhatsApp', desc: 'Pilih platform "WhatsApp", masukkan nomor HP format lokal (08xxx). Sistem otomatis ubah ke wa.me/628xxx.', detail: 'Contoh: 081234567890 → link wa.me/6281234567890' },
            { title: 'Tambah link Instagram', desc: 'Pilih platform "Instagram", masukkan username saja (contoh: dripstoyou.bali). URL otomatis dibuat.', detail: 'Contoh: dripstoyou.bali → instagram.com/dripstoyou.bali' },
            { title: 'Atur urutan tampil', desc: 'Ubah angka "Urutan" untuk menentukan posisi di halaman Kontak publik.' },
          ] : [
            { title: 'Open Social Links menu', desc: 'Click "Social Links" in the Website Content section.' },
            { title: 'Add WhatsApp link', desc: 'Select "WhatsApp" platform, enter local phone number (08xxx). System automatically converts to wa.me/628xxx.', detail: 'Example: 081234567890 → link wa.me/6281234567890' },
            { title: 'Add Instagram link', desc: 'Select "Instagram" platform, enter username only (e.g. dripstoyou.bali). URL is auto-generated.', detail: 'Example: dripstoyou.bali → instagram.com/dripstoyou.bali' },
            { title: 'Set display order', desc: 'Change the "Order" number to determine position on the public Contact page.' },
          ],
        },
      ],
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: id ? 'Pengaturan Umum' : 'General Settings',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka Pengaturan Umum', desc: 'Klik "Pengaturan Umum" di bagian Pengaturan pada sidebar.' },
            { title: 'Nama Bisnis & Tagline', desc: 'Isi nama bisnis dan tagline. Ini tampil di header website dan metadata SEO.' },
            { title: 'Nomor WhatsApp Utama', desc: 'Masukkan nomor tanpa + atau spasi. Ini digunakan untuk tombol "Pesan via WhatsApp" di website.', detail: 'Format: 6281234567890 (tanpa +, tanpa 0 di depan)' },
            { title: 'Simpan', desc: 'Klik "Simpan Pengaturan". Perubahan langsung aktif.' },
          ] : [
            { title: 'Open General Settings', desc: 'Click "General Settings" in the Settings section of the sidebar.' },
            { title: 'Business Name & Tagline', desc: 'Enter business name and tagline. This appears in the website header and SEO metadata.' },
            { title: 'Main WhatsApp Number', desc: 'Enter the number without + or spaces. This is used for the "Order via WhatsApp" button on the website.', detail: 'Format: 6281234567890 (no +, no leading 0)' },
            { title: 'Save', desc: 'Click "Save Settings". Changes take effect immediately.' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'WhatsApp Template (menu terpisah di sidebar) memungkinkan Anda mengustomisasi pesan otomatis yang dikirim ke pelanggan setelah booking.'
            : 'WhatsApp Template (separate menu in the sidebar) lets you customize the automatic message sent to customers after booking.',
        },
      ],
    },
    {
      id: 'roles',
      icon: '🔑',
      title: id ? 'Role & Hak Akses' : 'Roles & Permissions',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Admin panel menggunakan 3 role berbeda dengan hak akses yang dibatasi. Role ditentukan saat akun dibuat dan hanya bisa diubah oleh SUPER_ADMIN.'
            : 'The admin panel uses 3 different roles with restricted access rights. Role is determined when the account is created and can only be changed by SUPER_ADMIN.',
        },
        {
          type: 'table',
          headers: id
            ? ['Role', 'Booking', 'Delete Booking', 'Jadwal & Area', 'Treatment', 'FAQ & Konten', 'Export', 'Pengaturan']
            : ['Role', 'Bookings', 'Delete Booking', 'Schedule & Areas', 'Treatments', 'FAQ & Content', 'Export', 'Settings'],
          rows: [
            ['SUPER_ADMIN', '✅', '✅', '✅', '✅', '✅', '✅', '✅'],
            ['ADMIN_OPERASIONAL', '✅', '❌', '✅', id ? '✅ (lihat)' : '✅ (view)', '❌', '❌', '❌'],
            ['CONTENT_ADMIN', '❌', '❌', '❌', '✅', '✅', '❌', '❌'],
          ],
        },
      ],
    },
    {
      id: 'security',
      icon: '🔒',
      title: id ? 'Keamanan & Privasi' : 'Security & Privacy',
      blocks: [
        {
          type: 'callout',
          variant: 'danger',
          text: id
            ? 'Aturan keamanan wajib:\n• Jangan pernah share password ke siapapun\n• Selalu logout setelah selesai, terutama di perangkat publik\n• Jangan screenshot halaman yang menampilkan data pelanggan sensitif\n• Laporkan ke tim teknis jika ada akses yang mencurigakan'
            : 'Mandatory security rules:\n• Never share your password with anyone\n• Always log out when done, especially on public devices\n• Do not screenshot pages showing sensitive customer data\n• Report to the technical team if there is suspicious access',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'Data sensitif pelanggan (nomor HP, alamat, catatan) dienkripsi di database. Data ini hanya bisa dilihat oleh admin yang login — tidak ada yang tersimpan di browser atau log.'
            : 'Sensitive customer data (phone number, address, notes) is encrypted in the database. This data can only be seen by logged-in admins — nothing is stored in the browser or logs.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Session otomatis expire', desc: 'Jika tidak aktif terlalu lama, session akan expire dan Anda akan diarahkan ke halaman login.' },
            { title: 'Rate limiting', desc: 'Login dibatasi 5 percobaan per 15 menit. Jika akun terkunci, tunggu 15 menit atau hubungi SUPER_ADMIN.' },
            { title: 'Audit log', desc: 'Semua aksi admin (login, logout, ubah booking, hapus data) dicatat otomatis di audit log untuk keperluan keamanan.' },
          ] : [
            { title: 'Session auto-expires', desc: 'If inactive for too long, the session will expire and you will be redirected to the login page.' },
            { title: 'Rate limiting', desc: 'Login is limited to 5 attempts per 15 minutes. If the account is locked, wait 15 minutes or contact SUPER_ADMIN.' },
            { title: 'Audit log', desc: 'All admin actions (login, logout, booking changes, data deletion) are automatically recorded in the audit log for security purposes.' },
          ],
        },
      ],
    },
  ];
}

/* ── TOC ── */
function TOC({ sections, activeId, onNav }: { sections: Section[]; activeId: string; onNav: (id: string) => void }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sections.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => onNav(s.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            background: activeId === s.id ? 'var(--pale-aqua)' : 'transparent',
            color: activeId === s.id ? 'var(--teal)' : '#555',
            fontWeight: activeId === s.id ? 700 : 500,
            fontSize: 13, transition: 'background .15s',
          }}
        >
          <span style={{ fontSize: 15 }}>{s.icon}</span>
          <span>{s.title}</span>
          {s.badge && (
            <span style={{ marginLeft: 'auto', background: '#fff4ce', color: '#8a5b00', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>
              {s.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

/* ── Main component ── */
export default function GuideContent() {
  const { lang } = useAdminLang();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('bookings');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allSections = useMemo(() => buildSections(lang), [lang]);

  const sections = useMemo(() => {
    if (!search.trim()) return allSections;
    const q = search.toLowerCase();
    return allSections.filter(s => {
      if (s.title.toLowerCase().includes(q)) return true;
      return s.blocks.some(b => {
        if (b.type === 'steps') return b.items.some(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
        if (b.type === 'callout') return b.text.toLowerCase().includes(q);
        return false;
      });
    });
  }, [allSections, search]);

  function scrollTo(id: string) {
    setActiveId(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const title    = lang === 'en' ? 'Admin Guide' : 'Panduan Admin';
  const subtitle = lang === 'en'
    ? 'Comprehensive guide for the Drips To You Bali admin panel.'
    : 'Panduan lengkap penggunaan admin panel Drips To You Bali.';

  return (
    <div className="admin-page wide">
      <div className="admin-page-head" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="admin-title">{title}</h1>
          <p className="admin-subtitle">{subtitle}</p>
        </div>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 14 }}>🔍</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'en' ? 'Search guide...' : 'Cari panduan...'}
            style={{
              height: 38, paddingLeft: 32, paddingRight: 12, border: '1px solid rgba(32,82,81,.16)',
              borderRadius: 10, fontSize: 14, width: 220,
            }}
          />
        </div>
      </div>

      <div className="guide-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>
        {/* TOC sidebar */}
        <div className="guide-toc-sidebar" style={{
          position: 'sticky', top: 80, background: 'white',
          border: '1px solid rgba(32,82,81,.08)', borderRadius: 16,
          padding: '14px 10px',
          boxShadow: '0 4px 16px rgba(32,82,81,.06)',
        }}>
          <div style={{ padding: '4px 12px 10px', fontWeight: 800, fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'en' ? 'Contents' : 'Daftar Isi'}
          </div>
          <TOC sections={allSections} activeId={activeId} onNav={scrollTo} />
        </div>

        {/* Content area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
              {lang === 'en' ? 'No results found.' : 'Tidak ada hasil yang ditemukan.'}
            </div>
          )}
          {sections.map(section => (
            <div
              key={section.id}
              ref={el => { sectionRefs.current[section.id] = el; }}
              id={`guide-${section.id}`}
              style={{ scrollMarginTop: 90 }}
              onClick={() => setActiveId(section.id)}
            >
              <div style={{
                background: 'white', border: '1px solid rgba(32,82,81,.09)',
                borderRadius: 18, padding: '26px 28px',
                boxShadow: '0 4px 18px rgba(32,82,81,.05)',
              }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #f0ede8' }}>
                  <span style={{ fontSize: 26 }}>{section.icon}</span>
                  <h2 style={{
                    fontFamily: 'var(--font-playfair,Georgia,serif)',
                    fontSize: 20, fontWeight: 700, color: 'var(--teal)', flex: 1,
                  }}>
                    {section.title}
                  </h2>
                  {section.badge && (
                    <span style={{ background: '#fff4ce', color: '#8a5b00', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, border: '1px solid #fcd34d' }}>
                      {section.badge}
                    </span>
                  )}
                </div>

                {/* Blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {section.blocks.map((block, bi) => {
                    if (block.type === 'steps') return <Steps key={bi} items={block.items} />;
                    if (block.type === 'callout') return <Callout key={bi} variant={block.variant} text={block.text} />;
                    if (block.type === 'mockup') return <MockupFrame key={bi} html={block.html} caption={block.caption} />;
                    if (block.type === 'table') return <DataTable key={bi} headers={block.headers} rows={block.rows} />;
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

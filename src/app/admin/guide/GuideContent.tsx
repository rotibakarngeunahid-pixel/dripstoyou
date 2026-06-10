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
      <span style={{ flexShrink: 0, fontSize: 18 }}>{s.icon}</span>
      <span style={{ whiteSpace: 'pre-line' }}>{text}</span>
    </div>
  );
}

function Steps({ items }: { items: { title: string; desc: string; detail?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 14 }}>
          <div style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
            background: 'var(--teal)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, marginTop: 1,
            boxShadow: '0 2px 8px rgba(32,82,81,0.25)',
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1a1a1a', marginBottom: 4 }}>{step.title}</div>
            <div style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65 }}>{step.desc}</div>
            {step.detail && (
              <div style={{
                marginTop: 8, padding: '8px 12px',
                background: '#f0f9ff', borderLeft: '3px solid var(--ocean)',
                fontSize: 12.5, color: '#1e6f8c', borderRadius: '0 6px 6px 0',
                lineHeight: 1.55,
              }}>
                💡 {step.detail}
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
        <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>Admin Panel — Tampilan</span>
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
const DASHBOARD_MOCKUP = `
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
  <div style="background:#f0f9f8;border:1.5px solid rgba(32,82,81,.15);border-radius:14px;padding:16px">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
      <span style="width:32px;height:32px;background:var(--pale-aqua,#d6eaea);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px">📋</span>
      <span style="font-size:11px;color:#667;font-weight:600">Total Booking</span>
    </div>
    <div style="font-size:28px;font-weight:800;color:#205251">42</div>
    <div style="font-size:11px;color:#22c55e;margin-top:4px">↑ +18% dari bulan lalu</div>
  </div>
  <div style="background:#fffbf0;border:1.5px solid rgba(201,148,76,.2);border-radius:14px;padding:16px">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
      <span style="width:32px;height:32px;background:#fef3e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px">⏳</span>
      <span style="font-size:11px;color:#667;font-weight:600">Menunggu Konfirmasi</span>
    </div>
    <div style="font-size:28px;font-weight:800;color:#c9944c">3</div>
    <div style="font-size:11px;color:#c9944c;margin-top:4px">Butuh follow-up segera</div>
  </div>
  <div style="background:#f0f7f7;border:1.5px solid rgba(41,128,139,.15);border-radius:14px;padding:16px">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
      <span style="width:32px;height:32px;background:#e5f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px">📅</span>
      <span style="font-size:11px;color:#667;font-weight:600">Booking Hari Ini</span>
    </div>
    <div style="font-size:28px;font-weight:800;color:#29808b">5</div>
    <div style="font-size:11px;color:#667;margin-top:4px">Jadwal aktif hari ini</div>
  </div>
</div>
<div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;padding:14px">
  <div style="font-size:13px;font-weight:700;color:#205251;margin-bottom:10px">Booking Terbaru</div>
  <div style="font-size:12px;color:#555;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#f9f9f8;border-radius:8px">
      <span><strong>DTY-042</strong> — Rina Sari · Immunity Boost</span>
      <span style="background:#fff4ce;color:#8a5b00;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px">BARU</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#f9f9f8;border-radius:8px">
      <span><strong>DTY-041</strong> — Budi Santoso · Hydration Plus</span>
      <span style="background:#e7f1ff;color:#1d5f9f;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px">KONFIRMASI</span>
    </div>
  </div>
</div>
`;

const BOOKING_TAB_MOCKUP = `
<div style="display:flex;gap:4px;padding:5px;background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;width:fit-content;margin-bottom:14px;overflow-x:auto">
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:var(--teal,#205251);color:white;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Semua <span style="background:rgba(255,255,255,.25);border-radius:999px;padding:2px 6px;font-size:10px">12</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#666;font-size:12px;font-weight:600;white-space:nowrap">Aktif <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px;color:#205251">5</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#666;font-size:12px;font-weight:600;white-space:nowrap">Selesai <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px;color:#205251">4</span></button>
  <button style="height:32px;padding:0 12px;border:none;border-radius:8px;background:transparent;color:#666;font-size:12px;font-weight:600;white-space:nowrap">Dibatalkan <span style="background:rgba(32,82,81,.1);border-radius:999px;padding:2px 6px;font-size:10px;color:#205251">3</span></button>
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
        <td style="padding:10px 14px;font-weight:800;color:#205251;font-family:monospace">DTY-042</td>
        <td style="padding:10px 14px">Rina Sari</td>
        <td style="padding:10px 14px">Immunity Boost IV</td>
        <td style="padding:10px 14px"><span style="background:#fff4ce;color:#8a5b00;border:1px solid #f7d77a;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700">BARU</span></td>
        <td style="padding:10px 14px"><button style="padding:3px 10px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">Detail</button></td>
      </tr>
      <tr style="border-top:1px solid #f0ede8">
        <td style="padding:10px 14px;font-weight:800;color:#205251;font-family:monospace">DTY-041</td>
        <td style="padding:10px 14px">Budi Santoso</td>
        <td style="padding:10px 14px">Hydration Plus</td>
        <td style="padding:10px 14px"><span style="background:#e7f1ff;color:#1d5f9f;border:1px solid #aad0ff;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700">KONFIRMASI</span></td>
        <td style="padding:10px 14px"><button style="padding:3px 10px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">Detail</button></td>
      </tr>
    </tbody>
  </table>
</div>
`;

const STATUS_FLOW_MOCKUP = `
<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:14px;background:#fafaf8;border-radius:10px">
  <span style="background:#fff4ce;color:#8a5b00;border:1.5px solid #f7d77a;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">📥 BARU</span>
  <span style="color:#aaa;font-size:18px;font-weight:300">→</span>
  <span style="background:#e7f1ff;color:#1d5f9f;border:1.5px solid #aad0ff;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">✅ KONFIRMASI</span>
  <span style="color:#aaa;font-size:18px;font-weight:300">→</span>
  <span style="background:#e5f4f6;color:#276f73;border:1.5px solid #b8dfe2;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">⚙️ DIPROSES</span>
  <span style="color:#aaa;font-size:18px;font-weight:300">→</span>
  <span style="background:#ecfdf3;color:#167a3f;border:1.5px solid #b7e4c7;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">🎉 SELESAI</span>
  <div style="width:100%;margin-top:10px;display:flex;align-items:center;gap:8px">
    <span style="font-size:12px;color:#aaa">Dari status apapun bisa:</span>
    <span style="background:#fff0ed;color:#b33223;border:1.5px solid #f2b8ae;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">❌ DIBATALKAN</span>
  </div>
</div>
`;

const BOOKING_DETAIL_MOCKUP = `
<div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:14px;padding:18px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <div style="font-size:20px;font-weight:800;color:#205251;font-family:Georgia,serif">DTY-042</div>
    <span style="background:#fff4ce;color:#8a5b00;border:1.5px solid #f7d77a;border-radius:999px;padding:4px 12px;font-size:11px;font-weight:800">BARU</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
    <div style="background:#f0f9f8;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">💉</span><div><div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700">Treatment</div><div style="font-size:13px;font-weight:700;color:#205251">Immunity Boost</div></div>
    </div>
    <div style="background:#f0f9f8;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">📅</span><div><div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700">Tanggal</div><div style="font-size:13px;font-weight:700;color:#205251">12 Jun 2026</div></div>
    </div>
  </div>
  <div style="border-top:1px solid #f0ede8;padding-top:14px">
    <div style="font-size:12px;font-weight:700;color:#205251;margin-bottom:8px">Ubah Status:</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button style="padding:6px 12px;font-size:11px;border:1.5px solid #aad0ff;background:#e7f1ff;color:#1d5f9f;border-radius:8px;cursor:pointer;font-weight:700">✅ KONFIRMASI</button>
      <button style="padding:6px 12px;font-size:11px;border:1.5px solid rgba(32,82,81,.2);background:white;color:#555;border-radius:8px;cursor:pointer">⚙️ DIPROSES</button>
      <button style="padding:6px 12px;font-size:11px;border:1.5px solid #f2b8ae;background:#fff0ed;color:#b33223;border-radius:8px;cursor:pointer">❌ DIBATALKAN</button>
    </div>
  </div>
</div>
`;

const AREA_CARD_MOCKUP = `
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
  <div style="background:white;border:1.5px solid rgba(32,82,81,.12);border-radius:16px;padding:18px;position:relative">
    <span style="position:absolute;top:12px;right:12px;background:#ead4ae;color:#205251;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px">#1</span>
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span style="width:9px;height:9px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>
      <strong style="font-size:15px;color:#205251">Seminyak</strong>
    </div>
    <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 7px;border-radius:4px">seminyak</code>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
      <span style="background:#d6eaea;color:#205251;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px">⏱ 25 menit</span>
      <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px">✓ Gratis</span>
      <span style="background:#d6eaea;color:#205251;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px">Aktif</span>
    </div>
    <div style="border-top:1px solid #f0ede8;padding-top:10px;margin-top:10px;display:flex;gap:7px">
      <button style="flex:1;padding:6px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">✏️ Edit</button>
      <button style="padding:6px 12px;font-size:11px;border:1px solid #fecaca;border-radius:7px;background:#fef2f2;color:#dc2626;cursor:pointer">🗑️ Hapus</button>
    </div>
  </div>
  <div style="background:white;border:1.5px solid rgba(0,0,0,.08);border-radius:16px;padding:18px;opacity:.65;position:relative">
    <span style="position:absolute;top:12px;right:12px;background:#ead4ae;color:#205251;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px">#2</span>
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span style="width:9px;height:9px;border-radius:50%;background:#d1d5db;flex-shrink:0"></span>
      <strong style="font-size:15px;color:#888">Kuta Utara</strong>
    </div>
    <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 7px;border-radius:4px">kuta-utara</code>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
      <span style="background:#e5e7eb;color:#6b7280;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px">Nonaktif</span>
    </div>
    <div style="border-top:1px solid #f0ede8;padding-top:10px;margin-top:10px;display:flex;gap:7px">
      <button style="flex:1;padding:6px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">✏️ Edit</button>
      <button style="padding:6px 12px;font-size:11px;border:1px solid #fecaca;border-radius:7px;background:#fef2f2;color:#dc2626;cursor:pointer">🗑️ Hapus</button>
    </div>
  </div>
</div>
`;

const SCHEDULE_MOCKUP = `
<div style="display:flex;flex-direction:column;gap:8px">
  <div style="display:grid;grid-template-columns:80px 1fr auto;gap:10px;align-items:center;padding:10px 14px;background:#f0f9f8;border-radius:10px;border:1.5px solid rgba(32,82,81,.12)">
    <span style="font-size:13px;font-weight:700;color:#205251">Senin</span>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:#22c55e"></span>
      <input type="time" value="09:00" style="border:1px solid #ddd;border-radius:6px;padding:4px 8px;font-size:12px;width:90px" readonly />
      <span style="font-size:11px;color:#888">–</span>
      <input type="time" value="21:00" style="border:1px solid #ddd;border-radius:6px;padding:4px 8px;font-size:12px;width:90px" readonly />
    </div>
    <span style="font-size:11px;color:#22c55e;font-weight:700;background:#f0fdf4;padding:3px 8px;border-radius:999px">BUKA</span>
  </div>
  <div style="display:grid;grid-template-columns:80px 1fr auto;gap:10px;align-items:center;padding:10px 14px;background:#fafaf8;border-radius:10px;border:1px solid rgba(0,0,0,.07);opacity:.65">
    <span style="font-size:13px;font-weight:700;color:#888">Minggu</span>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:#d1d5db"></span>
      <span style="font-size:12px;color:#aaa;font-style:italic">— Tutup —</span>
    </div>
    <span style="font-size:11px;color:#6b7280;font-weight:700;background:#f3f4f6;padding:3px 8px;border-radius:999px">TUTUP</span>
  </div>
  <div style="display:grid;grid-template-columns:80px 1fr auto;gap:10px;align-items:center;padding:10px 14px;background:#f0f9f8;border-radius:10px;border:1.5px solid rgba(32,82,81,.12)">
    <span style="font-size:13px;font-weight:700;color:#205251">Sabtu</span>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:#22c55e"></span>
      <input type="time" value="10:00" style="border:1px solid #ddd;border-radius:6px;padding:4px 8px;font-size:12px;width:90px" readonly />
      <span style="font-size:11px;color:#888">–</span>
      <input type="time" value="22:00" style="border:1px solid #ddd;border-radius:6px;padding:4px 8px;font-size:12px;width:90px" readonly />
    </div>
    <span style="font-size:11px;color:#22c55e;font-weight:700;background:#f0fdf4;padding:3px 8px;border-radius:999px">BUKA</span>
  </div>
</div>
<div style="margin-top:10px;display:flex;justify-content:flex-end">
  <button style="padding:8px 18px;font-size:12px;background:#205251;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700">💾 Simpan Jadwal</button>
</div>
`;

const FAQ_MOCKUP = `
<div style="display:flex;flex-direction:column;gap:8px">
  <div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;padding:14px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:#205251;margin-bottom:4px">❓ Apakah IV drip aman?</div>
        <div style="font-size:12px;color:#666;line-height:1.5">Ya, prosedur dilakukan oleh tenaga medis berlisensi dan menggunakan cairan steril...</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;align-items:center">
        <span style="background:#f0fdf4;color:#166534;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px">Aktif</span>
        <button style="padding:3px 8px;font-size:10px;border:1px solid rgba(32,82,81,.2);border-radius:5px;background:white;cursor:pointer">Edit</button>
        <button style="padding:3px 8px;font-size:10px;border:1px solid #fecaca;border-radius:5px;background:#fef2f2;color:#dc2626;cursor:pointer">Hapus</button>
      </div>
    </div>
    <div style="margin-top:8px;display:flex;align-items:center;gap:6px">
      <span style="font-size:10px;color:#aaa">Urutan: 1</span>
    </div>
  </div>
  <div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;padding:14px;opacity:.7">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:#888;margin-bottom:4px">❓ Berapa lama prosedurnya?</div>
        <div style="font-size:12px;color:#999">Tergantung treatment, biasanya 45-90 menit...</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;align-items:center">
        <span style="background:#f3f4f6;color:#6b7280;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px">Nonaktif</span>
        <button style="padding:3px 8px;font-size:10px;border:1px solid rgba(32,82,81,.2);border-radius:5px;background:white;cursor:pointer">Edit</button>
      </div>
    </div>
  </div>
</div>
`;

const USERS_MOCKUP = `
<div style="display:flex;flex-direction:column;gap:10px">
  <div style="background:white;border:1.5px solid rgba(32,82,81,.1);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px">
    <div style="width:44px;height:44px;border-radius:12px;background:#205251;color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0">S</div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px">
        <strong style="font-size:14px;color:#205251">Sari (Owner)</strong>
        <span style="background:#fff4ce;color:#8a5b00;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px">Super Admin</span>
      </div>
      <div style="font-size:12px;color:#888">sari@dripstoyou.com · Login terakhir: hari ini</div>
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button style="padding:5px 10px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">Edit</button>
    </div>
  </div>
  <div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px">
    <div style="width:44px;height:44px;border-radius:12px;background:#276f73;color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0">D</div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px">
        <strong style="font-size:14px;color:#205251">Dewi</strong>
        <span style="background:#e5f4f6;color:#276f73;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px">Admin Operasional</span>
      </div>
      <div style="font-size:12px;color:#888">dewi@dripstoyou.com · Login terakhir: 2 hari lalu</div>
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button style="padding:5px 10px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">Edit</button>
      <button style="padding:5px 10px;font-size:11px;border:1px solid #fecaca;border-radius:7px;background:#fef2f2;color:#dc2626;cursor:pointer">Nonaktif</button>
    </div>
  </div>
</div>
`;

const WA_TEMPLATE_MOCKUP = `
<div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:14px;padding:18px">
  <div style="font-size:13px;font-weight:700;color:#205251;margin-bottom:10px">✏️ Template Pesan</div>
  <div style="background:#f9fbe7;border:1px solid #e8f5a0;border-radius:10px;padding:12px;font-size:12px;color:#333;line-height:1.7;margin-bottom:12px">
    Halo {nama_pelanggan}! 👋<br>
    Booking IV Therapy Anda telah kami terima:<br>
    📋 Kode: {kode_booking}<br>
    💉 Treatment: {nama_treatment}<br>
    📅 Tanggal: {tanggal}<br>
    ⏰ Waktu: {waktu}<br>
    📍 Area: {area}<br><br>
    Tim kami akan segera menghubungi Anda untuk konfirmasi.
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <span style="background:#f0f9ff;color:#0369a1;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px">{nama_pelanggan}</span>
    <span style="background:#f0f9ff;color:#0369a1;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px">{kode_booking}</span>
    <span style="background:#f0f9ff;color:#0369a1;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px">{tanggal}</span>
    <span style="background:#f0f9ff;color:#0369a1;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px">{waktu}</span>
    <span style="background:#f0f9ff;color:#0369a1;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px">{area}</span>
  </div>
</div>
`;

const DELETE_CONFIRM_MOCKUP = `
<div style="background:rgba(0,0,0,.4);border-radius:12px;padding:20px;display:flex;align-items:center;justify-content:center">
  <div style="background:white;border-radius:18px;padding:24px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2)">
    <h3 style="font-size:17px;color:#b33223;margin-bottom:8px">⚠️ Hapus Booking</h3>
    <p style="font-size:12px;color:#555;line-height:1.7;margin-bottom:14px">
      Anda akan menghapus booking <strong>DTY-042</strong> atas nama <strong>Rina Sari</strong> secara permanen.
    </p>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;font-weight:700;color:#888;display:block;margin-bottom:5px;text-transform:uppercase">WAJIB: Alasan Penghapusan</label>
      <input style="width:100%;border:1.5px solid #fca5a5;border-radius:7px;padding:8px 10px;font-size:12px;box-sizing:border-box" placeholder="contoh: Double booking, data test..." readonly />
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button style="padding:7px 14px;font-size:12px;border:1px solid #ddd;border-radius:7px;background:white;cursor:pointer">Batal</button>
      <button style="padding:7px 14px;font-size:12px;border:none;border-radius:7px;background:#dc2626;color:white;cursor:pointer;font-weight:700">Hapus Permanen</button>
    </div>
  </div>
</div>
`;

const SETTINGS_MOCKUP = `
<div style="display:flex;flex-direction:column;gap:12px">
  <div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;padding:16px">
    <div style="font-size:13px;font-weight:700;color:#205251;margin-bottom:12px">📱 WhatsApp & Kontak</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>
        <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">Nomor WA Utama</label>
        <input style="width:100%;border:1px solid #ddd;border-radius:7px;padding:7px 10px;font-size:12px;box-sizing:border-box" value="6281234567890" readonly />
        <div style="font-size:10px;color:#aaa;margin-top:3px">Format: 628xxx (tanpa + atau 0 di depan)</div>
      </div>
      <div>
        <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">Email Bisnis</label>
        <input style="width:100%;border:1px solid #ddd;border-radius:7px;padding:7px 10px;font-size:12px;box-sizing:border-box" value="hello@dripstoyou.com" readonly />
      </div>
    </div>
  </div>
  <div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:12px;padding:16px">
    <div style="font-size:13px;font-weight:700;color:#205251;margin-bottom:12px">🏢 Info Situs</div>
    <div>
      <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">Nama Situs</label>
      <input style="width:100%;border:1px solid #ddd;border-radius:7px;padding:7px 10px;font-size:12px;box-sizing:border-box" value="Drips To You - Bali" readonly />
    </div>
  </div>
</div>
`;

/* ── Content ── */
function buildSections(lang: 'id' | 'en'): Section[] {
  const id = lang === 'id';
  return [
    {
      id: 'dashboard',
      icon: '📊',
      title: id ? 'Dashboard — Ringkasan Utama' : 'Dashboard — Main Summary',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Dashboard adalah halaman pertama saat login. Di sini Anda bisa melihat angka penting bisnis secara sekilas — tidak perlu buka halaman lain untuk mengetahui kondisi terkini.'
            : 'Dashboard is the first page after login. Here you can see key business numbers at a glance — no need to open other pages to know the current state.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Kartu Statistik (3 kotak berwarna)', desc: '📋 Total Booking — total semua booking yang pernah masuk. 📅 Booking Hari Ini — jumlah booking untuk hari ini. ⏳ Menunggu Konfirmasi — booking BARU yang belum ditindaklanjuti. Angka ini paling penting untuk dipantau!', detail: 'Persentase di bawah total booking menunjukkan perbandingan dengan bulan lalu. Hijau = naik, merah = turun.' },
            { title: 'Tabel Booking Terbaru', desc: 'Menampilkan 10 booking terakhir secara ringkas. Klik "Lihat Semua" untuk masuk ke halaman Bookings lengkap.', detail: 'Tabel ini NOT update otomatis — refresh halaman untuk data terbaru.' },
          ] : [
            { title: 'Statistics Cards (3 colored boxes)', desc: '📋 Total Bookings — all bookings ever received. 📅 Today\'s Bookings — bookings for today. ⏳ Awaiting Confirmation — NEW bookings that haven\'t been followed up. This number is most important to monitor!', detail: 'Percentage below total bookings shows comparison to last month. Green = up, red = down.' },
            { title: 'Recent Bookings Table', desc: 'Shows the last 10 bookings briefly. Click "View All" to enter the full Bookings page.', detail: 'This table does NOT auto-update — refresh the page for latest data.' },
          ],
        },
        {
          type: 'mockup',
          html: DASHBOARD_MOCKUP,
          caption: id ? 'Dashboard utama — 3 kartu statistik di atas, daftar booking terbaru di bawah' : 'Main dashboard — 3 stat cards above, recent bookings list below',
        },
      ],
    },
    {
      id: 'bookings',
      icon: '📋',
      title: id ? 'Mengelola Booking' : 'Managing Bookings',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka halaman Bookings', desc: 'Klik "Booking" di menu sidebar kiri. Halaman ini menampilkan SEMUA booking yang masuk.', detail: 'Data diperbarui otomatis setiap 10 detik — waktu pembaruan terakhir terlihat di subtitle halaman.' },
            { title: 'Gunakan tab untuk filter', desc: 'Ada 4 tab utama:\n• Semua — semua booking\n• Aktif — booking BARU + KONFIRMASI + DIPROSES (yang perlu tindakan)\n• Selesai — sudah selesai dilayani\n• Dibatalkan — yang dibatalkan', detail: 'SUPER_ADMIN melihat tab tambahan: Riwayat Dihapus' },
            { title: 'Cari booking', desc: 'Gunakan kotak pencarian di kanan atas tab. Bisa cari berdasarkan:\n• Kode booking (contoh: DTY-042)\n• Nama pelanggan\n• Nama treatment', detail: 'Pencarian berjalan secara real-time — tidak perlu tekan Enter' },
            { title: 'Buka detail booking', desc: 'Klik tombol "Detail" (warna abu-abu) pada baris booking yang ingin dilihat. Akan membuka halaman detail dengan info lengkap dan tombol ubah status.' },
            { title: 'Export data ke Excel', desc: 'Klik "Export CSV" di pojok kanan atas. File akan terunduh otomatis dan bisa dibuka di Excel/Google Sheets.', detail: 'File berisi semua booking yang terfilter saat ini — pilih tab yang tepat sebelum export.' },
          ] : [
            { title: 'Open Bookings page', desc: 'Click "Booking" in the left sidebar menu. This page shows ALL incoming bookings.', detail: 'Data auto-updates every 10 seconds — last update time is shown in the page subtitle.' },
            { title: 'Use tabs to filter', desc: '4 main tabs:\n• All — all bookings\n• Active — BARU + KONFIRMASI + DIPROSES (needs action)\n• Completed — already served\n• Cancelled — cancelled bookings', detail: 'SUPER_ADMIN sees an extra tab: Deletion History' },
            { title: 'Search bookings', desc: 'Use the search box at the top-right of the tabs. Can search by:\n• Booking code (e.g. DTY-042)\n• Customer name\n• Treatment name', detail: 'Search runs in real-time — no need to press Enter' },
            { title: 'Open booking detail', desc: 'Click the "Detail" button (gray) on the booking row you want to view. Opens a detail page with complete info and status change buttons.' },
            { title: 'Export data to Excel', desc: 'Click "Export CSV" at the top right. File downloads automatically and can be opened in Excel/Google Sheets.', detail: 'File contains all currently filtered bookings — choose the right tab before exporting.' },
          ],
        },
        {
          type: 'mockup',
          html: BOOKING_TAB_MOCKUP,
          caption: id ? 'Halaman Bookings — tab filter di atas, tabel booking di bawah dengan tombol Detail' : 'Bookings page — filter tabs above, booking table below with Detail button',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: id
            ? 'Kebiasaan baik: Selalu cek tab "Aktif" setiap pagi. Booking dengan status BARU harus dikonfirmasi secepatnya agar pelanggan tidak menunggu terlalu lama.'
            : 'Good habit: Always check the "Active" tab every morning. BARU bookings should be confirmed ASAP so customers don\'t wait too long.',
        },
      ],
    },
    {
      id: 'booking-detail',
      icon: '🔍',
      title: id ? 'Detail & Ubah Status Booking' : 'Booking Detail & Status Change',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka halaman detail', desc: 'Dari halaman Bookings, klik tombol "Detail" pada baris booking yang diinginkan.' },
            { title: 'Baca informasi pelanggan', desc: 'Halaman detail menampilkan:\n• Nama, nomor HP, dan alamat pelanggan\n• Treatment yang dipesan, harga, tanggal & waktu\n• Jumlah orang, area layanan\n• Catatan khusus dari pelanggan\n• Riwayat perubahan status (timeline di bawah)' },
            { title: 'Ubah status booking', desc: 'Klik salah satu tombol status di bagian "Status Booking". Tombol yang dipilih akan berwarna sesuai status. Tambahkan catatan opsional jika perlu, lalu klik "Simpan Status".', detail: 'Perubahan status langsung tersimpan dan tercatat di riwayat dengan nama admin dan waktu perubahan.' },
          ] : [
            { title: 'Open detail page', desc: 'From the Bookings page, click the "Detail" button on the desired booking row.' },
            { title: 'Read customer information', desc: 'Detail page shows:\n• Customer name, phone, and address\n• Treatment ordered, price, date & time\n• Number of people, service area\n• Special notes from customer\n• Status change history (timeline below)' },
            { title: 'Change booking status', desc: 'Click one of the status buttons in "Booking Status" section. The selected button will be colored accordingly. Add an optional note if needed, then click "Save Status".', detail: 'Status change saves immediately and is logged in history with admin name and time.' },
          ],
        },
        {
          type: 'mockup',
          html: STATUS_FLOW_MOCKUP,
          caption: id ? 'Alur status booking — dari kiri ke kanan (maju), atau ke DIBATALKAN kapan saja' : 'Booking status flow — left to right (forward), or to CANCELLED at any time',
        },
        {
          type: 'mockup',
          html: BOOKING_DETAIL_MOCKUP,
          caption: id ? 'Halaman detail booking — kartu info di atas, tombol ubah status di bawah' : 'Booking detail page — info cards above, status change buttons below',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'DIBATALKAN adalah status final — setelah dibatalkan, booking tidak bisa dikembalikan ke status aktif. Pastikan yakin sebelum membatalkan.'
            : 'CANCELLED is a final status — once cancelled, a booking cannot be restored to active status. Make sure you\'re certain before cancelling.',
        },
      ],
    },
    {
      id: 'delete-booking',
      icon: '🗑️',
      title: id ? 'Hapus Booking (Khusus SUPER ADMIN)' : 'Delete Booking (SUPER ADMIN Only)',
      badge: 'SUPER_ADMIN',
      blocks: [
        {
          type: 'callout',
          variant: 'danger',
          text: id
            ? 'Penghapusan booking bersifat PERMANEN dan TIDAK BISA DIBATALKAN. Gunakan hanya untuk menghapus data yang benar-benar tidak valid (test data, duplikat, dll). Tombol hapus HANYA muncul jika Anda login sebagai SUPER_ADMIN.'
            : 'Booking deletion is PERMANENT and CANNOT BE UNDONE. Use only to remove truly invalid data (test data, duplicates, etc). The delete button ONLY appears if you are logged in as SUPER_ADMIN.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Klik tombol "Hapus" (merah)', desc: 'Tombol ini hanya muncul di kolom Aksi untuk akun SUPER_ADMIN. Klik untuk membuka dialog konfirmasi.' },
            { title: 'Isi alasan penghapusan (WAJIB)', desc: 'Ketik alasan yang jelas mengapa booking ini dihapus. Contoh: "Double booking", "Data test", "Permintaan pelanggan".', detail: 'Alasan ini disimpan permanen di log dan tidak bisa diubah.' },
            { title: 'Klik "Hapus Permanen"', desc: 'Setelah alasan diisi, klik tombol merah "Hapus Permanen". Booking akan hilang dari halaman utama.' },
            { title: 'Cek di Riwayat Dihapus', desc: 'Booking yang dihapus TIDAK benar-benar hilang — disimpan di tab "Riwayat Dihapus" dengan snapshot lengkap termasuk data terenkripsi yang sudah bisa dibaca.', detail: 'Riwayat ini tidak bisa dihapus dan selalu bisa diakses oleh SUPER_ADMIN.' },
          ] : [
            { title: 'Click the "Hapus" button (red)', desc: 'This button only appears in the Action column for SUPER_ADMIN accounts. Click to open the confirmation dialog.' },
            { title: 'Fill deletion reason (REQUIRED)', desc: 'Type a clear reason why this booking is being deleted. Example: "Double booking", "Test data", "Customer request".', detail: 'This reason is permanently saved in the log and cannot be changed.' },
            { title: 'Click "Hapus Permanen"', desc: 'After filling the reason, click the red "Hapus Permanen" button. The booking will disappear from the main page.' },
            { title: 'Check in Deletion History', desc: 'Deleted bookings are NOT truly gone — saved in the "Deletion History" tab with a full snapshot including decrypted sensitive data.', detail: 'This history cannot be deleted and is always accessible by SUPER_ADMIN.' },
          ],
        },
        {
          type: 'mockup',
          html: DELETE_CONFIRM_MOCKUP,
          caption: id ? 'Dialog konfirmasi hapus booking — alasan wajib diisi, tombol merah untuk hapus permanen' : 'Delete booking confirmation dialog — reason is required, red button for permanent deletion',
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
            { title: 'Buka menu Treatment', desc: 'Klik "Treatment" di bagian Layanan pada sidebar kiri.' },
            { title: 'Tambah treatment baru', desc: 'Klik tombol "Tambah Produk" di kanan atas. Formulir akan muncul di bawah tombol tersebut.' },
            { title: 'Isi detail produk', desc: 'Isi semua kolom:\n• Nama treatment (ditampilkan di website publik)\n• Deskripsi manfaat\n• Harga dalam Rupiah\n• Durasi dalam menit (contoh: 60 untuk 1 jam)\n• Maks peserta per sesi (biasanya 1-4 orang)' },
            { title: 'Upload gambar', desc: 'Klik area upload foto dan pilih gambar treatment. Format yang diterima: JPG, PNG, atau WebP. Ukuran maks: 2MB.', detail: 'Gambar terlalu besar tidak akan terupload. Kompres dulu di situs seperti squoosh.app jika perlu.' },
            { title: 'Aktif / Nonaktif', desc: 'Centang "Aktif" agar treatment muncul di website publik. Jika dinonaktifkan, treatment disembunyikan dari pelanggan tapi tidak dihapus dari database.', detail: 'Gunakan fitur nonaktif saat treatment sedang tidak tersedia atau dalam proses update harga.' },
          ] : [
            { title: 'Open Treatments menu', desc: 'Click "Treatment" in the Services section of the left sidebar.' },
            { title: 'Add a new treatment', desc: 'Click the "Tambah Produk" button at the top right. A form will appear below the button.' },
            { title: 'Fill product details', desc: 'Fill all fields:\n• Treatment name (shown on public website)\n• Benefits description\n• Price in Rupiah\n• Duration in minutes (e.g. 60 for 1 hour)\n• Max participants per session (usually 1-4 people)' },
            { title: 'Upload image', desc: 'Click the upload area and select a treatment image. Accepted formats: JPG, PNG, or WebP. Max size: 2MB.', detail: 'Images too large won\'t upload. Compress first at squoosh.app if needed.' },
            { title: 'Active / Inactive', desc: 'Check "Active" to show the treatment on the public website. If deactivated, treatment is hidden from customers but not deleted from database.', detail: 'Use the inactive feature when treatment is temporarily unavailable or price is being updated.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'Panduan bahasa medis — hindari klaim berlebihan:\n\n✅ BOLEH: "membantu mendukung pemulihan", "dirancang untuk hidrasi", "dapat membantu mengurangi kelelahan"\n\n❌ JANGAN: "menyembuhkan penyakit", "garansi hasil", "pasti sembuh", "obat"\n\nIni penting untuk kepatuhan regulasi kesehatan Indonesia.'
            : 'Medical language guide — avoid exaggerated claims:\n\n✅ OK: "helps support recovery", "designed for hydration", "may help reduce fatigue"\n\n❌ DON\'T: "cures disease", "guaranteed results", "definitely heals", "medicine"\n\nThis is important for Indonesian health regulation compliance.',
        },
      ],
    },
    {
      id: 'schedule',
      icon: '📅',
      title: id ? 'Jadwal Operasional' : 'Operating Schedule',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Jadwal operasional menentukan hari apa dan jam berapa pelanggan bisa memilih saat booking online. Pastikan jadwal selalu up-to-date, terutama saat libur nasional atau perubahan jam operasional.'
            : 'The operating schedule determines which days and times customers can select when booking online. Keep the schedule always up-to-date, especially during national holidays or operating hour changes.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Jadwal', desc: 'Klik "Jadwal" di bagian Layanan pada sidebar kiri.' },
            { title: 'Atur hari buka/tutup', desc: 'Setiap baris adalah satu hari dalam seminggu. Centang kolom "Buka" untuk mengaktifkan hari tersebut. Hapus centang untuk menandai hari TUTUP.', detail: 'Hari yang ditutup tidak akan muncul sebagai pilihan tanggal di form booking publik.' },
            { title: 'Atur jam buka & tutup', desc: 'Klik kolom "Jam Buka" dan "Jam Tutup" untuk mengatur waktu operasional. Contoh: 09:00 - 21:00.' },
            { title: 'Atur durasi slot & kapasitas', desc: 'Slot Durasi = selang waktu antar slot booking (contoh: 120 = setiap 2 jam). Max Per Slot = berapa booking yang bisa diterima dalam satu slot waktu yang sama.', detail: 'Contoh: Slot durasi 60 menit dengan max 2 berarti setiap jam, bisa ada 2 booking bersamaan.' },
            { title: 'Min Pre-booking (menit)', desc: 'Berapa menit minimal sebelum sesi dimulai, booking masih bisa dilakukan. Contoh: 120 = pelanggan harus booking minimal 2 jam sebelumnya.' },
            { title: 'Klik "Simpan Jadwal"', desc: 'Tekan tombol biru di atas. Jadwal baru langsung aktif di website publik saat itu juga.' },
          ] : [
            { title: 'Open Schedule menu', desc: 'Click "Schedule" in the Services section of the left sidebar.' },
            { title: 'Set open/closed days', desc: 'Each row is one day of the week. Check the "Buka" column to activate that day. Uncheck to mark as CLOSED.', detail: 'Closed days won\'t appear as date options in the public booking form.' },
            { title: 'Set opening & closing times', desc: 'Click the "Jam Buka" and "Jam Tutup" fields to set operating times. Example: 09:00 - 21:00.' },
            { title: 'Set slot duration & capacity', desc: 'Slot Duration = time interval between booking slots (e.g. 120 = every 2 hours). Max Per Slot = how many bookings can be in the same time slot.', detail: 'Example: 60-min slots with max 2 means each hour can have 2 simultaneous bookings.' },
            { title: 'Min Pre-booking (minutes)', desc: 'How many minutes before a session starts can a booking still be made. Example: 120 = customers must book at least 2 hours in advance.' },
            { title: 'Click "Simpan Jadwal"', desc: 'Press the blue button above. New schedule is immediately active on the public website.' },
          ],
        },
        {
          type: 'mockup',
          html: SCHEDULE_MOCKUP,
          caption: id ? 'Tampilan jadwal — hijau = hari buka dengan jam, abu = hari tutup' : 'Schedule display — green = open day with hours, grey = closed day',
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
            { title: 'Buka menu Area Layanan', desc: 'Klik "Area Layanan" di bagian Layanan pada sidebar kiri.' },
            { title: 'Tambah area baru', desc: 'Klik tombol "Tambah Area" (hijau). Formulir muncul di atas daftar area. Isi nama area (contoh: Seminyak) — slug otomatis terisi.', detail: 'Slug adalah versi URL dari nama: "Kuta Utara" → "kuta-utara". Jangan diubah kecuali perlu.' },
            { title: 'Isi estimasi tiba', desc: 'Masukkan estimasi waktu perjalanan dalam menit dari base ke area tersebut. Contoh: 25 untuk 25 menit. Ini ditampilkan ke pelanggan saat memilih area.' },
            { title: 'Isi biaya tambahan (transport)', desc: 'Masukkan biaya transport dalam Rupiah (angka saja, tanpa "Rp"). Isi 0 untuk gratis. Kosongkan jika tidak relevan.' },
            { title: 'Atur urutan tampil', desc: 'Angka di kolom "Urutan" menentukan posisi di dropdown booking. Angka 1 tampil paling atas, angka besar tampil di bawah.', detail: 'Area dengan urutan kecil lebih mudah ditemukan pelanggan — letakkan area paling populer di atas.' },
            { title: 'Hapus area (hati-hati!)', desc: 'Klik tombol "Hapus" (merah) pada kartu area. Muncul dialog konfirmasi — baca dengan teliti sebelum mengkonfirmasi.', detail: 'Booking yang sudah ada di area ini TIDAK otomatis terhapus, tapi tidak lagi memiliki referensi area.' },
          ] : [
            { title: 'Open Service Areas menu', desc: 'Click "Area Layanan" in the Services section of the left sidebar.' },
            { title: 'Add a new area', desc: 'Click the "Tambah Area" button (green). A form appears above the area list. Fill in the area name (e.g. Seminyak) — slug auto-fills.', detail: 'Slug is the URL version of the name: "Kuta Utara" → "kuta-utara". Don\'t change unless necessary.' },
            { title: 'Fill arrival estimate', desc: 'Enter estimated travel time in minutes from base to the area. Example: 25 for 25 minutes. This is shown to customers when selecting an area.' },
            { title: 'Fill extra fee (transport)', desc: 'Enter transport fee in Rupiah (numbers only, no "Rp"). Enter 0 for free. Leave empty if not applicable.' },
            { title: 'Set display order', desc: 'The "Order" number determines position in the booking dropdown. 1 appears at top, larger numbers appear lower.', detail: 'Areas with small order numbers are easier for customers to find — put most popular areas at top.' },
            { title: 'Delete area (careful!)', desc: 'Click the "Hapus" button (red) on the area card. A confirmation dialog appears — read carefully before confirming.', detail: 'Existing bookings in this area are NOT automatically deleted, but will no longer have an area reference.' },
          ],
        },
        {
          type: 'mockup',
          html: AREA_CARD_MOCKUP,
          caption: id ? 'Kartu area layanan — aktif (batas hijau, teks teal) vs nonaktif (redup, abu-abu)' : 'Service area cards — active (green border, teal text) vs inactive (dimmed, grey)',
        },
        {
          type: 'callout',
          variant: 'danger',
          text: id
            ? 'Hapus area HANYA jika area sudah tidak digunakan sama sekali dan tidak ada booking aktif di area tersebut. Penghapusan TIDAK BISA DIBATALKAN.'
            : 'Delete an area ONLY if it\'s no longer used and has no active bookings. Deletion CANNOT BE UNDONE.',
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
            { title: 'Buka menu FAQ', desc: 'Klik "FAQ" di bagian Konten Website pada sidebar kiri.' },
            { title: 'Tambah FAQ baru', desc: 'Klik "+ Tambah FAQ". Formulir muncul di atas daftar. Isi:\n• Pertanyaan (Bahasa Indonesia & Inggris jika bilingual)\n• Jawaban lengkap yang mudah dipahami pelanggan' },
            { title: 'Atur urutan tampil', desc: 'Ubah angka di kolom "Urutan" — angka lebih kecil tampil lebih dulu di website publik. FAQ terpenting → beri angka kecil (1, 2, 3).', detail: 'Biasanya pertanyaan paling sering ditanya diletakkan di atas.' },
            { title: 'Aktif / Nonaktif', desc: 'Toggle status untuk menyembunyikan FAQ dari publik tanpa menghapusnya. Berguna untuk FAQ musiman atau yang sedang direvisi.' },
            { title: 'Edit atau hapus', desc: 'Klik "Edit" untuk mengubah pertanyaan/jawaban, atau "Hapus" untuk menghapus permanen.' },
          ] : [
            { title: 'Open FAQ menu', desc: 'Click "FAQ" in the Website Content section of the left sidebar.' },
            { title: 'Add a new FAQ', desc: 'Click "+ Tambah FAQ". A form appears above the list. Fill in:\n• Question (Indonesian & English if bilingual)\n• Full answer that\'s easy for customers to understand' },
            { title: 'Set display order', desc: 'Change the "Order" number — smaller numbers appear first on the public website. Most important FAQs → give small numbers (1, 2, 3).', detail: 'Usually most frequently asked questions are placed at top.' },
            { title: 'Active / Inactive', desc: 'Toggle status to hide a FAQ from the public without deleting it. Useful for seasonal FAQs or ones being revised.' },
            { title: 'Edit or delete', desc: 'Click "Edit" to change question/answer, or "Hapus" to permanently delete.' },
          ],
        },
        {
          type: 'mockup',
          html: FAQ_MOCKUP,
          caption: id ? 'Daftar FAQ — aktif (putih), nonaktif (redup). Tombol Edit & Hapus di kanan.' : 'FAQ list — active (white), inactive (dimmed). Edit & Delete buttons on the right.',
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
            { title: 'Buka menu Social Links', desc: 'Klik "Social Links" di bagian Konten Website pada sidebar.' },
            { title: 'Tambah link WhatsApp', desc: 'Pilih platform "WhatsApp", masukkan nomor HP format lokal (08xxx). Sistem otomatis ubah ke format link WA.', detail: 'Contoh input: 081234567890 → link otomatis jadi wa.me/6281234567890' },
            { title: 'Tambah link Instagram', desc: 'Pilih platform "Instagram", masukkan username saja (tanpa @). URL Instagram otomatis dibuat.', detail: 'Contoh: dripstoyou.bali → link jadi instagram.com/dripstoyou.bali' },
            { title: 'Atur urutan tampil', desc: 'Angka "Urutan" menentukan posisi di halaman Kontak publik. Letakkan WA di urutan 1 karena paling sering digunakan.' },
          ] : [
            { title: 'Open Social Links menu', desc: 'Click "Social Links" in the Website Content section of the sidebar.' },
            { title: 'Add WhatsApp link', desc: 'Select "WhatsApp" platform, enter local phone number (08xxx). System automatically converts to WA link format.', detail: 'Example input: 081234567890 → link automatically becomes wa.me/6281234567890' },
            { title: 'Add Instagram link', desc: 'Select "Instagram" platform, enter username only (without @). Instagram URL is auto-generated.', detail: 'Example: dripstoyou.bali → link becomes instagram.com/dripstoyou.bali' },
            { title: 'Set display order', desc: 'The "Order" number determines position on the public Contact page. Put WA at order 1 as it\'s most frequently used.' },
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
            { title: 'Nomor WhatsApp Utama', desc: 'Masukkan nomor WA bisnis tanpa tanda + atau spasi, dimulai angka 62 (kode Indonesia). Nomor ini digunakan untuk tombol "Pesan via WA" di website.', detail: 'Format benar: 6281234567890 (bukan 081234... atau +6281234...)' },
            { title: 'Email Bisnis', desc: 'Email yang bisa dihubungi pelanggan. Ditampilkan di halaman Kontak website.' },
            { title: 'Nama Situs', desc: 'Nama bisnis yang muncul di browser tab, SEO, dan beberapa bagian website.' },
            { title: 'Klik "Simpan Pengaturan"', desc: 'Perubahan langsung aktif setelah disimpan.' },
          ] : [
            { title: 'Open General Settings', desc: 'Click "General Settings" in the Settings section of the sidebar.' },
            { title: 'Main WhatsApp Number', desc: 'Enter WA business number without + sign or spaces, starting with 62 (Indonesia code). This number is used for the "Order via WA" button on the website.', detail: 'Correct format: 6281234567890 (not 081234... or +6281234...)' },
            { title: 'Business Email', desc: 'Email customers can contact. Displayed on the website Contact page.' },
            { title: 'Site Name', desc: 'Business name shown in browser tab, SEO, and various parts of website.' },
            { title: 'Click "Simpan Pengaturan"', desc: 'Changes take effect immediately after saving.' },
          ],
        },
        {
          type: 'mockup',
          html: SETTINGS_MOCKUP,
          caption: id ? 'Formulir pengaturan — nomor WA format 62xxx di atas, nama situs di bawah' : 'Settings form — WA number in 62xxx format above, site name below',
        },
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Menu "WhatsApp Template" di sidebar memungkinkan Anda mengustomisasi pesan otomatis yang dikirim ke pelanggan setelah booking. Lihat bagian Panduan WhatsApp Template di bawah.'
            : '"WhatsApp Template" menu in the sidebar lets you customize the automatic message sent to customers after booking. See the WhatsApp Template Guide section below.',
        },
      ],
    },
    {
      id: 'wa-template',
      icon: '💬',
      title: id ? 'WhatsApp Template' : 'WhatsApp Template',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'WhatsApp Template adalah pesan konfirmasi yang secara otomatis dibuat saat admin klik "Kirim WA" di halaman detail booking. Anda bisa mengustomisasi teksnya agar sesuai dengan gaya komunikasi bisnis Anda.'
            : 'WhatsApp Template is the confirmation message automatically created when admin clicks "Kirim WA" on the booking detail page. You can customize the text to match your business communication style.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu WhatsApp Template', desc: 'Klik "WhatsApp Template" di bagian Pengaturan pada sidebar (di bawah Pengaturan Umum).' },
            { title: 'Edit template pesan', desc: 'Ubah teks pesan sesuai kebutuhan. Gunakan variabel placeholder yang tersedia untuk menyisipkan data booking otomatis.' },
            { title: 'Gunakan variabel placeholder', desc: 'Variabel ditandai dengan {kurung_kurawal}. Saat dikirim, variabel otomatis diganti dengan data aktual dari booking.', detail: '{nama_pelanggan} = nama pelanggan, {kode_booking} = DTY-042, {tanggal} = tanggal booking, {waktu} = jam booking, {area} = area layanan' },
            { title: 'Simpan dan test', desc: 'Klik Simpan, lalu buka halaman detail booking mana saja dan klik "Kirim WA" untuk melihat preview pesan yang akan dikirim.' },
          ] : [
            { title: 'Open WhatsApp Template menu', desc: 'Click "WhatsApp Template" in the Settings section of the sidebar (below General Settings).' },
            { title: 'Edit message template', desc: 'Change the message text as needed. Use the available placeholder variables to insert booking data automatically.' },
            { title: 'Use placeholder variables', desc: 'Variables are marked with {curly_braces}. When sent, variables are automatically replaced with actual booking data.', detail: '{nama_pelanggan} = customer name, {kode_booking} = DTY-042, {tanggal} = booking date, {waktu} = booking time, {area} = service area' },
            { title: 'Save and test', desc: 'Click Save, then open any booking detail page and click "Kirim WA" to see a preview of the message that will be sent.' },
          ],
        },
        {
          type: 'mockup',
          html: WA_TEMPLATE_MOCKUP,
          caption: id ? 'Editor template WA — teks bisa diedit, variabel {biru} otomatis diganti data booking' : 'WA template editor — text is editable, {blue} variables automatically replaced with booking data',
        },
      ],
    },
    {
      id: 'users',
      icon: '👥',
      title: id ? 'Manajemen Admin (Khusus SUPER ADMIN)' : 'Admin Management (SUPER ADMIN Only)',
      badge: 'SUPER_ADMIN',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Halaman ini untuk menambah, mengedit, dan menonaktifkan akun admin. Hanya SUPER_ADMIN yang bisa mengakses halaman ini. Role yang ditentukan saat membuat akun menentukan apa yang bisa dilakukan admin tersebut.'
            : 'This page is for adding, editing, and deactivating admin accounts. Only SUPER_ADMIN can access this page. The role set when creating an account determines what that admin can do.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Manajemen Admin', desc: 'Klik "Manajemen Admin" di bagian Pengaturan pada sidebar (hanya muncul untuk SUPER_ADMIN).' },
            { title: 'Tambah admin baru', desc: 'Klik "Tambah Admin". Isi nama, email, password (min 8 karakter), dan pilih role yang tepat.' },
            { title: 'Pilih role yang tepat', desc: '• SUPER_ADMIN: akses penuh ke semua fitur\n• Admin Operasional: kelola booking, jadwal, area. Tidak bisa export data atau kelola treatment\n• Content Admin: kelola produk/treatment dan FAQ/konten. Tidak bisa lihat booking', detail: 'Pilih role sekecil mungkin yang dibutuhkan — prinsip "least privilege".' },
            { title: 'Nonaktifkan admin', desc: 'Klik tombol "Nonaktif" pada kartu admin. Akun dinonaktifkan (tidak bisa login) tapi tidak dihapus dari database.', detail: 'Gunakan nonaktif daripada hapus, supaya riwayat audit tetap terjaga.' },
            { title: 'Edit atau reset password', desc: 'Klik "Edit" pada kartu admin. Isi kolom password baru jika ingin reset password, atau kosongkan jika hanya ingin ubah info lainnya.' },
          ] : [
            { title: 'Open Admin Management menu', desc: 'Click "Manajemen Admin" in the Settings section of the sidebar (only visible to SUPER_ADMIN).' },
            { title: 'Add a new admin', desc: 'Click "Tambah Admin". Fill in name, email, password (min 8 characters), and select the appropriate role.' },
            { title: 'Choose the right role', desc: '• SUPER_ADMIN: full access to all features\n• Admin Operasional: manage bookings, schedule, areas. Cannot export data or manage treatments\n• Content Admin: manage products/treatments and FAQ/content. Cannot view bookings', detail: 'Choose the smallest role needed — "least privilege" principle.' },
            { title: 'Deactivate admin', desc: 'Click "Nonaktif" on the admin card. Account is deactivated (cannot login) but not deleted from database.', detail: 'Use deactivate instead of delete, so audit history is preserved.' },
            { title: 'Edit or reset password', desc: 'Click "Edit" on the admin card. Fill in a new password field to reset, or leave empty to only change other info.' },
          ],
        },
        {
          type: 'mockup',
          html: USERS_MOCKUP,
          caption: id ? 'Daftar admin — avatar warna sesuai role, badge role di samping nama, tombol aksi di kanan' : 'Admin list — avatar color by role, role badge next to name, action buttons on right',
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
            ? 'Admin panel menggunakan 3 level hak akses. Role ditentukan saat akun dibuat dan hanya bisa diubah oleh SUPER_ADMIN.'
            : 'The admin panel uses 3 access levels. Role is set when the account is created and can only be changed by SUPER_ADMIN.',
        },
        {
          type: 'table',
          headers: id
            ? ['Fitur', 'Super Admin', 'Admin Operasional', 'Content Admin']
            : ['Feature', 'Super Admin', 'Admin Operasional', 'Content Admin'],
          rows: id ? [
            ['Lihat & kelola booking', '✅', '✅', '❌'],
            ['Hapus booking', '✅', '❌', '❌'],
            ['Export data booking', '✅', '❌', '❌'],
            ['Kelola jadwal & area', '✅', '✅', '❌'],
            ['Kelola treatment/produk', '✅', '✅ (lihat)', '✅'],
            ['Kelola FAQ & konten', '✅', '❌', '✅'],
            ['Pengaturan & WA Template', '✅', '❌', '❌'],
            ['Manajemen admin', '✅', '❌', '❌'],
          ] : [
            ['View & manage bookings', '✅', '✅', '❌'],
            ['Delete bookings', '✅', '❌', '❌'],
            ['Export booking data', '✅', '❌', '❌'],
            ['Manage schedule & areas', '✅', '✅', '❌'],
            ['Manage treatments/products', '✅', '✅ (view)', '✅'],
            ['Manage FAQ & content', '✅', '❌', '✅'],
            ['Settings & WA Template', '✅', '❌', '❌'],
            ['Admin management', '✅', '❌', '❌'],
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
            ? 'Aturan keamanan WAJIB diikuti oleh semua admin:\n\n🔐 Jangan pernah share password ke siapapun — termasuk tim sendiri\n📵 Selalu logout setelah selesai, terutama di HP/komputer bersama\n📸 Jangan screenshot halaman yang menampilkan data pribadi pelanggan (HP, alamat)\n🚨 Laporkan ke SUPER_ADMIN jika ada akses mencurigakan atau login yang tidak dikenal'
            : 'Security rules MUST be followed by all admins:\n\n🔐 Never share your password with anyone — including your own team\n📵 Always log out when done, especially on shared phones/computers\n📸 Do not screenshot pages showing personal customer data (phone, address)\n🚨 Report to SUPER_ADMIN if there is suspicious access or unknown login',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Data pelanggan dienkripsi', desc: 'Nomor HP, alamat, dan catatan pelanggan tersimpan terenkripsi di database. Hanya admin yang login yang bisa melihat data aslinya.', detail: 'Data ini TIDAK boleh difoto, di-screenshot, atau dibagikan tanpa izin pelanggan.' },
            { title: 'Session otomatis expire', desc: 'Jika tidak ada aktivitas terlalu lama, session akan otomatis expire dan Anda diarahkan ke halaman login. Ini normal dan merupakan fitur keamanan.' },
            { title: 'Batas percobaan login', desc: 'Login dibatasi 5 percobaan per 15 menit. Jika terkunci, tunggu 15 menit atau hubungi SUPER_ADMIN untuk reset.' },
            { title: 'Semua aksi dicatat (Audit Log)', desc: 'SETIAP tindakan admin dicatat otomatis: login, logout, ubah status booking, tambah produk, hapus data, dll. Catatan ini tidak bisa dihapus dan digunakan untuk keamanan.', detail: 'Audit log bisa dilihat oleh SUPER_ADMIN sebagai bukti jika terjadi insiden.' },
          ] : [
            { title: 'Customer data is encrypted', desc: 'Customer phone numbers, addresses, and notes are stored encrypted in the database. Only logged-in admins can see the actual data.', detail: 'This data MUST NOT be photographed, screenshotted, or shared without customer permission.' },
            { title: 'Session auto-expires', desc: 'If there\'s no activity for too long, the session auto-expires and you\'re redirected to the login page. This is normal and a security feature.' },
            { title: 'Login attempt limit', desc: 'Login is limited to 5 attempts per 15 minutes. If locked, wait 15 minutes or contact SUPER_ADMIN to reset.' },
            { title: 'All actions logged (Audit Log)', desc: 'EVERY admin action is automatically logged: login, logout, booking status changes, product additions, data deletion, etc. These records cannot be deleted and are used for security.', detail: 'Audit log can be viewed by SUPER_ADMIN as evidence if an incident occurs.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'Jika Anda melupakan password, hubungi SUPER_ADMIN — password tidak bisa dipulihkan sendiri dari dalam panel. SUPER_ADMIN bisa mengatur ulang password Anda melalui menu Manajemen Admin.'
            : 'If you forget your password, contact SUPER_ADMIN — password cannot be recovered from within the panel yourself. SUPER_ADMIN can reset your password via the Admin Management menu.',
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
          <span style={{ fontSize: 15, flexShrink: 0 }}>{s.icon}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
          {s.badge && (
            <span style={{ marginLeft: 'auto', background: '#fff4ce', color: '#8a5b00', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, flexShrink: 0 }}>
              SA
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

/* ── Mobile TOC dropdown ── */
function MobileTOC({ sections, activeId, onNav }: { sections: Section[]; activeId: string; onNav: (id: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <select
        value={activeId}
        onChange={e => onNav(e.target.value)}
        style={{
          width: '100%', height: 42, padding: '0 12px',
          border: '1.5px solid rgba(32,82,81,.2)', borderRadius: 10,
          background: 'white', color: 'var(--teal)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {sections.map(s => (
          <option key={s.id} value={s.id}>
            {s.icon} {s.title}{s.badge ? ' ★' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Main component ── */
export default function GuideContent() {
  const { lang } = useAdminLang();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('dashboard');
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
    ? 'Comprehensive visual guide for the Drips To You Bali admin panel.'
    : 'Panduan visual lengkap penggunaan admin panel Drips To You Bali.';

  return (
    <div className="admin-page wide">
      <div className="admin-page-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="admin-title">{title}</h1>
          <p className="admin-subtitle">{subtitle}</p>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 14 }}>🔍</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'en' ? 'Search guide...' : 'Cari panduan...'}
            style={{
              height: 40, paddingLeft: 34, paddingRight: 12, border: '1.5px solid rgba(32,82,81,.16)',
              borderRadius: 10, fontSize: 14, width: 'min(220px, 100%)',
            }}
          />
        </div>
      </div>

      {/* Mobile TOC — shown only on small screens via CSS */}
      <div className="guide-mobile-toc">
        <MobileTOC sections={allSections} activeId={activeId} onNav={scrollTo} />
      </div>

      <div className="guide-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>
        {/* TOC sidebar — hidden on mobile via CSS */}
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
                borderRadius: 18, padding: '24px 26px',
                boxShadow: '0 4px 18px rgba(32,82,81,.05)',
              }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid #f0ede8' }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{section.icon}</span>
                  <h2 style={{
                    fontFamily: 'var(--font-playfair,Georgia,serif)',
                    fontSize: 19, fontWeight: 700, color: 'var(--teal)', flex: 1, minWidth: 0,
                  }}>
                    {section.title}
                  </h2>
                  {section.badge && (
                    <span style={{ background: '#fff4ce', color: '#8a5b00', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, border: '1px solid #fcd34d', whiteSpace: 'nowrap', flexShrink: 0 }}>
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

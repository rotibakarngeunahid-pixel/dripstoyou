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
      display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0,
    }}>
      <span style={{ flexShrink: 0, fontSize: 18 }}>{s.icon}</span>
      <span style={{ whiteSpace: 'pre-line', overflowWrap: 'break-word', minWidth: 0, flex: 1 }}>{text}</span>
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
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1a1a1a', marginBottom: 4, overflowWrap: 'break-word' }}>{step.title}</div>
            <div style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65, overflowWrap: 'break-word', whiteSpace: 'pre-line' }}>{step.desc}</div>
            {step.detail && (
              <div style={{
                marginTop: 8, padding: '8px 12px',
                background: '#f0f9ff', borderLeft: '3px solid var(--ocean)',
                fontSize: 12.5, color: '#1e6f8c', borderRadius: '0 6px 6px 0',
                lineHeight: 1.55, overflowWrap: 'break-word',
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
    <div style={{ border: '1px solid rgba(32,82,81,0.12)', borderRadius: 14, overflow: 'hidden', width: '100%', minWidth: 0 }}>
      <div style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e4da', padding: '8px 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>Admin Blog — Tampilan</span>
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

function flowStep(num: string, label: string, bg: string, shadow: string) {
  return `
  <div style="width:100%;max-width:360px;background:${bg};color:white;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 14px ${shadow}">
    <span style="background:rgba(255,255,255,.22);border-radius:8px;padding:3px 9px;font-size:11px;font-weight:800;flex-shrink:0">${num}</span>
    <span style="font-size:13px;font-weight:700">${label}</span>
  </div>`;
}

const WORKFLOW_MOCKUP_ID = `
<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
  ${flowStep('01', 'Buka Menu Blog', '#205251', 'rgba(32,82,81,.25)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('02', 'Klik "Tulis Artikel"', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('03', 'Isi Judul, Isi Artikel & Cover', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('04', 'Lengkapi Panel SEO', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('05', 'Pratinjau ↗', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('06', 'Ubah Status ke "Tayang" & Simpan', '#c9944c', 'rgba(201,148,76,.28)')}
  <span style="color:#aaa;font-size:18px;line-height:1;margin:2px 0">↺</span>
  <div style="width:100%;max-width:360px;background:#f0f9f8;border:1.5px dashed rgba(32,82,81,.3);color:#205251;border-radius:12px;padding:10px 16px;font-size:12px;font-weight:600;text-align:center">
    📊 Pantau performanya di menu Analytics
  </div>
</div>`;

const WORKFLOW_MOCKUP_EN = `
<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
  ${flowStep('01', 'Open the Blog Menu', '#205251', 'rgba(32,82,81,.25)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('02', 'Click "Write Article"', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('03', 'Fill Title, Body & Cover', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('04', 'Complete the SEO Panel', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('05', 'Preview ↗', '#29808b', 'rgba(41,128,139,.22)')}
  <span style="color:#c9944c;font-size:18px;line-height:1;margin:2px 0">↓</span>
  ${flowStep('06', 'Set Status to "Published" & Save', '#c9944c', 'rgba(201,148,76,.28)')}
  <span style="color:#aaa;font-size:18px;line-height:1;margin:2px 0">↺</span>
  <div style="width:100%;max-width:360px;background:#f0f9f8;border:1.5px dashed rgba(32,82,81,.3);color:#205251;border-radius:12px;padding:10px 16px;font-size:12px;font-weight:600;text-align:center">
    📊 Track its performance in the Analytics menu
  </div>
</div>`;

function articleCardMockup(id: boolean) {
  return `
<div style="background:white;border:1px solid rgba(32,82,81,.09);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px">
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
    <strong style="font-size:14px;color:#1a1a1a">5 Manfaat IV Therapy untuk Imun Tubuh</strong>
    <span style="background:rgba(27,143,77,.12);color:#1b8f4d;font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px;white-space:nowrap">${id ? 'Tayang' : 'Published'}</span>
    <span style="background:rgba(41,128,139,.10);color:#29808b;font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px;white-space:nowrap">Wellness</span>
  </div>
  <p style="font-size:12px;color:#666;line-height:1.6;margin:0">${id ? 'Kenali manfaat IV drip untuk mendukung daya tahan tubuh, kapan waktu terbaik, dan apa yang perlu disiapkan sebelum sesi…' : 'Learn how IV drips can help support your immune system, the best timing, and what to prepare before a session…'}</p>
  <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#999">
    <span>/blog/5-manfaat-iv-therapy-imun</span>
    <span>${id ? 'Tayang' : 'Published'}: 20 Jul 2026</span>
    <span>${id ? 'Diperbarui' : 'Updated'}: 24 Jul 2026</span>
    <span>4 ${id ? 'menit baca' : 'min read'}</span>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid #f0ede8;padding-top:10px;margin-top:2px">
    <button style="padding:5px 10px;font-size:10px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">${id ? 'Tarik dari Publik' : 'Unpublish'}</button>
    <button style="padding:5px 10px;font-size:10px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">${id ? 'Lihat di situs' : 'View on site'}</button>
    <button style="padding:5px 10px;font-size:10px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">Edit</button>
    <button style="padding:5px 10px;font-size:10px;border:1px solid rgba(32,82,81,.2);border-radius:6px;background:white;cursor:pointer">${id ? 'Lihat Analytics' : 'View Analytics'}</button>
  </div>
</div>`;
}

function titleSlugMockup(id: boolean) {
  return `
<div style="display:flex;flex-direction:column;gap:16px">
  <div>
    <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">${id ? 'Judul Artikel *' : 'Article Title *'}</label>
    <input readonly value="5 Manfaat IV Therapy untuk Imun Tubuh" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:9px 12px;font-size:13px;box-sizing:border-box"/>
  </div>
  <div>
    <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">${id ? 'Slug URL *' : 'URL Slug *'}</label>
    <input readonly value="5-manfaat-iv-therapy-imun-tubuh" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:9px 12px;font-size:13px;box-sizing:border-box;color:#333"/>
    <div style="font-size:11px;color:#aaa;margin-top:4px">dripstoyou.com/blog/5-manfaat-iv-therapy-imun-tubuh</div>
  </div>
  <div>
    <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">${id ? 'Slug (setelah pernah tayang)' : 'Slug (after it has ever been published)'}</label>
    <input readonly disabled value="5-manfaat-iv-therapy-imun-tubuh" style="width:100%;border:1px solid #eee;border-radius:8px;padding:9px 12px;font-size:13px;box-sizing:border-box;background:#f7f7f5;color:#999"/>
    <div style="font-size:11px;color:#b8860b;margin-top:4px">🔒 ${id ? 'Terkunci — tidak bisa diubah lagi' : 'Locked — can no longer be changed'}</div>
  </div>
</div>`;
}

function editorToolbarMockup() {
  const btn = (label: string) => `<span style="width:28px;height:28px;border:1px solid #e5e2da;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#444;background:white">${label}</span>`;
  return `
<div style="display:flex;flex-direction:column;gap:12px">
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:5px;background:#fafaf8;border:1px solid #eee;border-radius:10px;padding:8px">
    <select disabled style="height:28px;border:1px solid #e5e2da;border-radius:6px;font-size:11px;color:#444;padding:0 6px">
      <option>Judul 1</option>
    </select>
    <span style="width:1px;height:20px;background:#e5e2da;margin:0 3px"></span>
    ${btn('<b>B</b>')}${btn('<i>I</i>')}${btn('⬅')}${btn('⬛')}${btn('➡')}${btn('☰')}${btn('•')}${btn('1.')}${btn('&ldquo;')}${btn('&lt;/&gt;')}${btn('🔗')}${btn('⛔🔗')}${btn('🖼')}${btn('➖')}${btn('🧹')}${btn('↶')}${btn('↷')}
    <span style="margin-left:auto;font-size:10px;font-weight:700;color:#29808b;border:1px solid rgba(41,128,139,.3);border-radius:999px;padding:4px 10px;white-space:nowrap">Mode Markdown</span>
  </div>
  <div class="blog-prose" style="border:1px solid #eee;border-radius:10px;padding:14px;font-size:13px;color:#333;line-height:1.7">
    <h4 style="margin:0 0 8px;color:#205251;font-family:Georgia,serif">Kenapa Hidrasi Penting?</h4>
    <p style="margin:0">Tubuh yang cukup terhidrasi <strong>membantu mendukung pemulihan</strong> lebih optimal setelah aktivitas padat…</p>
  </div>
</div>`;
}

function coverUploadMockup(id: boolean) {
  return `
<div style="display:flex;flex-direction:column;gap:16px">
  <div style="border:2px dashed rgba(32,82,81,.25);border-radius:14px;padding:22px;text-align:center;background:#fafaf8">
    <div style="font-size:22px;margin-bottom:6px">🖼️</div>
    <div style="font-size:13px;font-weight:700;color:#205251;margin-bottom:4px">${id ? 'Pilih Gambar' : 'Choose Image'}</div>
    <div style="font-size:11px;color:#999">JPG, PNG, WEBP · ${id ? 'Maks. 5 MB · Rasio 1:1 disarankan' : 'Max. 5 MB · 1:1 ratio recommended'}</div>
  </div>
  <div style="display:flex;align-items:center;gap:12px">
    <div style="width:64px;height:64px;border-radius:10px;background:linear-gradient(135deg,#8ebfbf,#29808b);flex-shrink:0"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button style="padding:6px 12px;font-size:11px;border:1px solid rgba(32,82,81,.2);border-radius:7px;background:white;cursor:pointer">${id ? 'Ganti Foto' : 'Change Photo'}</button>
      <button style="padding:6px 12px;font-size:11px;border:none;border-radius:7px;background:#fee2e2;color:#dc2626;cursor:pointer">${id ? 'Hapus Foto' : 'Remove Photo'}</button>
    </div>
  </div>
  <div>
    <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">${id ? 'Alt Text Cover *' : 'Cover Alt Text *'}</label>
    <input readonly value="${id ? 'Botol infus IV therapy siap pakai di atas nampan medis steril' : 'IV therapy drip bag ready on a sterile medical tray'}" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:9px 12px;font-size:12.5px;box-sizing:border-box"/>
  </div>
</div>`;
}

function seoPanelMockup(id: boolean) {
  return `
<div style="display:flex;flex-direction:column;gap:14px">
  <div>
    <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">Meta Title</label>
    <input readonly value="5 Manfaat IV Therapy untuk Imun Tubuh | Drips To You - Bali" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:8px 10px;font-size:12px;box-sizing:border-box"/>
    <div style="font-size:10px;color:#999;margin-top:3px">58/60 ${id ? 'karakter' : 'characters'}</div>
  </div>
  <div>
    <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">Meta Description</label>
    <textarea readonly rows="2" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:8px 10px;font-size:12px;box-sizing:border-box;resize:none">${id ? 'Kenali manfaat IV drip untuk imun tubuh, kapan waktu terbaik menjalaninya, dan persiapan sebelum sesi di Bali.' : 'Learn the benefits of IV drips for immune support, the best timing, and how to prepare for a session in Bali.'}</textarea>
    <div style="font-size:10px;color:#999;margin-top:3px">124/160 ${id ? 'karakter' : 'characters'}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
    <div>
      <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">Canonical URL</label>
      <input readonly placeholder="https://dripstoyou.com/blog/…" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:8px 10px;font-size:12px;box-sizing:border-box;color:#aaa"/>
    </div>
    <div>
      <label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;display:block;margin-bottom:4px">OG Image URL</label>
      <input readonly placeholder="https://…" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:8px 10px;font-size:12px;box-sizing:border-box;color:#aaa"/>
    </div>
  </div>
</div>`;
}

function statusLifecycleMockup(id: boolean) {
  return `
<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:14px;background:#fafaf8;border-radius:10px">
  <span style="background:rgba(201,148,76,.16);color:#8a5b00;border:1.5px solid #f7d77a;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">📝 ${id ? 'DRAFT' : 'DRAFT'}</span>
  <span style="color:#aaa;font-size:18px;font-weight:300">→</span>
  <span style="background:rgba(27,143,77,.12);color:#1b8f4d;border:1.5px solid #86efac;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">🌐 ${id ? 'TAYANG' : 'PUBLISHED'}</span>
  <span style="color:#aaa;font-size:18px;font-weight:300">→</span>
  <span style="background:rgba(107,114,128,.14);color:#4b5563;border:1.5px solid #d1d5db;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">📦 ${id ? 'ARSIP' : 'ARCHIVED'}</span>
  <div style="width:100%;margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <span style="font-size:12px;color:#aaa">${id ? 'Dari halaman Edit, bisa juga:' : 'From the Edit page, can also go to:'}</span>
    <span style="background:#fff0ed;color:#b33223;border:1.5px solid #f2b8ae;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800">🗑️ ${id ? 'DIHAPUS PERMANEN' : 'PERMANENTLY DELETED'}</span>
  </div>
</div>`;
}

function previewMockup(id: boolean) {
  return `
<article style="background:white">
  <span style="background:rgba(41,128,139,.10);color:#29808b;font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px">Wellness</span>
  <h4 style="font-family:Georgia,serif;color:#205251;font-size:18px;margin:10px 0 6px">5 Manfaat IV Therapy untuk Imun Tubuh</h4>
  <div style="display:flex;gap:12px;font-size:11px;color:#999;margin-bottom:12px">
    <span>Drips To You - Bali</span><span>4 ${id ? 'menit baca' : 'min read'}</span>
  </div>
  <div style="width:100%;height:110px;border-radius:10px;background:linear-gradient(135deg,#8ebfbf,#29808b);margin-bottom:12px"></div>
  <p style="font-size:12.5px;color:#444;line-height:1.7;margin:0">${id ? 'Tubuh yang cukup terhidrasi membantu mendukung pemulihan lebih optimal setelah aktivitas padat…' : 'A well-hydrated body helps support better recovery after a busy schedule…'}</p>
</article>`;
}

function analyticsKpiMockup(id: boolean) {
  const card = (tone: string, label: string, value: string, sub: string) => `
    <div style="flex:1;min-width:130px;background:white;border:1.5px solid ${tone};border-top:4px solid ${tone};border-radius:14px;padding:14px">
      <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:6px">${label}</div>
      <div style="font-size:22px;font-weight:800;color:#205251">${value}</div>
      <div style="font-size:10.5px;color:#999;margin-top:4px">${sub}</div>
    </div>`;
  return `
<div style="display:flex;flex-wrap:wrap;gap:10px">
  ${card('#205251', id ? 'Total Views' : 'Total Views', '2.480', `${id ? 'Views Hari Ini' : 'Views Today'}: 34`)}
  ${card('#29808b', id ? 'Unique Visitors' : 'Unique Visitors', '1.120', `↑ 12.4% ${id ? 'dibanding periode lalu' : 'vs previous period'}`)}
  ${card('#c9944c', id ? 'Total Interaksi' : 'Total Interactions', '312', id ? 'Klik CTA & tautan artikel' : 'CTA & in-article link clicks')}
  ${card('#205251', id ? 'Artikel Terbaik' : 'Top Article', '5 Manfaat IV…', '860 views')}
</div>`;
}

function analyticsTableMockup(id: boolean) {
  return `
<div style="display:flex;flex-direction:column;gap:10px">
  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
    <div style="flex:1;min-width:160px;display:flex;align-items:center;gap:6px;border:1px solid #ddd;border-radius:8px;padding:6px 10px;background:white">
      <span style="font-size:12px;color:#aaa">🔍</span>
      <span style="font-size:12px;color:#aaa">${id ? 'Cari judul artikel…' : 'Search article title…'}</span>
    </div>
    <select disabled style="height:32px;border:1px solid #ddd;border-radius:8px;font-size:11px;color:#444;padding:0 8px">
      <option>${id ? 'Terbanyak Dilihat' : 'Most Viewed'}</option>
    </select>
  </div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11px;min-width:520px">
      <thead>
        <tr style="background:#d6eaea">
          <th style="padding:7px 10px;text-align:left;color:#205251">${id ? 'Artikel' : 'Article'}</th>
          <th style="padding:7px 10px;text-align:left;color:#205251">Status</th>
          <th style="padding:7px 10px;text-align:left;color:#205251">Views</th>
          <th style="padding:7px 10px;text-align:left;color:#205251">Visitors</th>
          <th style="padding:7px 10px;text-align:left;color:#205251">${id ? 'Klik' : 'Clicks'}</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-top:1px solid #f0ede8"><td style="padding:7px 10px;color:#29808b">5 Manfaat IV Therapy…</td><td style="padding:7px 10px">${id ? 'Tayang' : 'Published'}</td><td style="padding:7px 10px">860</td><td style="padding:7px 10px">410</td><td style="padding:7px 10px">52</td></tr>
        <tr style="border-top:1px solid #f0ede8"><td style="padding:7px 10px;color:#29808b">Panduan Sebelum Booking…</td><td style="padding:7px 10px">${id ? 'Tayang' : 'Published'}</td><td style="padding:7px 10px">610</td><td style="padding:7px 10px">305</td><td style="padding:7px 10px">30</td></tr>
      </tbody>
    </table>
  </div>
</div>`;
}

function breakdownMockup(id: boolean) {
  const bar = (label: string, pct: number) => `
    <li style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#444;margin-bottom:3px"><span>${label}</span><span>${pct}%</span></div>
      <div style="height:6px;border-radius:999px;background:#eee"><div style="height:100%;width:${pct}%;border-radius:999px;background:#29808b"></div></div>
    </li>`;
  return `
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
  <div>
    <div style="font-size:11px;font-weight:700;color:#205251;margin-bottom:8px">${id ? 'Perangkat' : 'Device'}</div>
    <ul style="list-style:none;padding:0;margin:0">${bar(id ? 'Mobile' : 'Mobile', 64)}${bar('Desktop', 36)}</ul>
  </div>
  <div>
    <div style="font-size:11px;font-weight:700;color:#205251;margin-bottom:8px">Browser</div>
    <ul style="list-style:none;padding:0;margin:0">${bar('Chrome', 58)}${bar('Safari', 31)}${bar(id ? 'Lainnya' : 'Other', 11)}</ul>
  </div>
</div>`;
}

/* ── Content ── */
function buildSections(lang: 'id' | 'en'): Section[] {
  const id = lang === 'id';
  return [
    {
      id: 'intro',
      icon: '🚀',
      title: id ? 'Pengenalan Admin Blog' : 'Introduction to Admin Blog',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Admin Blog adalah tempat mengelola artikel edukasi & SEO untuk dripstoyou.com — mulai dari menulis, mengatur kategori, sampai memantau performanya di Analytics. Halaman ini muncul di sidebar untuk akun dengan akses modul "Blog" (secara default: SUPER_ADMIN dan Content Admin, atau admin lain yang diberi izin khusus lewat Kelola Izin).'
            : 'Admin Blog is where you manage educational & SEO articles for dripstoyou.com — from writing, organizing categories, to tracking performance in Analytics. This menu appears in the sidebar for accounts with access to the "Blog" module (by default: SUPER_ADMIN and Content Admin, or other admins granted custom access via Kelola Izin).',
        },
        {
          type: 'mockup',
          html: id ? WORKFLOW_MOCKUP_ID : WORKFLOW_MOCKUP_EN,
          caption: id ? 'Alur kerja utama Admin Blog, dari menulis sampai tayang' : 'Main Admin Blog workflow, from writing to publishing',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: id
            ? 'Panduan ini HANYA membahas fitur Admin Blog (artikel, kategori, Analytics). Untuk booking, treatment, jadwal, atau pengaturan lain, hubungi SUPER_ADMIN — menu tersebut memiliki panduannya sendiri di luar cakupan halaman ini.'
            : 'This guide ONLY covers Admin Blog features (articles, categories, Analytics). For bookings, treatments, schedule, or other settings, contact SUPER_ADMIN — those menus have their own guidance outside the scope of this page.',
        },
      ],
    },
    {
      id: 'list',
      icon: '📋',
      title: id ? 'Melihat Daftar Artikel' : 'Viewing the Article List',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Blog', desc: 'Klik "Blog" di bagian Konten Website pada sidebar kiri. Halaman ini menampilkan semua artikel — draft, tayang, maupun arsip.' },
            { title: 'Filter berdasarkan status', desc: 'Gunakan dropdown "Status" untuk menyaring: Semua status, Draft, Tayang, atau Arsip.' },
            { title: 'Filter berdasarkan kategori', desc: 'Gunakan dropdown "Kategori" untuk menampilkan artikel dari satu kategori saja.' },
            { title: 'Cari artikel', desc: 'Ketik di kotak pencarian untuk mencari berdasarkan judul atau slug — hasil langsung muncul tanpa perlu menekan Enter.' },
            { title: 'Baca info tiap kartu artikel', desc: 'Setiap kartu menampilkan: judul, badge status, badge kategori (bila ada), ringkasan (excerpt), URL slug, tanggal tayang, tanggal diperbarui, dan estimasi menit baca.' },
          ] : [
            { title: 'Open the Blog menu', desc: 'Click "Blog" in the Website Content section of the left sidebar. This page lists every article — draft, published, or archived.' },
            { title: 'Filter by status', desc: 'Use the "Status" dropdown to filter: All statuses, Draft, Published, or Archived.' },
            { title: 'Filter by category', desc: 'Use the "Category" dropdown to show articles from a single category only.' },
            { title: 'Search articles', desc: 'Type in the search box to search by title or slug — results appear instantly, no need to press Enter.' },
            { title: 'Read each article card', desc: 'Each card shows: title, status badge, category badge (if any), excerpt, URL slug, publish date, last updated date, and estimated reading time.' },
          ],
        },
        {
          type: 'mockup',
          html: articleCardMockup(id),
          caption: id ? 'Kartu artikel di daftar Blog — badge status & kategori di atas, tombol aksi di bawah' : 'Article card in the Blog list — status & category badges above, action buttons below',
        },
      ],
    },
    {
      id: 'create',
      icon: '➕',
      title: id ? 'Membuat Artikel Baru' : 'Creating a New Article',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Klik "Tulis Artikel"', desc: 'Tombol biru di kanan atas halaman Blog. Akan membuka halaman "Tulis Artikel Baru" dengan formulir kosong.', detail: 'Artikel baru otomatis berstatus Draft — belum tampil ke publik sampai Anda ubah statusnya jadi Tayang.' },
            { title: 'Isi formulir dari atas ke bawah', desc: 'Lihat bagian "Penjelasan Field Formulir" dan "Menggunakan Editor Artikel" di bawah untuk detail tiap kolom.' },
            { title: 'Simpan', desc: 'Klik tombol "Buat Artikel" di bagian bawah formulir. Setelah berhasil, Anda otomatis kembali ke daftar Blog.' },
          ] : [
            { title: 'Click "Write Article"', desc: 'The blue button at the top right of the Blog page. Opens the "New Article" page with an empty form.', detail: 'A new article always starts as Draft — invisible to the public until you change its status to Published.' },
            { title: 'Fill the form top to bottom', desc: 'See the "Form Field Reference" and "Using the Article Editor" sections below for details on each field.' },
            { title: 'Save', desc: 'Click the "Buat Artikel" button at the bottom of the form. On success you\'re taken back to the Blog list automatically.' },
          ],
        },
      ],
    },
    {
      id: 'fields',
      icon: '📝',
      title: id ? 'Penjelasan Field Formulir Artikel' : 'Article Form Field Reference',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Judul Artikel *', desc: 'Judul lengkap artikel, maksimal 200 karakter. Wajib diisi — ini yang tampil sebagai H1 di halaman publik.' },
            { title: 'Slug URL *', desc: 'Bagian akhir dari alamat artikel (dripstoyou.com/blog/slug-ini). Terisi otomatis dari Judul, tapi bisa diedit manual sebelum artikel pernah tayang.', detail: 'Setelah artikel PERNAH berstatus Tayang, slug otomatis TERKUNCI permanen dan tidak bisa diubah lagi — ini mencegah link yang sudah dibagikan jadi rusak (404).' },
            { title: 'Kategori', desc: 'Pilih satu kategori dari dropdown, atau biarkan "Tanpa kategori". Tidak ada fitur tag/multi-kategori — hanya satu kategori per artikel. Kelola daftar kategori lewat tombol "Kelola Kategori" di halaman daftar Blog.' },
            { title: 'Nama Penulis', desc: 'Opsional. Kosongkan untuk otomatis memakai nama brand ("Drips To You - Bali") sebagai penulis yang tampil di artikel publik.' },
            { title: 'Ringkasan (Excerpt)', desc: 'Ringkasan singkat, maksimal 500 karakter. Dipakai di kartu listing (daftar Blog & halaman publik) dan sebagai cadangan Meta Description bila field SEO-nya dikosongkan.' },
            { title: 'Status', desc: 'Draft, Tayang, atau Arsip — lihat penjelasan lengkap di bagian "Draft, Publish & Arsip" di bawah.' },
          ] : [
            { title: 'Article Title *', desc: 'The full article title, max 200 characters. Required — this is rendered as the H1 on the public page.' },
            { title: 'URL Slug *', desc: 'The last part of the article address (dripstoyou.com/blog/this-slug). Auto-filled from the Title, but editable before the article has ever been published.', detail: 'Once an article has EVER been Published, its slug is permanently LOCKED and can no longer be changed — this prevents already-shared links from breaking (404).' },
            { title: 'Category', desc: 'Pick one category from the dropdown, or leave it as "No category". There is no tag / multi-category feature — only one category per article. Manage the category list via the "Manage Categories" button on the Blog list page.' },
            { title: 'Author Name', desc: 'Optional. Leave empty to automatically use the brand name ("Drips To You - Bali") as the author shown on the public article.' },
            { title: 'Excerpt', desc: 'A short summary, max 500 characters. Used on listing cards (Blog list & public pages) and as the Meta Description fallback when that SEO field is left empty.' },
            { title: 'Status', desc: 'Draft, Published, or Archived — see the full explanation in the "Draft, Publish & Archive" section below.' },
          ],
        },
        {
          type: 'mockup',
          html: titleSlugMockup(id),
          caption: id ? 'Judul & Slug — kolom slug kedua menunjukkan tampilan setelah terkunci' : 'Title & Slug — the second slug field shows what it looks like once locked',
        },
      ],
    },
    {
      id: 'editor',
      icon: '🖊️',
      title: id ? 'Menggunakan Editor Artikel' : 'Using the Article Editor',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Editor "Isi Artikel" bekerja seperti Word/Google Docs: pilih teks, lalu klik tombol format. Tidak perlu menulis kode HTML atau Markdown secara manual.'
            : 'The "Article Body" editor works like Word/Google Docs: select text, then click a format button. No need to write HTML or Markdown by hand.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Pilih gaya teks', desc: 'Dropdown paling kiri toolbar: Paragraf, Judul 1, Judul 2, atau Judul 3 — gunakan untuk sub-judul di dalam artikel.' },
            { title: 'Format teks', desc: 'Tebal (Ctrl+B), Miring (Ctrl+I), rata kiri/tengah/kanan/kiri-kanan, daftar poin, daftar bernomor, kutipan, dan kode.' },
            { title: 'Sisipkan tautan', desc: 'Pilih teks lalu klik ikon 🔗 (atau Ctrl+K). Isi alamat tautan (harus diawali http://, https://, /, mailto:, atau tel:) dan teks yang tampil.' },
            { title: 'Sisipkan gambar', desc: 'Klik ikon 🖼️ — bisa unggah dari komputer atau tempel URL gambar. Alt text WAJIB diisi untuk setiap gambar (aksesibilitas & SEO), keterangan gambar opsional.' },
            { title: 'Tempel dari Word / Google Docs', desc: 'Tempelan otomatis dirapikan mengikuti format yang didukung editor ini — tidak perlu membersihkan manual.' },
            { title: 'Mode Markdown (opsional)', desc: 'Tombol di ujung kanan toolbar mengganti tampilan ke kode Markdown mentah. Hanya perlu dipakai jika Anda memang familiar dengan sintaks Markdown.' },
            { title: 'Estimasi waktu baca', desc: 'Muncul otomatis di bawah editor (≈ X menit baca), dihitung dari panjang isi artikel — tidak perlu diisi manual.' },
          ] : [
            { title: 'Pick a text style', desc: 'Leftmost toolbar dropdown: Paragraph, Heading 1, Heading 2, or Heading 3 — use for subheadings within the article.' },
            { title: 'Format text', desc: 'Bold (Ctrl+B), Italic (Ctrl+I), left/center/right/justify alignment, bulleted list, numbered list, quote, and code.' },
            { title: 'Insert a link', desc: 'Select text then click the 🔗 icon (or Ctrl+K). Fill in the link address (must start with http://, https://, /, mailto:, or tel:) and the display text.' },
            { title: 'Insert an image', desc: 'Click the 🖼️ icon — upload from your computer or paste an image URL. Alt text is REQUIRED for every image (accessibility & SEO), caption is optional.' },
            { title: 'Paste from Word / Google Docs', desc: 'Pasted content is automatically cleaned up to match this editor\'s supported formatting — no manual cleanup needed.' },
            { title: 'Markdown mode (optional)', desc: 'The button at the far right of the toolbar switches the view to raw Markdown source. Only needed if you\'re already familiar with Markdown syntax.' },
            { title: 'Reading time estimate', desc: 'Appears automatically below the editor (≈ X min read), calculated from the article length — no manual input needed.' },
          ],
        },
        {
          type: 'mockup',
          html: editorToolbarMockup(),
          caption: id ? 'Toolbar editor — dari kiri: gaya teks, format, tautan/gambar, lalu tombol Mode Markdown di kanan' : 'Editor toolbar — from left: text style, formatting, link/image, then the Markdown Mode button on the right',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'Isi artikel wajib diisi sebelum menyimpan — editor ini bukan kotak teks biasa, jadi validasi "wajib" browser tidak otomatis berlaku. Kalau muncul pesan error "Isi artikel wajib diisi" padahal terasa sudah menulis, pastikan bukan hanya spasi kosong.'
            : 'The article body is required before saving — this editor is not a plain text box, so the browser\'s built-in "required" check doesn\'t apply automatically. If you see "Article body is required" even though you\'ve typed something, make sure it isn\'t just empty whitespace.',
        },
      ],
    },
    {
      id: 'cover',
      icon: '🖼️',
      title: id ? 'Featured Image (Cover) & Alt Text' : 'Featured Image (Cover) & Alt Text',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Unggah gambar cover', desc: 'Klik kotak "Pilih Gambar" atau tarik-lepas (drag & drop) file gambar ke area tersebut. Format yang diterima: JPG, PNG, atau WEBP.' },
            { title: 'Ganti atau hapus cover', desc: 'Setelah gambar terunggah, gunakan tombol "Ganti Foto" untuk mengunggah gambar baru, atau "Hapus Foto" untuk mengosongkan cover.' },
            { title: 'Isi Alt Text Cover *', desc: 'Wajib diisi begitu ada gambar cover. Deskripsikan isi gambar secara singkat dan jelas — dipakai pembaca layar (aksesibilitas) dan mesin pencari (SEO gambar).' },
          ] : [
            { title: 'Upload the cover image', desc: 'Click the "Choose Image" box or drag & drop an image file onto that area. Accepted formats: JPG, PNG, or WEBP.' },
            { title: 'Change or remove the cover', desc: 'Once an image is uploaded, use "Change Photo" to upload a new one, or "Remove Photo" to clear the cover.' },
            { title: 'Fill in Cover Alt Text *', desc: 'Required as soon as a cover image is set. Briefly and clearly describe the image content — used by screen readers (accessibility) and search engines (image SEO).' },
          ],
        },
        {
          type: 'mockup',
          html: coverUploadMockup(id),
          caption: id ? 'Upload cover — dropzone di atas, hasil unggahan + alt text di bawah' : 'Cover upload — dropzone above, uploaded result + alt text below',
        },
      ],
    },
    {
      id: 'seo',
      icon: '🔍',
      title: id ? 'Menggunakan Panel SEO' : 'Using the SEO Panel',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Meta Title', desc: 'Judul yang tampil di hasil pencarian Google. Maksimal 70 karakter, target ideal ≤ 60 karakter (ada penghitung otomatis). Kosongkan untuk memakai Judul Artikel + nama brand.' },
            { title: 'Meta Description', desc: 'Deskripsi singkat di bawah judul pada hasil pencarian. Maksimal 200 karakter, target ideal ≤ 160 karakter. Kosongkan untuk otomatis memakai Ringkasan (Excerpt).' },
            { title: 'Canonical URL (opsional)', desc: 'Hanya diisi bila artikel ini sengaja menduplikasi konten dari URL lain dan Anda ingin Google mengindeks URL aslinya, bukan halaman ini.' },
            { title: 'OG Image URL (opsional)', desc: 'Gambar khusus saat artikel dibagikan ke media sosial (Facebook/WhatsApp/dll). Kosongkan untuk otomatis memakai gambar Cover.' },
          ] : [
            { title: 'Meta Title', desc: 'The title shown in Google search results. Max 70 characters, ideal target ≤ 60 characters (live character counter provided). Leave empty to use the Article Title + brand name.' },
            { title: 'Meta Description', desc: 'The short blurb below the title in search results. Max 200 characters, ideal target ≤ 160 characters. Leave empty to automatically use the Excerpt.' },
            { title: 'Canonical URL (optional)', desc: 'Only fill this in if the article intentionally duplicates content from another URL and you want Google to index that original URL instead of this page.' },
            { title: 'OG Image URL (optional)', desc: 'A dedicated image shown when the article is shared on social media (Facebook/WhatsApp/etc). Leave empty to automatically use the Cover image.' },
          ],
        },
        {
          type: 'mockup',
          html: seoPanelMockup(id),
          caption: id ? 'Panel SEO — penghitung karakter di bawah Meta Title & Meta Description' : 'SEO Panel — character counters below Meta Title & Meta Description',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: id
            ? 'Kalau Meta Title / Meta Description dikosongkan, sistem otomatis memakai Judul dan Ringkasan artikel sebagai cadangan — jadi field ini aman dilewati untuk artikel yang tidak butuh penyesuaian SEO khusus.'
            : 'If Meta Title / Meta Description are left empty, the system automatically falls back to the article Title and Excerpt — so these fields are safe to skip for articles that don\'t need special SEO tuning.',
        },
      ],
    },
    {
      id: 'publish',
      icon: '🚦',
      title: id ? 'Draft, Publish & Arsip' : 'Draft, Publish & Archive',
      blocks: [
        {
          type: 'mockup',
          html: statusLifecycleMockup(id),
          caption: id ? 'Alur status artikel' : 'Article status flow',
        },
        {
          type: 'table',
          headers: id ? ['Status', 'Artinya', 'Tampil di /blog?'] : ['Status', 'Meaning', 'Shown on /blog?'],
          rows: id ? [
            ['Draft', 'Belum pernah tayang. Halaman publiknya 404 dan tidak masuk sitemap.', '❌'],
            ['Tayang', 'Sedang tayang ke publik, terindeks mesin pencari, masuk sitemap & RSS.', '✅'],
            ['Arsip', 'Pernah tayang, sekarang sengaja ditarik dari publik (halamannya kembali 404).', '❌'],
          ] : [
            ['Draft', 'Never published. The public page 404s and is excluded from the sitemap.', '❌'],
            ['Published', 'Live to the public, indexed by search engines, included in sitemap & RSS.', '✅'],
            ['Archived', 'Was published before, now intentionally pulled from public (page 404s again).', '❌'],
          ],
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Cara tercepat: tombol di daftar Blog', desc: 'Klik "Tayangkan" pada kartu artikel untuk langsung mempublikasikannya, atau "Tarik dari Publik" untuk menariknya kembali ke Draft.', detail: 'Tombol cepat ini HANYA berpindah antara Tayang ⇄ Draft. Untuk mengarsipkan (status Arsip), gunakan cara kedua di bawah.' },
            { title: 'Cara lengkap: dropdown Status di form Edit', desc: 'Buka artikel lewat "Edit", ubah dropdown "Status" ke Draft / Tayang / Arsip sesuai kebutuhan, lalu klik "Simpan Artikel".' },
          ] : [
            { title: 'Quickest way: button on the Blog list', desc: 'Click "Publish" on an article card to publish it immediately, or "Unpublish" to pull it back to Draft.', detail: 'This quick toggle ONLY switches between Published ⇄ Draft. To archive an article (Archived status), use the second method below.' },
            { title: 'Full control: Status dropdown in the Edit form', desc: 'Open the article via "Edit", change the "Status" dropdown to Draft / Published / Archived as needed, then click "Save Article".' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: id
            ? 'Kalau tombol cepat "Tayangkan" diklik pada artikel yang statusnya Arsip, artikel akan LANGSUNG kembali Tayang (bukan ke Draft) — karena tombol ini hanya mengenal dua kondisi: Tayang atau Tidak Tayang. Pastikan ini memang yang Anda maksud.'
            : 'If the quick "Publish" button is clicked on an article that is currently Archived, it will go DIRECTLY back to Published (not Draft) — because this button only recognizes two states: Published or Not Published. Make sure that\'s really what you intend.',
        },
      ],
    },
    {
      id: 'preview',
      icon: '👁️',
      title: id ? 'Pratinjau Artikel' : 'Previewing an Article',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          text: id
            ? 'Ada DUA cara pratinjau, tergantung dari mana Anda membukanya. Keduanya tidak diindeks mesin pencari dan hanya bisa diakses oleh admin yang login.'
            : 'There are TWO ways to preview, depending on where you open it from. Both are excluded from search engine indexing and only accessible to logged-in admins.',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Dari dalam form (tombol "Pratinjau ↗")', desc: 'Membuka tab baru yang menampilkan persis isi form yang SEDANG diketik saat itu juga — termasuk perubahan yang belum disimpan. Cocok dipakai berulang kali saat masih menulis.', detail: 'Klik tombol ini lagi setelah mengedit lebih lanjut untuk memuat ulang tab yang sama dengan versi terbaru — tidak menumpuk banyak tab.' },
            { title: 'Dari daftar Blog (tombol "Pratinjau")', desc: 'Hanya muncul untuk artikel yang statusnya BELUM Tayang. Menampilkan versi yang SUDAH TERSIMPAN di database (bukan draf yang sedang diketik), lengkap dengan tombol Edit dan Kembali.' },
            { title: 'Artikel yang sudah Tayang', desc: 'Tombol "Pratinjau" di daftar Blog berubah jadi "Lihat di situs" — membuka halaman publik /blog/[slug] yang sesungguhnya di tab baru.' },
          ] : [
            { title: 'From inside the form ("Preview ↗" button)', desc: 'Opens a new tab showing exactly what\'s currently typed in the form — including unsaved changes. Great for checking repeatedly while still writing.', detail: 'Click this button again after further edits to reload the same tab with the latest version — it won\'t pile up multiple tabs.' },
            { title: 'From the Blog list ("Preview" button)', desc: 'Only appears for articles that are NOT YET Published. Shows the version already SAVED in the database (not the draft currently being typed), with Edit and Back buttons.' },
            { title: 'Already-published articles', desc: 'The "Preview" button on the Blog list becomes "View on site" — opening the real public page /blog/[slug] in a new tab.' },
          ],
        },
        {
          type: 'mockup',
          html: previewMockup(id),
          caption: id ? 'Tampilan pratinjau — persis seperti yang akan dilihat pengunjung publik' : 'Preview rendering — exactly what public visitors will see',
        },
      ],
    },
    {
      id: 'edit-delete',
      icon: '✏️',
      title: id ? 'Edit & Hapus Artikel' : 'Editing & Deleting an Article',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Edit artikel', desc: 'Klik tombol "Edit" pada kartu artikel di daftar Blog (atau dari halaman Pratinjau). Semua field terisi otomatis dengan data tersimpan — ubah yang perlu, lalu klik "Simpan Artikel".' },
            { title: 'Hapus artikel', desc: 'Buka artikel lewat "Edit", lalu klik tombol "Hapus" (merah, di kanan bawah formulir). Muncul dialog konfirmasi berisi judul artikel — klik "Hapus" sekali lagi untuk memastikan.' },
          ] : [
            { title: 'Edit an article', desc: 'Click the "Edit" button on an article card in the Blog list (or from the Preview page). All fields are pre-filled with saved data — change what\'s needed, then click "Save Article".' },
            { title: 'Delete an article', desc: 'Open the article via "Edit", then click the "Hapus" button (red, bottom right of the form). A confirmation dialog appears with the article title — click "Hapus" once more to confirm.' },
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          text: id
            ? 'Penghapusan artikel bersifat PERMANEN dan TIDAK BISA DIBATALKAN. Kalau hanya ingin menyembunyikannya dari publik sementara atau selamanya, gunakan status Draft atau Arsip — jangan hapus.'
            : 'Deleting an article is PERMANENT and CANNOT BE UNDONE. If you only want to hide it from the public temporarily or permanently, use the Draft or Archived status instead — don\'t delete it.',
        },
      ],
    },
    {
      id: 'analytics',
      icon: '📊',
      title: id ? 'Menggunakan Blog Analytics' : 'Using Blog Analytics',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: 'Buka menu Analytics', desc: 'Klik "Analytics" di bagian Konten Website pada sidebar — berada tepat di atas menu Blog.' },
            { title: 'Pilih rentang tanggal', desc: 'Gunakan tombol Hari Ini / 7 Hari / 30 Hari / 90 Hari, atau pilih "Custom" untuk memasukkan tanggal Dari–Sampai sendiri.' },
            { title: 'Baca kartu ringkasan (KPI)', desc: 'Total Views, Unique Visitors, Total Interaksi, dan Artikel Terbaik pada rentang tanggal yang dipilih — lihat bagian "Penjelasan Metrik" di bawah untuk detail masing-masing.' },
            { title: 'Baca grafik Traffic Blog', desc: 'Menampilkan tren Page Views vs Unique Visitors dari waktu ke waktu. Ganti granularitas lewat tombol Harian / Mingguan / Bulanan.' },
            { title: 'Jelajahi tabel Artikel Terpopuler', desc: 'Cari artikel lewat kotak pencarian, urutkan lewat dropdown (Terbanyak Dilihat / Terbanyak Diklik / Terbaru Dilihat / Paling Sedikit Dilihat), dan navigasi halaman dengan tombol ← Prev / Next →.' },
            { title: 'Buka detail per artikel', desc: 'Klik judul artikel mana pun di tabel untuk membuka halaman Analytics khusus artikel tersebut — traffic over time + rincian pengunjung.' },
          ] : [
            { title: 'Open the Analytics menu', desc: 'Click "Analytics" in the Website Content section of the sidebar — positioned right above the Blog menu.' },
            { title: 'Choose a date range', desc: 'Use the Today / 7 Days / 30 Days / 90 Days buttons, or pick "Custom" to enter your own From–To dates.' },
            { title: 'Read the summary (KPI) cards', desc: 'Total Views, Unique Visitors, Total Interactions, and Top Article for the selected date range — see the "Metrics Reference" section below for details on each.' },
            { title: 'Read the Blog Traffic chart', desc: 'Shows Page Views vs Unique Visitors trend over time. Switch granularity via the Daily / Weekly / Monthly buttons.' },
            { title: 'Explore the Top Articles table', desc: 'Search for an article using the search box, sort via the dropdown (Most Viewed / Most Clicked / Most Recently Viewed / Least Viewed), and navigate pages with ← Prev / Next → buttons.' },
            { title: 'Open a single article\'s detail', desc: 'Click any article title in the table to open that article\'s dedicated Analytics page — traffic over time + visitor breakdown.' },
          ],
        },
        {
          type: 'mockup',
          html: analyticsKpiMockup(id),
          caption: id ? 'Kartu ringkasan (KPI) di bagian atas Analytics' : 'Summary (KPI) cards at the top of Analytics',
        },
        {
          type: 'mockup',
          html: analyticsTableMockup(id),
          caption: id ? 'Tabel Artikel Terpopuler — cari & urutkan, klik judul untuk detail' : 'Top Articles table — search & sort, click a title for details',
        },
      ],
    },
    {
      id: 'metrics',
      icon: '📐',
      title: id ? 'Penjelasan Metrik Analytics' : 'Analytics Metrics Reference',
      blocks: [
        {
          type: 'table',
          headers: id ? ['Metrik', 'Penjelasan'] : ['Metric', 'Explanation'],
          rows: id ? [
            ['Total Views', 'Jumlah semua kunjungan halaman artikel pada rentang tanggal terpilih (satu pengunjung yang buka artikel 2x dihitung 2 views).'],
            ['Unique Visitors', 'Jumlah pengunjung BERBEDA, dihitung dari cookie pengunjung di browser — bukan dari alamat IP. Membuka beberapa artikel dalam kunjungan yang sama tetap dihitung 1 visitor.'],
            ['Total Interaksi', 'Gabungan klik tombol booking/treatment dan klik tautan di dalam isi artikel.'],
            ['Artikel Terbaik', 'Artikel dengan jumlah views terbanyak pada rentang tanggal yang sedang dipilih.'],
            ['Growth % (↑/↓)', 'Perbandingan Total Views dengan periode sebelumnya yang sama panjangnya. Muncul label "Baru" bila belum ada data periode pembanding.'],
            ['Views Hari Ini / 7 Hari / 30 Hari', 'Angka pendukung di kartu KPI, dihitung terpisah dari rentang tanggal utama yang sedang dipilih.'],
          ] : [
            ['Total Views', 'Total page visits to articles within the selected date range (one visitor opening an article twice counts as 2 views).'],
            ['Unique Visitors', 'Number of DIFFERENT visitors, counted via a visitor cookie in the browser — not by IP address. Opening several articles in the same visit still counts as 1 visitor.'],
            ['Total Interactions', 'Combined count of booking/treatment button clicks and in-article link clicks.'],
            ['Top Article', 'The article with the most views within the currently selected date range.'],
            ['Growth % (↑/↓)', 'Comparison of Total Views against the previous period of equal length. Shows a "New" label if there\'s no comparison data yet.'],
            ['Views Today / 7d / 30d', 'Supporting numbers on the KPI cards, calculated independently of the main selected date range.'],
          ],
        },
        {
          type: 'mockup',
          html: breakdownMockup(id),
          caption: id ? 'Rincian pengunjung di halaman Analytics per artikel' : 'Visitor breakdown on the per-article Analytics page',
        },
        {
          type: 'steps',
          items: id ? [
            { title: 'Rincian Pengunjung (halaman per artikel)', desc: 'Buka Analytics > klik judul artikel untuk melihat rincian: Perangkat (mobile/desktop), Browser, Sistem Operasi, dan Sumber Traffic (Referrer) — semuanya dideteksi dari data teknis kunjungan, bukan diisi manual.' },
            { title: 'Panel Negara (kadang tidak muncul)', desc: 'Rincian negara pengunjung bersifat best-effort dan hanya tersedia bila situs berjalan di belakang Cloudflare. Bila tidak tersedia, panel ini otomatis disembunyikan — ini normal, bukan error.' },
          ] : [
            { title: 'Visitor breakdown (per-article page)', desc: 'Open Analytics > click an article title to see: Device (mobile/desktop), Browser, Operating System, and Traffic Source (Referrer) — all detected from technical visit data, not entered manually.' },
            { title: 'Country panel (sometimes absent)', desc: 'Visitor country data is best-effort and only available when the site runs behind Cloudflare. If unavailable, this panel is automatically hidden — that\'s normal, not an error.' },
          ],
        },
      ],
    },
    {
      id: 'tips',
      icon: '💡',
      title: id ? 'Tips Penggunaan Admin Blog' : 'Admin Blog Usage Tips',
      blocks: [
        {
          type: 'callout',
          variant: 'tip',
          text: id
            ? '📌 Pikirkan slug baik-baik SEBELUM pertama kali Tayang — setelah itu terkunci permanen.\n\n📌 Selalu isi Ringkasan (Excerpt) secara manual walau opsional — lebih enak dibaca daripada potongan otomatis.\n\n📌 Isi Alt Text gambar dengan deskripsi yang benar-benar menggambarkan isi gambar, bukan asal-asalan.\n\n📌 Gunakan tombol Pratinjau sebelum mengubah status ke Tayang, untuk memastikan tampilannya sudah rapi.\n\n📌 Setelah artikel tayang beberapa minggu, cek urutan "Paling Sedikit Dilihat" di Analytics untuk menemukan artikel lama yang mungkin perlu diperbarui.\n\n📌 Untuk mengganti nama kategori, edit langsung di halaman Kelola Kategori — tidak perlu hapus lalu buat baru.'
            : '📌 Think carefully about the slug BEFORE the first time you publish — it locks permanently afterward.\n\n📌 Always fill in the Excerpt manually even though it\'s optional — it reads better than an auto-truncated snippet.\n\n📌 Write image Alt Text that actually describes the image content, not a placeholder.\n\n📌 Use the Preview button before switching status to Published, to make sure the layout looks right.\n\n📌 A few weeks after publishing, check the "Least Viewed" sort in Analytics to find older articles that may need refreshing.\n\n📌 To rename a category, edit it directly on the Manage Categories page — no need to delete and recreate it.',
        },
      ],
    },
    {
      id: 'troubleshooting',
      icon: '🛠️',
      title: id ? 'Troubleshooting' : 'Troubleshooting',
      blocks: [
        {
          type: 'steps',
          items: id ? [
            { title: '"Slug tidak bisa diubah / field-nya abu-abu"', desc: 'Normal — artinya artikel ini pernah berstatus Tayang. Ini kunci permanen untuk mencegah link rusak, tidak ada cara mengaktifkannya kembali dari admin panel.' },
            { title: '"Isi artikel wajib diisi" padahal sudah menulis', desc: 'Pastikan isinya bukan hanya baris kosong/spasi. Coba klik di dalam area editor dan ketik ulang sedikit teks.' },
            { title: '"Alt text cover wajib diisi" tidak bisa disimpan', desc: 'Muncul karena ada gambar Cover tapi kolom Alt Text Cover masih kosong. Isi deskripsi singkat gambar tersebut, lalu simpan ulang.' },
            { title: 'Upload gambar gagal', desc: 'Pastikan format file JPG, PNG, atau WEBP, dan koneksi internet stabil. Coba lagi atau gunakan gambar dengan ukuran file lebih kecil.' },
            { title: 'Tombol Pratinjau membuka tab kosong', desc: 'Kemungkinan pop-up diblokir browser. Izinkan pop-up untuk halaman admin ini, lalu klik tombol Pratinjau sekali lagi.' },
            { title: 'Artikel sudah Tayang tapi tidak muncul di /blog', desc: 'Cek ulang statusnya benar-benar "Tayang" (bukan tertukar dengan Draft/Arsip), lalu refresh halaman publik. Kalau baru saja diubah, tunggu beberapa detik.' },
            { title: 'Menghapus kategori — apakah artikelnya ikut hilang?', desc: 'Tidak. Artikel di dalam kategori yang dihapus tetap ada, hanya kehilangan label kategorinya (menjadi "Tanpa kategori").' },
            { title: 'Data Analytics kosong / "Belum pernah dilihat"', desc: 'Wajar untuk artikel yang baru tayang atau belum ada pengunjung asli pada rentang tanggal yang dipilih. Coba perluas rentang ke 90 Hari, atau tunggu traffic organik masuk.' },
            { title: 'Menu Blog / Analytics tidak muncul di sidebar saya', desc: 'Akun Anda kemungkinan belum (atau tidak lagi) memiliki izin modul "Blog". Hubungi SUPER_ADMIN untuk memeriksa Kelola Izin.' },
          ] : [
            { title: '"Slug can\'t be changed / field is greyed out"', desc: 'Normal — it means this article has been Published before. This is a permanent lock to prevent broken links; there\'s no way to re-enable it from the admin panel.' },
            { title: '"Article body is required" even though I wrote something', desc: 'Make sure the content isn\'t just empty lines/whitespace. Try clicking inside the editor area and typing a bit of text again.' },
            { title: '"Cover alt text is required" won\'t let me save', desc: 'Appears because a Cover image is set but the Cover Alt Text field is still empty. Fill in a short description of the image, then save again.' },
            { title: 'Image upload fails', desc: 'Make sure the file format is JPG, PNG, or WEBP, and your internet connection is stable. Try again or use a smaller file size.' },
            { title: 'The Preview button opens a blank tab', desc: 'The browser likely blocked the pop-up. Allow pop-ups for this admin page, then click the Preview button again.' },
            { title: 'Article is Published but doesn\'t show on /blog', desc: 'Double-check the status is really "Published" (not mixed up with Draft/Archived), then refresh the public page. If it was just changed, wait a few seconds.' },
            { title: 'Deleting a category — do its articles disappear too?', desc: 'No. Articles in a deleted category remain, they just lose their category label (become "No category").' },
            { title: 'Analytics data is empty / "Never viewed"', desc: 'Normal for a newly published article or when there hasn\'t been any real traffic within the selected date range. Try widening the range to 90 Days, or wait for organic traffic to arrive.' },
            { title: 'Blog / Analytics menu is missing from my sidebar', desc: 'Your account likely doesn\'t (or no longer) have access to the "Blog" module. Contact SUPER_ADMIN to review Kelola Izin (Manage Permissions).' },
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
  const [activeId, setActiveId] = useState('intro');
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

  const title    = lang === 'en' ? 'Blog Admin Guide' : 'Panduan Admin Blog';
  const subtitle = lang === 'en'
    ? 'Visual guide for using Admin Blog — articles, categories, and Analytics.'
    : 'Panduan visual penggunaan Admin Blog — artikel, kategori, dan Analytics.';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, overflow: 'hidden' }}>
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
              style={{ scrollMarginTop: 90, minWidth: 0 }}
              onClick={() => setActiveId(section.id)}
            >
              <div className="guide-section-card" style={{
                background: 'white', border: '1px solid rgba(32,82,81,.09)',
                borderRadius: 18, padding: '24px 26px',
                boxShadow: '0 4px 18px rgba(32,82,81,.05)',
                overflow: 'hidden',
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

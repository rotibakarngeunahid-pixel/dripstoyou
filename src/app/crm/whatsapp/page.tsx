'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, ExternalLink, Save } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { renderTemplate, generateWALink } from '@/lib/crm-whatsapp';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Template = { id: string; category: string; name: string; body_template: string; is_active: boolean; sort_order: number };

const CATEGORIES = ['BOOKING_CONFIRMATION', 'REMINDER', 'NURSE_ASSIGNMENT', 'FOLLOW_UP', 'CUSTOM'];
const VARS = ['nama', 'tanggal', 'jam', 'layanan', 'area', 'nurse'];
const SAMPLE: Record<string, string> = { nama: 'Sarah', tanggal: '26 Jun 2026', jam: '10:00', layanan: 'Immune Booster', area: 'Seminyak', nurse: 'Ayu' };

export default function WhatsAppPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Template | null>(null);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ items: Template[] }>('/api/crm/whatsapp');
      setItems(d.items ?? []);
      setSelected((cur) => cur ? d.items.find((t) => t.id === cur.id) ?? d.items[0] ?? null : d.items[0] ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  function newTemplate() {
    setSelected({ id: '', category: 'CUSTOM', name: 'Template Baru', body_template: 'Halo {nama}, ', is_active: true, sort_order: items.length });
  }
  function insertVar(v: string) {
    if (!selected) return;
    const ta = bodyRef.current;
    const token = `{${v}}`;
    if (ta && ta.selectionStart != null) {
      const s = ta.selectionStart, e = ta.selectionEnd;
      const next = selected.body_template.slice(0, s) + token + selected.body_template.slice(e);
      setSelected({ ...selected, body_template: next });
    } else {
      setSelected({ ...selected, body_template: selected.body_template + token });
    }
  }
  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      await crmSend('/api/crm/whatsapp', 'POST', {
        id: selected.id || undefined, category: selected.category, name: selected.name,
        body_template: selected.body_template, is_active: selected.is_active, sort_order: selected.sort_order,
      });
      await load(); setToast('Tersimpan'); setTimeout(() => setToast(''), 1500);
    } catch (e) { setToast(e instanceof Error ? e.message : 'Gagal'); }
    finally { setSaving(false); }
  }
  async function del() {
    if (!selected?.id) { setSelected(null); return; }
    if (!confirm('Hapus template ini?')) return;
    await crmSend(`/api/crm/whatsapp?id=${selected.id}`, 'DELETE');
    setSelected(null); load();
  }

  const preview = selected ? renderTemplate(selected.body_template, SAMPLE) : '';
  const waLink = phone && selected ? generateWALink(phone, preview) : '';

  async function copyLink() {
    if (!waLink) return;
    try { await navigator.clipboard.writeText(waLink); setToast('Link disalin'); setTimeout(() => setToast(''), 1500); } catch { setToast('Gagal menyalin'); }
  }

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#205251]">WhatsApp Template</h2>
        <button onClick={newTemplate} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white"><Plus size={18} /> Template</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_300px]">
        {/* List */}
        <div className="space-y-2">
          {items.length === 0 && <EmptyState title="Belum ada template" />}
          {items.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)} className={`block w-full rounded-xl border p-3 text-left text-sm ${selected?.id === t.id ? 'border-[#205251] bg-[#D6EAEA]' : 'border-[#DBDAD7] bg-white'}`}>
              <p className="font-medium text-[#205251]">{t.name}</p>
              <p className="text-xs text-[#8EBFBF]">{t.category.replaceAll('_', ' ')}</p>
            </button>
          ))}
        </div>

        {/* Editor */}
        {selected ? (
          <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Nama<input value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" /></label>
              <label className="text-sm">Kategori<select value={selected.category} onChange={(e) => setSelected({ ...selected, category: e.target.value })} className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]">{CATEGORIES.map((c) => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}</select></label>
            </div>
            <div className="mt-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {VARS.map((v) => <button key={v} onClick={() => insertVar(v)} className="rounded-full bg-[#D6EAEA] px-2.5 py-1 text-xs font-medium text-[#205251] hover:bg-[#8EBFBF]">{`{${v}}`}</button>)}
              </div>
              <textarea ref={bodyRef} value={selected.body_template} onChange={(e) => setSelected({ ...selected, body_template: e.target.value })} className="min-h-[220px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.is_active} onChange={(e) => setSelected({ ...selected, is_active: e.target.checked })} /> Aktif</label>
            <div className="mt-3 flex gap-2">
              <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white disabled:opacity-70"><Save size={16} /> {saving ? 'Menyimpan…' : 'Simpan'}</button>
              <button onClick={del} className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600"><Trash2 size={16} /> Hapus</button>
              {toast && <span className="self-center text-sm text-[#29808B]">{toast}</span>}
            </div>
          </div>
        ) : <div className="rounded-2xl border border-dashed border-[#8EBFBF] bg-white p-8 text-center text-sm text-[#4d6060]">Pilih atau buat template.</div>}

        {/* Preview + generate link */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#205251] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Preview</p>
            <div className="whitespace-pre-wrap rounded-xl rounded-tl-none bg-[#075E54] p-3 text-sm text-white">{preview || '—'}</div>
          </div>
          <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
            <label className="text-sm">Nomor tujuan
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812… / 62812…" className="mt-1 h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />
            </label>
            <div className="mt-3 flex gap-2">
              <button onClick={copyLink} disabled={!waLink} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-[#DBDAD7] text-sm font-medium text-[#205251] disabled:opacity-50"><Copy size={16} /> Salin</button>
              <a href={waLink || '#'} target="_blank" rel="noopener noreferrer" className={`inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-semibold text-white ${waLink ? 'bg-[#25D366]' : 'pointer-events-none bg-[#8EBFBF]'}`}><ExternalLink size={16} /> Buka</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

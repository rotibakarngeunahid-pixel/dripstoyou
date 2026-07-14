'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Copy, Check, Trash2 } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatDate } from '@/lib/crm-format';
import { CRM_MODULE_LABELS, crmEffectiveModules, crmValidateCustomModules } from '@/lib/crm-permissions';
import type { CRMRole } from '@/lib/crm-session';
import Modal from '@/components/crm/Modal';
import ConfirmModal from '@/components/crm/ConfirmModal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';
import { useCRMStaff } from '@/app/crm/CRMShell';

type Staff = { id: string; name: string; email: string; role: string; is_active: boolean; last_login_at: string | null; permissions: string[] | null };

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-[#205251] text-white', ADMIN: 'bg-[#29808B] text-white',
  NURSE: 'bg-[#8EBFBF] text-[#205251]', FINANCE: 'bg-[#C9944C] text-white',
};
const ROLES = ['OWNER', 'ADMIN', 'NURSE', 'FINANCE'];

export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Staff | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await crmGet<{ items: Staff[] }>('/api/crm/staff'); setRows(d.items ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2 className="crm-page-title">Staff & Role</h2>
          <p className="crm-page-subtitle">Kelola user internal, role, dan akses modul CRM.</p>
        </div>
        <button onClick={() => setModal('new')} className="crm-button"><Plus size={18} /> Tambah Staff</button>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Belum ada staff" />
      ) : (
        <div className="crm-list-panel overflow-hidden">
          {rows.map((s) => (
            <button key={s.id} onClick={() => setModal(s)} className="flex w-full items-center justify-between gap-3 border-b border-[#eef4f5] px-4 py-3 text-left last:border-0 hover:bg-[#fbfdfd]">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#205251]">{s.name}</p>
                <p className="truncate text-xs text-[#8EBFBF]">{s.email} · Login terakhir {s.last_login_at ? formatDate(s.last_login_at) : '—'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[s.role] ?? 'bg-gray-100'}`}>{s.role}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {modal && (
        <StaffModal
          staff={modal === 'new' ? null : modal}
          ownerCount={rows.filter((r) => r.role === 'OWNER').length}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          onDeleted={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

function StaffModal({ staff, ownerCount, onClose, onSaved, onDeleted }: { staff: Staff | null; ownerCount: number; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const me = useCRMStaff();
  const isSelf = !!staff && staff.id === me?.id;
  const isLastOwner = !!staff && staff.role === 'OWNER' && ownerCount <= 1;
  const deleteBlockedReason = isSelf ? 'Tidak bisa menghapus akun sendiri.' : isLastOwner ? 'Tidak bisa menghapus OWNER terakhir.' : null;
  const [name, setName] = useState(staff?.name ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [role, setRole] = useState(staff?.role ?? 'ADMIN');
  const [active, setActive] = useState(staff?.is_active ?? true);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [useCustom, setUseCustom] = useState<boolean>(!!(staff?.permissions && staff.permissions.length > 0));
  const [selectedModules, setSelectedModules] = useState<string[]>(
    staff?.permissions && staff.permissions.length ? staff.permissions : crmEffectiveModules((staff?.role ?? 'ADMIN') as CRMRole, null),
  );
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  // NURSE always lands on the nurse portal after login — without this checked,
  // the account can log in but every page 403s. Force it on and non-removable.
  const requiredModule = role === 'NURSE' ? 'nurse_portal' : null;

  function withRequiredModule(mods: string[], forRole: string): string[] {
    const req = forRole === 'NURSE' ? 'nurse_portal' : null;
    return req && !mods.includes(req) ? [...mods, req] : mods;
  }

  function toggleModule(k: string) {
    if (k === requiredModule) return; // wajib, tidak bisa dilepas
    setSelectedModules((m) => m.includes(k) ? m.filter((x) => x !== k) : [...m, k]);
  }

  async function submit() {
    if (!name || (!staff && !email)) { setErr('Nama dan email wajib diisi.'); return; }
    if (useCustom && role !== 'OWNER') {
      const permErr = crmValidateCustomModules(role as CRMRole, selectedModules);
      if (permErr) { setErr(permErr); return; }
    }
    setSaving(true); setErr('');
    try {
      const res = await crmSend<{ generated_password?: string | null }>('/api/crm/staff', 'POST', {
        id: staff?.id, name, email, role, is_active: active, password: password || undefined,
        permissions: (useCustom && role !== 'OWNER') ? selectedModules : null,
      });
      const gp = res.data?.generated_password;
      if (gp) { setGenerated(gp); setSaving(false); return; } // keep modal open to show password once
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  async function del() {
    if (!staff) return;
    setDeleting(true); setErr('');
    try {
      await crmSend(`/api/crm/staff?id=${encodeURIComponent(staff.id)}`, 'DELETE');
      onDeleted();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menghapus'); setDeleting(false); setConfirmOpen(false); }
  }

  if (generated) {
    return (
      <Modal open onClose={onSaved} title="Staff dibuat" footer={<button onClick={onSaved} className="h-11 w-full rounded-xl bg-[#205251] text-sm font-semibold text-white">Selesai</button>}>
        <p className="mb-3 text-sm text-[#4d6060]">Simpan password ini sekarang — hanya ditampilkan sekali.</p>
        <div className="flex items-center justify-between rounded-xl bg-[#F3F0E7] px-4 py-3">
          <code className="text-base font-semibold text-[#205251]">{generated}</code>
          <button onClick={async () => { await navigator.clipboard.writeText(generated); setCopied(true); }} className="text-[#29808B]">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        </div>
      </Modal>
    );
  }

  return (
    <>
    <Modal open onClose={onClose} title={staff ? 'Edit Staff' : 'Tambah Staff'} footer={
      <div className="flex items-center justify-between gap-2">
        {staff ? (
          <div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={deleting || saving || !!deleteBlockedReason}
              title={deleteBlockedReason ?? undefined}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Trash2 size={16} /> {deleting ? 'Menghapus…' : 'Hapus'}
            </button>
            {deleteBlockedReason && <p className="mt-1 text-[11px] text-[#8a9aa3]">{deleteBlockedReason}</p>}
          </div>
        ) : <span />}
        <div className="flex gap-2">
          <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
          <button onClick={submit} disabled={saving || deleting} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <label className="block text-sm">Nama*<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block text-sm">Email*<input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!staff} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Role<select className={inputCls} value={role} onChange={(e) => {
            const newRole = e.target.value;
            setRole(newRole);
            if (useCustom) setSelectedModules((m) => withRequiredModule(m, newRole));
          }}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
          <label className="text-sm">Status<select className={inputCls} value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></label>
        </div>
        {role !== 'OWNER' && (
          <div className="rounded-xl border border-[#DBDAD7] p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-[#205251]">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => {
                  const on = e.target.checked;
                  setUseCustom(on);
                  if (on) {
                    setSelectedModules((m) => withRequiredModule(m.length === 0 ? crmEffectiveModules(role as CRMRole, null) : m, role));
                  }
                }}
              />
              Akses kustom (pilih modul yang boleh diakses)
            </label>
            {useCustom ? (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {CRM_MODULE_LABELS.map((m) => {
                  const required = m.key === requiredModule;
                  return (
                    <label key={m.key} className={`flex items-center gap-2 text-sm ${required ? 'font-medium text-[#205251]' : 'text-[#111a1a]'}`}>
                      <input type="checkbox" checked={selectedModules.includes(m.key)} disabled={required} onChange={() => toggleModule(m.key)} />
                      {m.label}{required && <span className="text-[10px] font-normal text-[#C9944C]"> (wajib)</span>}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[#8EBFBF]">Memakai akses default sesuai role {role}.</p>
            )}
          </div>
        )}
        <label className="block text-sm">{staff ? 'Reset Password (opsional)' : 'Password (kosongkan untuk generate otomatis)'}<input type="text" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={staff ? 'Biarkan kosong untuk tidak mengubah' : 'Min 8 karakter'} /></label>
        {role === 'NURSE' && !staff && <p className="text-xs text-[#8EBFBF]">Akun nurse otomatis terhubung ke daftar nurse untuk penugasan & portal.</p>}
      </div>
    </Modal>

    {staff && (
      <ConfirmModal
        open={confirmOpen}
        title="Hapus akun staff?"
        message={`Hapus akun staff "${staff.name}" secara permanen? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={del}
        onCancel={() => setConfirmOpen(false)}
      />
    )}
    </>
  );
}

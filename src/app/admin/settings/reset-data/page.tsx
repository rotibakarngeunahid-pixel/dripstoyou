'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import { HardResetModal } from '@/components/admin/HardResetModal';

type CategoryKey = 'bookings' | 'patients' | 'nurses' | 'content';
type Counts = Record<CategoryKey, number>;
type ApiResponse<T> = { success?: boolean; data?: T; message?: string; error?: string };

const CATEGORY_KEYS: CategoryKey[] = ['bookings', 'patients', 'nurses', 'content'];

export default function ResetDataPage() {
  const { lang, adminRole } = useAdminLang();
  const t = ADMIN_T[lang];

  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [countsError, setCountsError] = useState('');
  const [selected, setSelected] = useState<Set<CategoryKey>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    setCountsError('');
    try {
      const res = await fetch('/api/admin/hard-reset', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.status === 403) { setCountsError(t.aksesDitolak); setLoadingCounts(false); return; }
      const json = (await res.json()) as ApiResponse<Counts>;
      if (res.ok && json.success) {
        setCounts(json.data ?? null);
      } else {
        setCountsError(json.message ?? json.error ?? t.resetDataFailed);
      }
    } catch {
      setCountsError(t.resetDataFailed);
    } finally {
      setLoadingCounts(false);
    }
  }, [t.aksesDitolak, t.resetDataFailed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCounts();
  }, [fetchCounts]);

  if (adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="admin-page">
        <div className="alert alert-error">{t.aksesDitolak}</div>
      </div>
    );
  }

  const categoryMeta: Record<CategoryKey, { label: string; desc: string }> = {
    bookings: { label: t.resetDataCatBookings, desc: t.resetDataCatBookingsDesc },
    patients: { label: t.resetDataCatPatients, desc: t.resetDataCatPatientsDesc },
    nurses:   { label: t.resetDataCatNurses,   desc: t.resetDataCatNursesDesc },
    content:  { label: t.resetDataCatContent,  desc: t.resetDataCatContentDesc },
  };

  function toggle(key: CategoryKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function openModal() {
    setReason('');
    setConfirmText('');
    setSaveError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setReason('');
    setConfirmText('');
    setSaveError('');
  }

  async function handleConfirm() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/hard-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: Array.from(selected),
          reason: reason.trim(),
          confirmation: confirmText,
        }),
      });
      const json = (await res.json()) as ApiResponse<Counts>;
      if (res.ok && json.success) {
        setModalOpen(false);
        setReason('');
        setConfirmText('');
        setSelected(new Set());
        showToast(t.resetDataSuccess, 'success');
        void fetchCounts();
      } else {
        setSaveError(json.message ?? json.error ?? t.resetDataFailed);
      }
    } catch {
      setSaveError(t.resetDataFailed);
    } finally {
      setSaving(false);
    }
  }

  const selectedCategories = Array.from(selected).map((key) => ({
    key,
    label: categoryMeta[key].label,
    count: counts?.[key] ?? 0,
  }));

  return (
    <div className="admin-page">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`admin-toast ${toast.type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.resetDataTitle}</h1>
          <p className="admin-subtitle">{t.resetDataSubtitle}</p>
        </div>
      </div>

      {countsError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{countsError}</div>}

      <div className="form-card">
        {loadingCounts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CATEGORY_KEYS.map((key) => {
              const meta = categoryMeta[key];
              const checked = selected.has(key);
              return (
                <label
                  key={key}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    border: `1.5px solid ${checked ? '#dc2626' : 'rgba(32,82,81,.12)'}`,
                    background: checked ? '#fef2f2' : 'white',
                    borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(key)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: '#dc2626', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 14, color: 'var(--teal)' }}>{meta.label}</strong>
                      <span style={{ background: '#f3f4f6', color: '#555', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                        {counts?.[key] ?? 0} {t.resetDataItemCount}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#777', marginTop: 4, lineHeight: 1.6 }}>{meta.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={{
              minHeight: 42, padding: '10px 22px', fontSize: 13, fontWeight: 700,
              background: selected.size > 0 ? '#dc2626' : '#f87171',
              color: 'white', border: 'none', borderRadius: 10,
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
              opacity: selected.size > 0 ? 1 : 0.6,
            }}
            disabled={selected.size === 0}
            onClick={openModal}
          >
            {t.resetDataContinue}
          </button>
        </div>
      </div>

      <HardResetModal
        open={modalOpen}
        categories={selectedCategories}
        loading={saving}
        error={saveError}
        reason={reason}
        confirmText={confirmText}
        onReasonChange={setReason}
        onConfirmTextChange={setConfirmText}
        onConfirm={() => { void handleConfirm(); }}
        onCancel={closeModal}
        t={t}
      />
    </div>
  );
}

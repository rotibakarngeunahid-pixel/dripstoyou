'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

interface DeletionLog {
  id: string;
  booking_id: string;
  booking_code: string;
  customer_name: string;
  product_name: string;
  booking_date: string;
  booking_time: string;
  booking_status: string;
  deleted_by_admin_id: string;
  deleted_by_admin_name: string;
  deleted_by_admin_email: string;
  reason: string;
  ip_address: string | null;
  deleted_at: string;
  booking_snapshot: string;
}

interface AdminOption {
  id: string;
  name: string;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' WIB';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

type SnapshotModalProps = {
  log: DeletionLog | null;
  onClose: () => void;
  t: Record<string, string>;
};

function SnapshotModal({ log, onClose, t }: SnapshotModalProps) {
  useEffect(() => {
    if (!log) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [log, onClose]);

  if (!log) return null;

  let snapshot: Record<string, unknown> = {};
  try { snapshot = JSON.parse(log.booking_snapshot) as Record<string, unknown>; } catch { /* ignore */ }

  const fields: [string, string][] = [
    ['Kode Booking', String(snapshot.booking_code ?? log.booking_code)],
    ['Customer', String(snapshot.customer_name ?? '-')],
    ['No. HP (decrypted)', String(snapshot.customer_phone_decrypted ?? '(encrypted)')],
    ['Alamat', String(snapshot.address_decrypted ?? '(encrypted)')],
    ['Catatan', String(snapshot.notes_decrypted ?? '-')],
    ['Treatment', String(snapshot.product_name ?? '-')],
    ['Harga', String(snapshot.price_label ?? '-')],
    ['Tanggal', String(snapshot.booking_date ?? '-')],
    ['Waktu', String(snapshot.booking_time ?? '-')],
    ['Jumlah Orang', String(snapshot.people_count ?? '-')],
    ['Area', String(snapshot.service_area_name ?? snapshot.location_type ?? '-')],
    ['Status', String(snapshot.status ?? '-')],
    ['Sumber', String(snapshot.source ?? '-')],
    ['Dibuat', String(snapshot.created_at ?? '-')],
    ['Dihapus Oleh', `${log.deleted_by_admin_name} (${log.deleted_by_admin_email})`],
    ['Waktu Hapus', formatDateTime(log.deleted_at)],
    ['Alasan', log.reason],
    ['IP Address', log.ip_address ?? '-'],
  ];

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-modal-title"
        style={{
          background: 'white', borderRadius: 20, padding: 32,
          maxWidth: 560, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.24)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3
            id="snapshot-modal-title"
            style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: 'var(--teal)', fontSize: 18, fontWeight: 700 }}
          >
            {t.detailPenghapusan}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#888', lineHeight: 1, padding: 4,
            }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'grid', gridTemplateColumns: '160px 1fr',
                padding: '7px 0', borderBottom: '1px solid #f4f4f4',
                fontSize: 13, lineHeight: 1.6,
              }}
            >
              <span style={{ color: '#888', fontWeight: 500 }}>{label}</span>
              <span style={{ wordBreak: 'break-word', color: '#222' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: 13, padding: '8px 20px' }}
            onClick={onClose}
          >
            {t.batal}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingDeletionLogsPage() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [adminFilter, setAdminFilter] = useState('');

  const [detailLog, setDetailLog] = useState<DeletionLog | null>(null);

  const fetchLogs = useCallback(async (params?: { dateFrom?: string; dateTo?: string; adminId?: string }) => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (params?.dateFrom) qs.set('date_from', params.dateFrom);
      if (params?.dateTo)   qs.set('date_to',   params.dateTo);
      if (params?.adminId)  qs.set('admin_id',   params.adminId);

      const res = await fetch(`/api/admin/booking-deletion-logs${qs.toString() ? `?${qs}` : ''}`, { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.status === 403) { setError('Akses ditolak. Halaman ini hanya untuk SUPER ADMIN.'); setLoading(false); return; }

      const json = await res.json();
      if (res.ok && json.success) {
        setLogs(json.data.logs ?? []);
        setAdmins(json.data.admins ?? []);
      } else {
        setError(json.message ?? json.error ?? t.gagalMemuatLog);
      }
    } catch {
      setError(t.koneksiLogFailed);
    } finally {
      setLoading(false);
    }
  }, [t.gagalMemuatLog, t.koneksiLogFailed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs();
  }, [fetchLogs]);

  function handleApplyFilter() {
    void fetchLogs({ dateFrom, dateTo, adminId: adminFilter });
  }

  function handleResetFilter() {
    setDateFrom('');
    setDateTo('');
    setAdminFilter('');
    void fetchLogs();
  }

  function handleExport() {
    const qs = new URLSearchParams({ export: '1' });
    if (dateFrom)    qs.set('date_from', dateFrom);
    if (dateTo)      qs.set('date_to',   dateTo);
    if (adminFilter) qs.set('admin_id',  adminFilter);
    window.open(`/api/admin/booking-deletion-logs?${qs}`, '_blank');
  }

  return (
    <div className="admin-page wide">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.logPenghapusanTitle}</h1>
          <p className="admin-subtitle">{t.logPenghapusanSubtitle}</p>
        </div>
        <button
          type="button"
          className="button button-secondary"
          style={{ fontSize: 13 }}
          onClick={handleExport}
        >
          {t.exportLogCSV}
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        marginBottom: 20, padding: '16px 20px',
        background: '#fafafa', borderRadius: 14, border: '1px solid #eee',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t.filterDariTanggal}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t.filterSampaiTanggal}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t.filterAdmin}
          </label>
          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, minWidth: 160 }}
          >
            <option value="">{t.semuaAdmin}</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="button"
            style={{ fontSize: 13, padding: '8px 16px', background: 'var(--teal)', color: 'white', border: 'none' }}
            onClick={handleApplyFilter}
          >
            {t.terapkanFilter}
          </button>
          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: 13, padding: '8px 14px' }}
            onClick={handleResetFilter}
          >
            {t.resetFilter}
          </button>
        </div>
      </div>

      {!loading && !error && (
        <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          {logs.length} {t.totalLog}
        </p>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <section className="table-shell">
          <div className="table-wrap">
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>{t.kodeBookingTh}</th>
                  <th>{t.customerTh}</th>
                  <th>{t.treatmentTh}</th>
                  <th>{t.tanggalBookingTh}</th>
                  <th>{t.dihapusOlehTh}</th>
                  <th>{t.waktuHapusTh}</th>
                  <th>{t.alasanTh}</th>
                  <th>{t.aksi}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                      {log.booking_code}
                    </td>
                    <td>{log.customer_name}</td>
                    <td>{log.product_name}</td>
                    <td className="muted-small">
                      {formatDate(log.booking_date)} • {log.booking_time}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div>{log.deleted_by_admin_name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{log.deleted_by_admin_email}</div>
                    </td>
                    <td className="muted-small" style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.deleted_at)}
                    </td>
                    <td style={{ fontSize: 13, maxWidth: 200 }}>
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {log.reason}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ padding: '4px 12px', fontSize: 13 }}
                        onClick={() => setDetailLog(log)}
                      >
                        {t.lihatDetail}
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">{t.belumAdaLog}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SnapshotModal log={detailLog} onClose={() => setDetailLog(null)} t={t} />
    </div>
  );
}

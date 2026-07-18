'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import { DeleteBookingModal, type DeleteModalBooking } from '@/components/admin/DeleteBookingModal';
import { ResetBookingsModal } from '@/components/admin/ResetBookingsModal';

type BookingStatus = 'BARU' | 'KONFIRMASI' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';
type TabKey = 'semua' | 'aktif' | 'selesai' | 'dibatalkan' | 'dihapus';

const STATUS_COLORS: Record<BookingStatus, string> = {
  BARU: 'status-pending',
  KONFIRMASI: 'status-confirmed',
  DIPROSES: 'status-processing',
  SELESAI: 'status-done',
  DIBATALKAN: 'status-cancelled',
};

const ACTIVE_STATUSES: BookingStatus[] = ['BARU', 'KONFIRMASI', 'DIPROSES'];

interface Booking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_last4: string;
  booking_date: string;
  booking_time: string;
  people_count: number;
  location_type: string;
  status: BookingStatus;
  source: string;
  created_at: string;
  product_name: string;
  service_area_name: string | null;
}

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

function formatDate(value: string, withYear = true) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' WITA';
}

type Toast = { message: string; type: 'success' | 'error' };

/* ── Snapshot modal (deletion log detail) ── */
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
  try { snapshot = JSON.parse(log.booking_snapshot) as Record<string, unknown>; } catch { /* noop */ }

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
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888', lineHeight: 1, padding: 4 }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="bd-snapshot-row"
            >
              <span style={{ color: '#888', fontWeight: 500 }}>{label}</span>
              <span style={{ wordBreak: 'break-word', color: '#222' }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button type="button" className="button button-secondary" style={{ fontSize: 13, padding: '8px 20px' }} onClick={onClose}>
            {t.batal}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function BookingsPage() {
  const { lang, adminRole } = useAdminLang();
  const t = ADMIN_T[lang];
  const isSuperAdmin = adminRole === 'SUPER_ADMIN';

  /* Bookings */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  /* Tabs + search */
  const [activeTab, setActiveTab] = useState<TabKey>('semua');
  const [search, setSearch] = useState('');

  /* Deletion logs */
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [logAdmins, setLogAdmins] = useState<AdminOption[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  const [logAdminFilter, setLogAdminFilter] = useState('');
  const [detailLog, setDetailLog] = useState<DeletionLog | null>(null);

  /* Delete booking */
  const [deleteTarget, setDeleteTarget] = useState<DeleteModalBooking | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* Reset ALL bookings (SUPER_ADMIN only) */
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  /* Toast */
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: Toast['type']) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  /* ── Fetch bookings ── */
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bookings', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setBookings(json.data);
        setError('');
        setLastUpdated(new Date());
        setSecondsAgo(0);
      } else {
        setError(json.error ?? t.gagalMemuatBooking);
      }
    } catch {
      setError(t.koneksiBookingFailed);
    } finally {
      setLoading(false);
    }
  }, [t.gagalMemuatBooking, t.koneksiBookingFailed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBookings();
    const poll = setInterval(() => { void fetchBookings(); }, 10000);
    return () => clearInterval(poll);
  }, [fetchBookings]);

  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  /* ── Fetch deletion logs (lazy, SUPER_ADMIN only) ── */
  const fetchLogs = useCallback(async (params?: { dateFrom?: string; dateTo?: string; adminId?: string }) => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const qs = new URLSearchParams();
      if (params?.dateFrom) qs.set('date_from', params.dateFrom);
      if (params?.dateTo)   qs.set('date_to',   params.dateTo);
      if (params?.adminId)  qs.set('admin_id',   params.adminId);
      const res = await fetch(`/api/admin/booking-deletion-logs${qs.toString() ? `?${qs}` : ''}`, { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.status === 403) { setLogsError('Akses ditolak. Hanya untuk SUPER ADMIN.'); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        setLogs(json.data.logs ?? []);
        setLogAdmins(json.data.admins ?? []);
        setLogsLoaded(true);
      } else {
        setLogsError(json.message ?? json.error ?? t.gagalMemuatLog);
      }
    } catch {
      setLogsError(t.koneksiLogFailed);
    } finally {
      setLogsLoading(false);
    }
  }, [t.gagalMemuatLog, t.koneksiLogFailed]);

  /* Load logs when switching to the tab */
  useEffect(() => {
    if (activeTab === 'dihapus' && isSuperAdmin && !logsLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchLogs();
    }
  }, [activeTab, isSuperAdmin, logsLoaded, fetchLogs]);

  /* ── Delete booking ── */
  function openDeleteModal(booking: Booking) {
    setDeleteTarget({
      id: booking.id,
      booking_code: booking.booking_code,
      customer_name: booking.customer_name,
      product_name: booking.product_name,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      status: booking.status,
    });
    setDeleteReason('');
    setDeleteError('');
  }

  function closeDeleteModal() {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteReason('');
    setDeleteError('');
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !deleteReason.trim()) { setDeleteError(t.alasanWajib); return; }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/bookings/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const code = deleteTarget.booking_code;
        setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        setDeleteTarget(null);
        setDeleteReason('');
        setLogsLoaded(false); // reset so logs reload fresh on next visit
        showToast(`${t.bookingBerhasilDihapus}: ${code}`, 'success');
      } else {
        setDeleteError(json.message ?? json.error ?? t.hapusBookingGagal);
      }
    } catch {
      setDeleteError(t.hapusBookingGagal);
    } finally {
      setDeleteLoading(false);
    }
  }

  /* ── Reset ALL bookings ── */
  function openResetModal() {
    setResetReason('');
    setResetConfirmText('');
    setResetError('');
    setResetModalOpen(true);
  }

  function closeResetModal() {
    if (resetLoading) return;
    setResetModalOpen(false);
    setResetReason('');
    setResetConfirmText('');
    setResetError('');
  }

  async function handleConfirmReset() {
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch('/api/admin/bookings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: resetReason.trim(), confirmation: resetConfirmText }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const count = json.data?.count ?? 0;
        setBookings([]);
        setResetModalOpen(false);
        setResetReason('');
        setResetConfirmText('');
        setLogsLoaded(false); // reset so logs reload fresh on next visit
        showToast(`${count} ${t.transaksiBerhasilDireset}`, 'success');
      } else {
        setResetError(json.message ?? json.error ?? t.gagalResetTransaksi);
      }
    } catch {
      setResetError(t.gagalResetTransaksi);
    } finally {
      setResetLoading(false);
    }
  }

  /* ── Helpers ── */
  const statusLabel = (s: BookingStatus) => t[`status${s}` as keyof typeof t] ?? s;

  function filterBookings(list: Booking[]) {
    let filtered = list;
    if (activeTab === 'aktif')      filtered = list.filter(b => ACTIVE_STATUSES.includes(b.status));
    else if (activeTab === 'selesai')    filtered = list.filter(b => b.status === 'SELESAI');
    else if (activeTab === 'dibatalkan') filtered = list.filter(b => b.status === 'DIBATALKAN');

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.booking_code.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.product_name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  const countByTab = {
    semua: bookings.length,
    aktif: bookings.filter(b => ACTIVE_STATUSES.includes(b.status)).length,
    selesai: bookings.filter(b => b.status === 'SELESAI').length,
    dibatalkan: bookings.filter(b => b.status === 'DIBATALKAN').length,
    dihapus: logs.length,
  };

  const displayedBookings = activeTab !== 'dihapus' ? filterBookings(bookings) : [];

  const tableHeaders = [
    t.kode, t.pelanggan, t.noHP, t.treatment, t.tanggal,
    t.waktu, t.orang, t.area, t.status, t.dibuat, t.aksi,
  ];

  if (loading) {
    return (
      <div className="admin-page wide">
        <div className="admin-page-head">
          <div>
            <h1 className="admin-title">{t.bookingsTitle}</h1>
            <p className="admin-subtitle">{t.memuatData}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page wide">
      {/* Page header */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.bookingsTitle}</h1>
          <p className="admin-subtitle">
            {activeTab !== 'dihapus'
              ? <>{displayedBookings.length} {t.bookingsDitampilkan}</>
              : <>{logs.length} {t.totalLog}</>
            }
            {lastUpdated && activeTab !== 'dihapus' && (
              <span style={{ marginLeft: 12, fontSize: 11, color: '#aaa' }}>
                · {t.diperbarui} {secondsAgo}{t.detikLalu}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {activeTab !== 'dihapus' && (
            <>
              <button type="button" className="button button-secondary" onClick={() => { void fetchBookings(); }} style={{ fontSize: 13 }}>
                {t.refresh}
              </button>
              <Link href="/api/admin/bookings/export" className="button button-secondary">
                {t.exportCSV}
              </Link>
              {isSuperAdmin && bookings.length > 0 && (
                <button
                  type="button"
                  onClick={openResetModal}
                  style={{
                    padding: '7px 16px', fontSize: 13, fontWeight: 600,
                    background: 'transparent', color: '#dc2626',
                    border: '1.5px solid #dc2626', borderRadius: 8,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {t.resetTransaksi}
                </button>
              )}
            </>
          )}
          {activeTab === 'dihapus' && isSuperAdmin && (
            <button
              type="button"
              className="button button-secondary"
              style={{ fontSize: 13 }}
              onClick={() => {
                const qs = new URLSearchParams({ export: '1' });
                if (logDateFrom)    qs.set('date_from', logDateFrom);
                if (logDateTo)      qs.set('date_to', logDateTo);
                if (logAdminFilter) qs.set('admin_id', logAdminFilter);
                window.open(`/api/admin/booking-deletion-logs?${qs}`, '_blank');
              }}
            >
              {t.exportLogCSV}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Tabs + search toolbar */}
      <div className="admin-tabs-toolbar">
        <div className="admin-tabs-bar" role="tablist">
          {([
            { key: 'semua',      label: t.tabSemua,      count: countByTab.semua },
            { key: 'aktif',      label: t.tabAktif,      count: countByTab.aktif },
            { key: 'selesai',    label: t.tabSelesai,    count: countByTab.selesai },
            { key: 'dibatalkan', label: t.tabDibatalkan, count: countByTab.dibatalkan },
            ...(isSuperAdmin ? [{ key: 'dihapus', label: t.tabDihapus, count: countByTab.dihapus }] : []),
          ] as { key: TabKey; label: string; count: number }[]).map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              type="button"
              className={`admin-tab-btn${activeTab === tab.key ? ' is-active' : ''}${tab.key === 'dihapus' ? ' is-danger' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="admin-tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {activeTab !== 'dihapus' && (
          <div className="admin-search-field">
            <Search size={15} />
            <input
              type="search"
              className="admin-search-input"
              placeholder={t.cariPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Booking tabs (semua / aktif / selesai / dibatalkan) ── */}
      {activeTab !== 'dihapus' && (
        <section className="table-shell">
          <div className="table-wrap">
            <table className="data-table admin-bookings-table">
              <thead>
                <tr>
                  {tableHeaders.map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedBookings.map((booking) => {
                  const statusClass = STATUS_COLORS[booking.status] ?? 'status-processing';
                  return (
                    <tr key={booking.id}>
                      <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                        {booking.booking_code}
                      </td>
                      <td data-label={t.pelanggan}>{booking.customer_name}</td>
                      <td data-label={t.noHP} className="mono muted-small" style={{ whiteSpace: 'nowrap' }}>
                        {booking.customer_phone ?? `...${booking.customer_phone_last4}`}
                      </td>
                      <td data-label={t.treatment}>{booking.product_name}</td>
                      <td data-label={t.tanggal} className="muted-small">{formatDate(booking.booking_date)}</td>
                      <td data-label={t.waktu} className="muted-small">{booking.booking_time}</td>
                      <td data-label={t.orang} className="muted-small">{booking.people_count}</td>
                      <td data-label={t.area} className="muted-small">{booking.service_area_name ?? booking.location_type}</td>
                      <td data-label={t.status}>
                        <span className={`status-pill ${statusClass}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </td>
                      <td data-label={t.dibuat} className="muted-small">{formatDate(booking.created_at, false)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="button button-secondary"
                            style={{ padding: '4px 12px', fontSize: 13 }}
                          >
                            {t.detail}
                          </Link>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(booking)}
                              style={{
                                padding: '4px 10px', fontSize: 12, fontWeight: 600,
                                background: 'transparent', color: '#dc2626',
                                border: '1.5px solid #dc2626', borderRadius: 8,
                                cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.4,
                              }}
                            >
                              {t.hapus}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayedBookings.length === 0 && (
                  <tr>
                    <td colSpan={11} className="empty-state">{t.belumAdaBooking}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Deletion log tab ── */}
      {activeTab === 'dihapus' && isSuperAdmin && (
        <>
          {/* Log filters */}
          <div className="admin-log-filters">
            <div className="admin-log-filter-field">
              <span className="admin-log-filter-label">{t.filterDariTanggal}</span>
              <input type="date" className="admin-log-filter-input" value={logDateFrom} onChange={e => setLogDateFrom(e.target.value)} />
            </div>
            <div className="admin-log-filter-field">
              <span className="admin-log-filter-label">{t.filterSampaiTanggal}</span>
              <input type="date" className="admin-log-filter-input" value={logDateTo} onChange={e => setLogDateTo(e.target.value)} />
            </div>
            <div className="admin-log-filter-field">
              <span className="admin-log-filter-label">{t.filterAdmin}</span>
              <select
                className="admin-log-filter-input"
                value={logAdminFilter}
                onChange={e => setLogAdminFilter(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">{t.semuaAdmin}</option>
                {logAdmins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button
                type="button"
                className="button"
                style={{ fontSize: 13, padding: '7px 16px', background: 'var(--teal)', color: 'white', border: 'none', borderRadius: 8 }}
                onClick={() => { void fetchLogs({ dateFrom: logDateFrom, dateTo: logDateTo, adminId: logAdminFilter }); }}
              >
                {t.terapkanFilter}
              </button>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: 13, padding: '7px 14px' }}
                onClick={() => {
                  setLogDateFrom('');
                  setLogDateTo('');
                  setLogAdminFilter('');
                  void fetchLogs();
                }}
              >
                {t.resetFilter}
              </button>
            </div>
          </div>

          {logsError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{logsError}</div>}

          {logsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 12 }} />)}
            </div>
          ) : (
            <section className="table-shell">
              <div className="table-wrap">
                <table className="data-table admin-logs-table">
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
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>{log.booking_code}</td>
                        <td data-label={t.customerTh}>{log.customer_name}</td>
                        <td data-label={t.treatmentTh}>{log.product_name}</td>
                        <td data-label={t.tanggalBookingTh} className="muted-small">{formatDate(log.booking_date)} • {log.booking_time}</td>
                        <td data-label={t.dihapusOlehTh} style={{ fontSize: 13 }}>
                          <div>{log.deleted_by_admin_name}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{log.deleted_by_admin_email}</div>
                        </td>
                        <td data-label={t.waktuHapusTh} className="muted-small">{formatDateTime(log.deleted_at)}</td>
                        <td data-label={t.alasanTh} style={{ fontSize: 13, maxWidth: 200 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
        </>
      )}

      {/* ── Delete confirm modal ── */}
      <DeleteBookingModal
        open={deleteTarget !== null}
        booking={deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        reason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={() => { void handleConfirmDelete(); }}
        onCancel={closeDeleteModal}
        t={t}
      />

      {/* ── Reset ALL bookings confirm modal ── */}
      <ResetBookingsModal
        open={resetModalOpen}
        count={bookings.length}
        loading={resetLoading}
        error={resetError}
        reason={resetReason}
        confirmText={resetConfirmText}
        onReasonChange={setResetReason}
        onConfirmTextChange={setResetConfirmText}
        onConfirm={() => { void handleConfirmReset(); }}
        onCancel={closeResetModal}
        t={t}
      />

      {/* ── Toast ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`admin-toast ${toast.type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

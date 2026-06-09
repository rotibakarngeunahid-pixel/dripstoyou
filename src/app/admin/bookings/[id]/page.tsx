'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { 
  ArrowLeft, ArrowRight, Calendar, Clock, MapPin, 
  User, ClipboardList, Check,
  Activity, Phone, Map, StickyNote, Users, Navigation, Globe, CalendarDays, RefreshCcw, History, Hash
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'BARU', label: 'Baru', color: '#b8833e', bg: '#fdf8f3' },
  { value: 'KONFIRMASI', label: 'Konfirmasi', color: '#276f73', bg: '#f0f7f7' },
  { value: 'DIPROSES', label: 'Diproses', color: '#5e9c98', bg: '#f2f8f8' },
  { value: 'SELESAI', label: 'Selesai', color: '#1b8f4d', bg: '#f0fdf4' },
  { value: 'DIBATALKAN', label: 'Dibatalkan', color: '#c0392b', bg: '#fef2f2' },
] as const;

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

type StatusHistory = {
  old_status: string;
  new_status: string;
  note: string | null;
  created_at: string;
  changed_by_name: string | null;
};

type Booking = {
  id: string;
  booking_code: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  booking_date: string;
  booking_time: string;
  people_count: number;
  location_type: string;
  status: string;
  source: string;
  created_at: string;
  product_name: string;
  price_label: string | null;
  service_area_name: string | null;
  statusHistory: StatusHistory[];
};

function statusTheme(status: string) {
  return STATUS_OPTIONS.find((item) => item.value === status) ?? { color: '#667676', bg: '#f5f5f5', label: status };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID');
}

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[140px_20px_1fr] items-start py-3.5 border-b border-gray-100 last:border-0 text-sm">
      <div className="flex items-center gap-2.5 text-gray-500">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-gray-400 font-medium text-center">:</div>
      <div className="text-gray-900 font-medium break-words leading-relaxed">{value}</div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function loadBooking() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<Booking>;
      if (!res.ok) {
        setBooking(null);
        setError(json.message ?? json.error ?? 'Gagal memuat booking.');
        return;
      }
      setBooking(json.data ?? null);
      setNewStatus(json.data?.status ?? '');
    } catch {
      setError('Gagal memuat booking.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadBooking(); }, [id]);

  function requestStatusUpdate() {
    if (!booking || newStatus === booking.status) return;
    setConfirmStatus(true);
  }

  async function updateStatus() {
    if (!booking || newStatus === booking.status) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as ApiResponse<{ status: string }>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan status');
        return;
      }
      setBooking((current) => (current ? { ...current, status: json.data?.status ?? newStatus } : current));
      setNote('');
      setConfirmStatus(false);
      setSuccessMsg('Status berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadBooking();
      // Force the bookings list to refetch on next visit by busting the cache
      void fetch('/api/admin/bookings', { cache: 'no-store' }).catch(() => {});
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F0E7] p-6 lg:p-10 flex flex-col items-center">
        <div className="w-full max-w-[1180px] animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="h-12 bg-gray-200 rounded w-64 mb-10"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
             <div className="h-24 bg-white rounded-2xl"></div>
             <div className="h-24 bg-white rounded-2xl"></div>
             <div className="h-24 bg-white rounded-2xl"></div>
             <div className="h-24 bg-white rounded-2xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-white rounded-2xl"></div>
            <div className="h-80 bg-white rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F3F0E7] p-6 lg:p-10 flex flex-col items-center">
        <div className="w-full max-w-[1180px]">
           <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error || 'Booking tidak ditemukan'}</div>
        </div>
      </div>
    );
  }

  const currentTheme = statusTheme(booking.status);
  const nextStatusLabel = STATUS_OPTIONS.find((item) => item.value === newStatus)?.label ?? newStatus;
  const bookingDateFormatted = new Date(booking.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const shortDate = new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F3F0E7] py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <ConfirmModal
        open={confirmStatus}
        title="Ubah Status Booking"
        message={`Status booking ${booking.booking_code} akan diubah dari ${booking.status} menjadi ${nextStatusLabel}.`}
        confirmLabel="Simpan Status"
        loadingLabel="Menyimpan..."
        loading={saving}
        danger={newStatus === 'DIBATALKAN'}
        onConfirm={updateStatus}
        onCancel={() => setConfirmStatus(false)}
      />

      <div className="w-full max-w-[1180px]">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-8"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#205251]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
              {booking.booking_code}
            </h1>
            <span 
              className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ color: currentTheme.color, backgroundColor: currentTheme.bg, borderColor: currentTheme.color + '30' }}
            >
              {currentTheme.label}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_16px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#205251]/5 flex items-center justify-center text-[#205251] shrink-0 border border-[#205251]/10">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium mb-0.5">Treatment</span>
              <span className="text-[15px] font-bold text-gray-900 line-clamp-1">{booking.product_name}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_16px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#205251]/5 flex items-center justify-center text-[#205251] shrink-0 border border-[#205251]/10">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium mb-0.5">Tanggal</span>
              <span className="text-[15px] font-bold text-gray-900">{shortDate}</span>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_16px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#205251]/5 flex items-center justify-center text-[#205251] shrink-0 border border-[#205251]/10">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium mb-0.5">Waktu</span>
              <span className="text-[15px] font-bold text-gray-900">{booking.booking_time}</span>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_16px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#205251]/5 flex items-center justify-center text-[#205251] shrink-0 border border-[#205251]/10">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium mb-0.5">Area</span>
              <span className="text-[15px] font-bold text-gray-900 line-clamp-1">{booking.service_area_name ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Info */}
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#205251]/10 flex items-center justify-center text-[#205251]">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#205251]">Info Pelanggan</h2>
            </div>
            <div className="flex flex-col">
              <InfoRow icon={User} label="Nama" value={booking.customer_name} />
              <InfoRow icon={Phone} label="No. HP" value={booking.phone} />
              <InfoRow icon={Map} label="Alamat" value={booking.address} />
              {booking.notes && <InfoRow icon={StickyNote} label="Catatan" value={booking.notes} />}
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#205251]/10 flex items-center justify-center text-[#205251]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#205251]">Detail Booking</h2>
            </div>
            <div className="flex flex-col">
              <InfoRow icon={Activity} label="Treatment" value={booking.product_name} />
              <InfoRow icon={Hash} label="Harga" value={booking.price_label ?? '-'} />
              <InfoRow icon={Calendar} label="Tanggal" value={bookingDateFormatted} />
              <InfoRow icon={Clock} label="Waktu" value={booking.booking_time} />
              <InfoRow icon={Users} label="Jumlah Orang" value={booking.people_count} />
              <InfoRow icon={Navigation} label="Tipe Lokasi" value={booking.location_type} />
              <InfoRow icon={MapPin} label="Area" value={booking.service_area_name ?? '-'} />
              <InfoRow icon={Globe} label="Sumber" value={booking.source} />
              <InfoRow icon={Clock} label="Dibuat" value={formatDateTime(booking.created_at)} />
            </div>
          </div>
        </div>

        {/* Update Status */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(32,82,81,0.03)] border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-[#205251]/10 flex items-center justify-center text-[#205251]">
                <RefreshCcw className="w-5 h-5" />
              </div>
            <h2 className="text-xl font-bold text-[#205251]">Update Status</h2>
          </div>
          
          <div className="flex flex-wrap lg:flex-nowrap gap-3 mb-6">
            {STATUS_OPTIONS.map((status) => {
              const isActive = newStatus === status.value;
              return (
                <button
                  key={status.value}
                  onClick={() => setNewStatus(status.value)}
                  disabled={saving}
                  type="button"
                  className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2 border ${
                    isActive 
                      ? 'bg-[#205251] border-[#205251] text-white shadow-[0_4px_12px_rgba(32,82,81,0.2)]' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {status.label}
                  {isActive && <Check className="w-[18px] h-[18px]" />}
                </button>
              );
            })}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)..."
            disabled={saving}
            className="w-full p-4 rounded-xl border border-gray-200 text-[15px] text-gray-900 outline-none focus:border-[#205251] focus:ring-1 focus:ring-[#205251] mb-6 min-h-[110px] resize-y placeholder-gray-400 bg-gray-50/50 hover:bg-white transition-colors"
          />

          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{error}</div>}
          {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-100">{successMsg}</div>}

          <div className="flex justify-end">
            <button
              onClick={requestStatusUpdate}
              disabled={saving || newStatus === booking.status}
              type="button"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#205251] text-white rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#163a39] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_rgba(32,82,81,0.2)] hover:shadow-[0_6px_20px_rgba(32,82,81,0.3)]"
            >
              {saving ? 'Menyimpan...' : 'Simpan Status'}
            </button>
          </div>
        </div>

        {/* Status History */}
        {booking.statusHistory.length > 0 && (
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(32,82,81,0.03)] border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#205251]/10 flex items-center justify-center text-[#205251]">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#205251]">Riwayat Status</h2>
            </div>
            
            <div className="relative pl-8 sm:pl-10 space-y-8 sm:space-y-10 border-l-[2px] border-gray-100 ml-4 pb-2">
              {booking.statusHistory.map((history, index) => (
                <div className="relative" key={`${history.created_at}-${index}`}>
                  <div className="absolute -left-[39px] sm:-left-[47px] top-1 sm:top-1.5 w-[14px] h-[14px] rounded-full bg-[#205251] ring-[6px] ring-white"></div>
                  <div className="flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
                    <div className="text-[13px] sm:text-[15px] text-gray-500 font-medium whitespace-nowrap pt-0.5">
                      {formatDateTime(history.created_at)}
                    </div>
                    
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-[13px] font-semibold whitespace-nowrap shadow-sm">
                          {history.old_status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="px-3.5 py-1.5 rounded-lg bg-[#205251]/10 text-[#205251] border border-[#205251]/10 text-[13px] font-bold whitespace-nowrap shadow-sm">
                          {history.new_status}
                        </span>
                      </div>
                      {history.note && (
                        <div className="text-[14px] text-gray-600 italic bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 sm:ml-2">
                          "{history.note}"
                        </div>
                      )}
                    </div>

                    {history.changed_by_name && (
                      <div className="text-[13px] sm:text-[14px] text-gray-500 font-medium bg-white px-3.5 py-1.5 rounded-lg border border-gray-200 self-start sm:self-auto shrink-0 flex items-center gap-2 shadow-sm">
                        <User className="w-[14px] h-[14px] text-gray-400" />
                        {history.changed_by_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: 'BARU',       label: 'Baru',       color: '#C9944C' },
  { value: 'KONFIRMASI', label: 'Konfirmasi', color: '#29808B' },
  { value: 'DIPROSES',   label: 'Diproses',   color: '#8EBFBF' },
  { value: 'SELESAI',    label: 'Selesai',    color: '#25D366' },
  { value: 'DIBATALKAN', label: 'Dibatalkan', color: '#ef4444' },
] as const;

type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
  bookingDate: string;
  bookingTime: string;
  peopleCount: number;
  locationType: string;
  status: string;
  source: string;
  createdAt: string;
  product: { name: string; priceLabel: string | null };
  serviceArea: { name: string } | null;
  statusHistory: { id: string; oldStatus: string; newStatus: string; note: string | null; createdAt: string; changedBy: { name: string } | null }[];
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setBooking(d.booking);
        setNewStatus(d.booking?.status ?? '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function updateStatus() {
    if (!booking || newStatus === booking.status) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setBooking((b) => b ? { ...b, status: newStatus } : b);
      setNote('');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7e7e' }}>Memuat...</div>;
  if (!booking) return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Booking tidak ditemukan</div>;

  const statusColor = STATUS_OPTIONS.find((s) => s.value === booking.status)?.color ?? '#6b7e7e';

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ color: '#29808B', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Kembali
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#205251', marginBottom: 4 }}>
            {booking.bookingCode}
          </h1>
          <span style={{ background: statusColor + '22', color: statusColor, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: `1px solid ${statusColor}44` }}>
            {booking.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Customer Info */}
        <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 16 }}>Info Pelanggan</h2>
          {[
            ['Nama', booking.customerName],
            ['No. HP', booking.phone],
            ['Alamat', booking.address],
            ...(booking.notes ? [['Catatan', booking.notes]] : []),
          ].map(([label, value]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#6b7e7e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#1e2828' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Booking Info */}
        <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 16 }}>Detail Booking</h2>
          {[
            ['Treatment', booking.product.name],
            ['Harga', booking.product.priceLabel ?? '-'],
            ['Tanggal', new Date(booking.bookingDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })],
            ['Waktu', booking.bookingTime],
            ['Jumlah Orang', String(booking.peopleCount)],
            ['Tipe Lokasi', booking.locationType],
            ['Area', booking.serviceArea?.name ?? '-'],
            ['Sumber', booking.source],
            ['Dibuat', new Date(booking.createdAt).toLocaleString('id-ID')],
          ].map(([label, value]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7e7e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#1e2828' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Status */}
      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 16 }}>Update Status</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setNewStatus(s.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `2px solid ${newStatus === s.value ? s.color : '#DBDAD7'}`,
                background: newStatus === s.value ? s.color + '18' : 'white',
                color: newStatus === s.value ? s.color : '#6b7e7e',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (opsional)..."
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #DBDAD7', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 60, boxSizing: 'border-box', marginBottom: 12 }}
        />
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button
          onClick={updateStatus}
          disabled={saving || newStatus === booking.status}
          style={{ padding: '10px 24px', background: '#205251', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving || newStatus === booking.status ? 'not-allowed' : 'pointer', opacity: saving || newStatus === booking.status ? 0.6 : 1 }}
        >
          {saving ? 'Menyimpan...' : 'Simpan Status'}
        </button>
      </div>

      {/* Status History */}
      {booking.statusHistory.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 16 }}>Riwayat Status</h2>
          {booking.statusHistory.map((h) => (
            <div key={h.id} style={{ display: 'flex', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0eeea' }}>
              <div style={{ fontSize: 11, color: '#6b7e7e', minWidth: 120 }}>{new Date(h.createdAt).toLocaleString('id-ID')}</div>
              <div style={{ fontSize: 13, color: '#1e2828', flex: 1 }}>
                <span style={{ color: '#6b7e7e' }}>{h.oldStatus}</span>
                <span style={{ color: '#29808B', margin: '0 6px' }}>→</span>
                <span style={{ color: '#205251', fontWeight: 600 }}>{h.newStatus}</span>
                {h.note && <span style={{ color: '#6b7e7e', marginLeft: 8 }}>· {h.note}</span>}
              </div>
              {h.changedBy && <div style={{ fontSize: 11, color: '#6b7e7e' }}>{h.changedBy.name}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

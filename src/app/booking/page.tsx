'use client';

import { useEffect, useState } from 'react';
import { waBookingUrl } from '@/lib/whatsapp';

type Product = { id: string; name: string; priceLabel: string | null; priceAmount: number };
type Area = { id: string; name: string };

const LOCATION_TYPES = [
  { value: 'VILLA', label: 'Villa' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'RUMAH', label: 'Rumah' },
  { value: 'AIRBNB', label: 'Airbnb' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function BookingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [productId, setProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [peopleCount, setPeopleCount] = useState('1');
  const [locationType, setLocationType] = useState('VILLA');
  const [serviceAreaId, setServiceAreaId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ bookingCode: string; waUrl: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
    fetch('/api/public/areas')
      .then((r) => r.json())
      .then((d) => setAreas([{ id: '', name: 'Pilih area layanan...' }, ...(d.areas ?? [])]));
  }, []);

  useEffect(() => {
    if (!bookingDate) { setSlots([]); return; }
    setLoadingSlots(true);
    fetch(`/api/public/availability?date=${bookingDate}`)
      .then((r) => r.json())
      .then((d) => { setSlots(d.slots ?? []); setBookingTime(''); })
      .finally(() => setLoadingSlots(false));
  }, [bookingDate]);

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const area = areas.find((a) => a.id === serviceAreaId);

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName,
          customerPhone,
          bookingDate,
          bookingTime,
          peopleCount: parseInt(peopleCount, 10),
          locationType,
          serviceAreaId: serviceAreaId || undefined,
          address,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal membuat booking. Silakan coba via WhatsApp.');
        return;
      }

      const waText = `Halo, saya baru booking via website!\n\nKode Booking: *${data.bookingCode}*\nTreatment: ${selectedProduct?.name}\nTanggal: ${bookingDate} pukul ${bookingTime}\nNama: ${customerName}\nArea: ${area?.name ?? serviceAreaId}`;
      setSuccess({
        bookingCode: data.bookingCode,
        waUrl: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281200000000'}?text=${encodeURIComponent(waText)}`,
      });
    } catch {
      setError('Network error. Silakan coba via WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #DBDAD7', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: 'white', outline: 'none', color: '#1e2828' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#205251', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 };
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);

  if (success) {
    return (
      <main style={{ background: '#F3F0E7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(32,82,81,0.12)' }}>
          <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#205251', marginBottom: 8 }}>
            Booking Diterima!
          </h1>
          <p style={{ color: '#6b7e7e', fontSize: 14, marginBottom: 20 }}>
            Kode booking Anda:
          </p>
          <div style={{ background: '#f0f9f9', border: '1px solid #8EBFBF', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#205251', letterSpacing: 2 }}>
            {success.bookingCode}
          </div>
          <p style={{ color: '#6b7e7e', fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
            Tim kami akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal. Klik tombol di bawah untuk mengirim pesan konfirmasi.
          </p>
          <a
            href={success.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', padding: '14px 20px', background: '#25D366', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 12 }}
          >
            Konfirmasi via WhatsApp
          </a>
          <button
            onClick={() => { setSuccess(null); setProductId(''); setCustomerName(''); setCustomerPhone(''); setBookingDate(''); setBookingTime(''); setNotes(''); }}
            style={{ background: 'none', border: 'none', color: '#29808B', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Buat booking baru
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: '#F3F0E7', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', padding: '64px 24px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: '#8EBFBF', marginBottom: 16 }}>Booking</p>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 700, color: 'white', marginBottom: 12 }}>
          Pesan IV Therapy
        </h1>
        <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 15 }}>
          Isi form berikut, tim kami akan hadir dalam 30-60 menit.
        </p>
      </section>

      <section style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 64px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(32,82,81,0.08)', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#205251', marginBottom: 20 }}>Pilih Treatment</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductId(p.id)}
                  style={{
                    padding: '16px 14px',
                    border: `2px solid ${productId === p.id ? '#205251' : '#DBDAD7'}`,
                    borderRadius: 12,
                    background: productId === p.id ? '#f0f9f9' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 15, fontWeight: 700, color: '#205251', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#C9944C', fontWeight: 600 }}>{p.priceLabel ?? `IDR ${p.priceAmount.toLocaleString('id-ID')}`}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(32,82,81,0.08)', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#205251', marginBottom: 20 }}>Data Diri</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nama Lengkap *</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="John Doe" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>No. WhatsApp *</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required placeholder="+62 812 3456 7890" style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(32,82,81,0.08)', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#205251', marginBottom: 20 }}>Jadwal & Lokasi</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Tanggal *</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required min={minDate.toISOString().split('T')[0]} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Waktu * {loadingSlots && <span style={{ color: '#8EBFBF', fontSize: 10 }}>Memuat...</span>}</label>
                <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required disabled={!bookingDate || loadingSlots} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Pilih waktu...</option>
                  {slots.map((s) => <option key={s} value={s}>{s}</option>)}
                  {bookingDate && !loadingSlots && slots.length === 0 && <option disabled>Tidak ada slot tersedia</option>}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Jumlah Orang *</label>
                <input type="number" value={peopleCount} onChange={(e) => setPeopleCount(e.target.value)} required min="1" max="10" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tipe Lokasi *</label>
                <select value={locationType} onChange={(e) => setLocationType(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  {LOCATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Area Layanan *</label>
              <select value={serviceAreaId} onChange={(e) => setServiceAreaId(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Alamat Lengkap *</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Nama villa/hotel, no. kamar, jalan..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
            </div>

            <div>
              <label style={labelStyle}>Catatan Tambahan</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kondisi khusus, alergi, atau info tambahan..." style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e222', border: '1px solid #fca5a5', borderRadius: 12, padding: '14px 16px', color: '#ef4444', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              {error}
              {selectedProduct && (
                <div style={{ marginTop: 8 }}>
                  <a href={waBookingUrl(selectedProduct.name, selectedProduct.priceLabel ?? undefined)} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>
                    → Pesan langsung via WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !productId}
            style={{ width: '100%', padding: '16px', background: '#205251', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: submitting || !productId ? 'not-allowed' : 'pointer', opacity: submitting || !productId ? 0.7 : 1 }}
          >
            {submitting ? 'Memproses...' : 'Kirim Booking'}
          </button>

          <p style={{ textAlign: 'center', color: '#6b7e7e', fontSize: 12, marginTop: 14, lineHeight: 1.6 }}>
            Dengan mengirim form ini, Anda menyetujui{' '}
            <a href="/legal/syarat-dan-ketentuan" style={{ color: '#29808B' }}>Syarat & Ketentuan</a>
            {' '}dan{' '}
            <a href="/legal/kebijakan-privasi" style={{ color: '#29808B' }}>Kebijakan Privasi</a> kami.
          </p>
        </form>
      </section>
    </main>
  );
}

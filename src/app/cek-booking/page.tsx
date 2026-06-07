'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { useLanguage } from '@/contexts/language';

type BookingResult = {
  booking_code: string;
  customer_name: string;
  booking_date: string;
  booking_time: string;
  product_name: string;
  service_area_name: string | null;
  location_type: string;
  status: string;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; labelEn: string; color: string; dot: string }> = {
  BARU:       { label: 'Menunggu',   labelEn: 'Pending',    color: '#b8833e', dot: '🟡' },
  KONFIRMASI: { label: 'Konfirmasi', labelEn: 'Confirmed',  color: '#276f73', dot: '🔵' },
  DIPROSES:   { label: 'Diproses',   labelEn: 'Processing', color: '#5e9c98', dot: '🔵' },
  SELESAI:    { label: 'Selesai',    labelEn: 'Completed',  color: '#1b8f4d', dot: '🟢' },
  DIBATALKAN: { label: 'Dibatalkan', labelEn: 'Cancelled',  color: '#c0392b', dot: '🔴' },
};

function fmtDate(s: string, lang: 'id' | 'en') {
  try {
    return new Date(s + 'T00:00:00').toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return s; }
}

function BookingCard({ booking, lang }: { booking: BookingResult; lang: 'id' | 'en' }) {
  const st = STATUS_MAP[booking.status] ?? { label: booking.status, labelEn: booking.status, color: '#667676', dot: '⚪' };
  const label = lang === 'id' ? st.label : st.labelEn;
  const areaDisplay = booking.service_area_name ?? booking.location_type;

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid rgba(32,82,81,0.12)`,
      borderRadius: 18,
      padding: '22px 24px',
      boxShadow: '0 4px 20px rgba(32,82,81,0.07)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
            {lang === 'id' ? 'Kode Booking' : 'Booking Code'}
          </div>
          <div style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
            fontSize: 18, fontWeight: 800, color: 'var(--teal)', letterSpacing: 1,
          }}>
            {booking.booking_code}
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${st.color}18`, color: st.color,
          border: `1px solid ${st.color}44`,
          padding: '6px 14px', borderRadius: 999,
          fontSize: 13, fontWeight: 700,
        }}>
          {st.dot} {label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {[
          { k: lang === 'id' ? 'Nama' : 'Name', v: booking.customer_name },
          { k: lang === 'id' ? 'Treatment' : 'Treatment', v: booking.product_name },
          { k: lang === 'id' ? 'Tanggal' : 'Date', v: fmtDate(booking.booking_date, lang) },
          { k: lang === 'id' ? 'Waktu' : 'Time', v: booking.booking_time + ' WITA' },
          { k: lang === 'id' ? 'Area' : 'Area', v: areaDisplay },
        ].map(({ k, v }) => (
          <div key={k}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CekBookingPage() {
  const { lang } = useLanguage();
  const isId = lang === 'id';

  const [mode, setMode] = useState<'code' | 'name'>('code');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BookingResult[] | null>(null);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const param = mode === 'code' ? `code=${encodeURIComponent(q)}` : `name=${encodeURIComponent(q)}`;
      const res = await fetch(`/api/public/track?${param}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.message ?? (isId ? 'Booking tidak ditemukan.' : 'Booking not found.'));
        return;
      }
      const data = json.data;
      setResults(Array.isArray(data) ? data : [data]);
    } catch {
      setError(isId ? 'Koneksi bermasalah, coba lagi.' : 'Connection error, please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="page-shell">
        {/* Hero */}
        <div className="page-hero centered" style={{ paddingTop: 80 }}>
          <div className="page-hero-inner" style={{ textAlign: 'center' }}>
            <div className="page-eyebrow" style={{ justifyContent: 'center' }}>
              {isId ? 'Lacak Booking' : 'Track Booking'}
            </div>
            <h1 className="page-title">
              {isId ? 'Cek Status Booking' : 'Check Booking Status'}
            </h1>
            <p className="page-subtitle" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              {isId
                ? 'Masukkan kode booking atau nama Anda untuk melihat status pesanan.'
                : 'Enter your booking code or name to see the status of your appointment.'}
            </p>
          </div>
        </div>

        {/* Search form */}
        <div className="page-section narrow" style={{ paddingTop: 40 }}>
          <div className="surface-card" style={{ maxWidth: 560, margin: '0 auto' }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['code', 'name'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setResults(null); setError(''); setQuery(''); }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13,
                    fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${mode === m ? 'var(--teal)' : 'rgba(0,0,0,0.1)'}`,
                    background: mode === m ? 'var(--pale-aqua)' : 'white',
                    color: mode === m ? 'var(--teal)' : '#888',
                  }}
                >
                  {m === 'code'
                    ? (isId ? 'Kode Booking' : 'Booking Code')
                    : (isId ? 'Nama' : 'Name')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="admin-field">
                <span className="admin-field-label">
                  {mode === 'code'
                    ? (isId ? 'Kode Booking *' : 'Booking Code *')
                    : (isId ? 'Nama Pelanggan *' : 'Customer Name *')}
                </span>
                <input
                  className="control"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={mode === 'code' ? 'DRY260608R5X3' : (isId ? 'Nama Anda' : 'Your name')}
                  style={{ textTransform: mode === 'code' ? 'uppercase' : 'none', letterSpacing: mode === 'code' ? 1 : 0 }}
                  required
                />
              </label>

              {error && (
                <div className="alert alert-error">{error}</div>
              )}

              <button
                type="submit"
                className={`button button-primary${loading ? ' loading' : ''}`}
                disabled={loading || !query.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading
                  ? (isId ? 'Mencari…' : 'Searching…')
                  : (isId ? 'Cek Status' : 'Check Status')}
              </button>
            </form>
          </div>

          {/* Results */}
          {results && results.length > 0 && (
            <div style={{ maxWidth: 560, margin: '28px auto 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {results.length === 1
                  ? (isId ? '1 booking ditemukan' : '1 booking found')
                  : (isId ? `${results.length} booking ditemukan` : `${results.length} bookings found`)}
              </div>
              {results.map(b => (
                <BookingCard key={b.booking_code} booking={b} lang={lang} />
              ))}
            </div>
          )}

          {/* Help link */}
          <div style={{ maxWidth: 560, margin: '32px auto 0', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {isId ? 'Tidak menemukan booking Anda? ' : "Can't find your booking? "}
              <Link href="/booking" style={{ color: 'var(--ocean)', fontWeight: 700 }}>
                {isId ? 'Buat booking baru' : 'Make a new booking'}
              </Link>
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}

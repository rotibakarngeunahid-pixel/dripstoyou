'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/public/Header';
import { waBookingUrl } from '@/lib/whatsapp';

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  price_label: string | null;
  price_amount: number;
};

type Area = {
  id: string;
  name: string;
};

type AvailabilityData = {
  available: boolean;
  slots: string[];
};

type BookingResult = {
  bookingCode: string;
  bookingDate: string;
  bookingTime: string;
  productName: string;
};

const LOCATION_TYPES = [
  { value: 'VILLA', label: 'Villa' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'RUMAH', label: 'Rumah' },
  { value: 'AIRBNB', label: 'Airbnb' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

function formatPrice(product: Product) {
  return product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`;
}

function OptionSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <div className="treatment-option" key={item} aria-hidden="true">
          <div className="skeleton-line" style={{ width: '72%', marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: '48%' }} />
        </div>
      ))}
    </>
  );
}

export default function BookingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');

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
  const slotRequestRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadFormOptions() {
      setLoadingInitial(true);
      setError('');

      try {
        const [productsRes, areasRes] = await Promise.all([
          fetch('/api/public/products'),
          fetch('/api/public/areas'),
        ]);

        const productsJson = (await productsRes.json()) as ApiResponse<Product[]>;
        const areasJson = (await areasRes.json()) as ApiResponse<Area[]>;

        if (!productsRes.ok || !Array.isArray(productsJson.data)) {
          throw new Error(productsJson.message ?? 'Gagal memuat treatment');
        }

        if (!areasRes.ok || !Array.isArray(areasJson.data)) {
          throw new Error(areasJson.message ?? 'Gagal memuat area layanan');
        }

        if (!active) return;

        const nextProducts = productsJson.data;
        setProducts(nextProducts);
        setAreas(areasJson.data);

        const requested = new URLSearchParams(window.location.search).get('treatment');
        if (requested) {
          const matched = nextProducts.find((product) => (
            product.slug === requested || product.id === requested
          ));
          if (matched) setProductId(matched.id);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data booking. Silakan coba lagi.');
      } finally {
        if (active) setLoadingInitial(false);
      }
    }

    loadFormOptions();

    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [productId, products],
  );

  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Pilih treatment terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    const area = areas.find((item) => item.id === serviceAreaId);

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

      const json = (await res.json()) as ApiResponse<BookingResult>;
      if (!res.ok || !json.data) {
        setError(json.message ?? json.error ?? 'Gagal membuat booking. Silakan coba via WhatsApp.');
        return;
      }

      const waText = [
        'Halo, saya baru booking via website!',
        '',
        `Kode Booking: *${json.data.bookingCode}*`,
        `Treatment: ${selectedProduct.name}`,
        `Tanggal: ${bookingDate} pukul ${bookingTime}`,
        `Nama: ${customerName}`,
        `Area: ${area?.name ?? serviceAreaId}`,
      ].join('\n');

      setSuccess({
        bookingCode: json.data.bookingCode,
        waUrl: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281200000000'}?text=${encodeURIComponent(waText)}`,
      });
    } catch {
      setError('Network error. Silakan coba via WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadSlots(date: string) {
    const requestId = slotRequestRef.current + 1;
    slotRequestRef.current = requestId;
    setLoadingSlots(true);
    setSlotError('');

    try {
      const res = await fetch(`/api/public/availability?date=${date}`);
      const json = (await res.json()) as ApiResponse<AvailabilityData>;
      if (slotRequestRef.current !== requestId) return;

      const nextSlots = Array.isArray(json.data?.slots) ? json.data.slots : [];
      setSlots(nextSlots);
      setBookingTime('');
      if (nextSlots.length === 0) {
        setSlotError('Belum ada slot tersedia untuk tanggal ini. Pilih tanggal lain atau hubungi WhatsApp.');
      }
    } catch {
      if (slotRequestRef.current !== requestId) return;
      setSlots([]);
      setBookingTime('');
      setSlotError('Gagal memuat slot waktu. Silakan coba lagi atau hubungi WhatsApp.');
    } finally {
      if (slotRequestRef.current === requestId) {
        setLoadingSlots(false);
      }
    }
  }

  function handleDateChange(value: string) {
    setBookingDate(value);
    setSlots([]);
    setBookingTime('');
    setSlotError('');
    if (!value) {
      slotRequestRef.current += 1;
      setLoadingSlots(false);
      return;
    }
    void loadSlots(value);
  }

  function resetForm() {
    setSuccess(null);
    setProductId('');
    setCustomerName('');
    setCustomerPhone('');
    setBookingDate('');
    setBookingTime('');
    setSlots([]);
    slotRequestRef.current += 1;
    setPeopleCount('1');
    setLocationType('VILLA');
    setServiceAreaId('');
    setAddress('');
    setNotes('');
    setError('');
    setSlotError('');
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="page-shell">
          <div className="center-screen">
            <div className="surface-card success-card">
              <div className="success-icon">OK</div>
              <h1 className="page-title" style={{ color: 'var(--teal)', fontSize: '2rem' }}>
                Booking Diterima
              </h1>
              <p className="field-help" style={{ marginTop: 10 }}>
                Kode booking Anda:
              </p>
              <div className="booking-code">{success.bookingCode}</div>
              <p className="field-help" style={{ marginBottom: 24 }}>
                Tim kami akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal.
              </p>
              <a className="button button-wa full" href={success.waUrl} target="_blank" rel="noopener noreferrer">
                Konfirmasi via WhatsApp
              </a>
              <button className="button button-secondary full" type="button" onClick={resetForm} style={{ marginTop: 10 }}>
                Buat Booking Baru
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <div className="page-eyebrow">Booking</div>
            <h1 className="page-title">Pesan IV Therapy</h1>
            <p className="page-subtitle">
              Isi form singkat ini. Tim kami akan mengonfirmasi jadwal dan datang ke lokasi Anda di Bali.
            </p>
          </div>
        </section>

        <section className="booking-wrap">
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-card">
              <h2 className="form-card-title">Pilih Treatment</h2>
              <div className="option-grid" aria-live="polite">
                {loadingInitial ? (
                  <OptionSkeleton />
                ) : (
                  products.map((product) => (
                    <button
                      className={`treatment-option${productId === product.id ? ' active' : ''}`}
                      key={product.id}
                      type="button"
                      onClick={() => setProductId(product.id)}
                      aria-pressed={productId === product.id}
                    >
                      <div className="treatment-option-title">{product.name}</div>
                      <div className="treatment-option-price">{formatPrice(product)}</div>
                    </button>
                  ))
                )}
              </div>
              {!loadingInitial && products.length === 0 && (
                <p className="field-help" style={{ marginTop: 14 }}>
                  Treatment belum tersedia. Silakan hubungi WhatsApp untuk booking manual.
                </p>
              )}
            </div>

            <div className="form-card">
              <h2 className="form-card-title">Data Diri</h2>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Nama Lengkap *</span>
                  <input
                    className="control"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Nama Anda"
                  />
                </label>
                <label className="field">
                  <span className="field-label">No. WhatsApp *</span>
                  <input
                    className="control"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    inputMode="tel"
                    placeholder="+62 812 3456 7890"
                  />
                </label>
              </div>
            </div>

            <div className="form-card">
              <h2 className="form-card-title">Jadwal & Lokasi</h2>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Tanggal *</span>
                  <input
                    className="control"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    min={minDate}
                  />
                </label>
                <label className="field">
                  <span className="field-label">
                    Waktu *
                    {loadingSlots && <span className="inline-loading">Memuat slot</span>}
                  </span>
                  <select
                    className="control"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    required
                    disabled={!bookingDate || loadingSlots || slots.length === 0}
                  >
                    <option value="">{bookingDate ? 'Pilih waktu...' : 'Pilih tanggal dulu'}</option>
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {slotError && <span className="field-help">{slotError}</span>}
                </label>

                <label className="field">
                  <span className="field-label">Jumlah Orang *</span>
                  <input
                    className="control"
                    type="number"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    required
                    min="1"
                    max="10"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Tipe Lokasi *</span>
                  <select
                    className="control"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    required
                  >
                    {LOCATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>

                <label className="field full">
                  <span className="field-label">Area Layanan *</span>
                  <select
                    className="control"
                    value={serviceAreaId}
                    onChange={(e) => setServiceAreaId(e.target.value)}
                    required
                    disabled={loadingInitial || areas.length === 0}
                  >
                    <option value="">{loadingInitial ? 'Memuat area...' : 'Pilih area layanan...'}</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </label>

                <label className="field full">
                  <span className="field-label">Alamat Lengkap *</span>
                  <textarea
                    className="control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Nama villa/hotel, no. kamar, jalan..."
                  />
                </label>

                <label className="field full">
                  <span className="field-label">Catatan Tambahan</span>
                  <textarea
                    className="control"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Kondisi khusus, alergi, atau info tambahan..."
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
                {selectedProduct && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={waBookingUrl(selectedProduct.name, selectedProduct.price_label ?? undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#167a3f', fontWeight: 800 }}
                    >
                      Pesan langsung via WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              className={`button button-primary full${submitting ? ' loading' : ''}`}
              type="submit"
              disabled={submitting || loadingInitial || !productId}
            >
              {submitting ? 'Memproses Booking' : 'Kirim Booking'}
            </button>

            <p className="field-help" style={{ textAlign: 'center' }}>
              Dengan mengirim form ini, Anda menyetujui{' '}
              <Link href="/legal/terms-conditions" style={{ color: 'var(--ocean)', fontWeight: 700 }}>
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/legal/privacy-policy" style={{ color: 'var(--ocean)', fontWeight: 700 }}>
                Kebijakan Privasi
              </Link>
              .
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

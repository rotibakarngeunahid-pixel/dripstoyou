'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { useLanguage } from '@/contexts/language';

/* ─── Types ─── */
type ApiResponse<T> = { success?: boolean; message?: string; data?: T; error?: string };

type Product = {
  id: string;
  slug: string;
  name: string;
  price_label: string | null;
  price_amount: number;
  short_description?: string | null;
  duration_minutes?: number | null;
  label?: string | null;
};

type Area = { id: string; name: string };
type AvailabilityData = { available: boolean; slots: string[] };
type BookingResult = { bookingCode: string; bookingDate: string; bookingTime: string; productName: string };

type FormState = {
  date: string;
  time: string;
  people: number;
  locType: string;
  areaId: string;
  address: string;
  name: string;
  phone: string;
  notes: string;
};

/* ─── Translations ─── */
interface BK {
  stepLabels: string[];
  locTypes: { v: string; l: string }[];
  step1Title: string; step1Sub: string; step1Next: string; step1Empty: string;
  schedTitle: string; schedSub: string;
  locTitle: string; locSub: string;
  dateLabel: string; timeLabel: string; loadingSlots: string;
  noSlots: string; slotHint: string;
  peopleLabel: string; locTypeLabel: string;
  areaLabel: string; areaDefault: string;
  addressLabel: string; addressPlaceholder: string;
  step3Title: string; step3Sub: string;
  nameLabel: string; namePlaceholder: string;
  phoneLabel: string; phonePlaceholder: string;
  notesLabel: string; notesPlaceholder: string;
  agree: (terms: React.ReactNode, privacy: React.ReactNode) => React.ReactNode;
  btnBack: string; btnNext2: string; btnSubmit: string; btnSubmitting: string;
  sidebarTitle: string; sidebarEmpty: string;
  sidebarDate: string; sidebarTime: string; sidebarArea: string;
  sidebarLoc: string; sidebarPeople: string;
  sidebarTotal: string; sidebarNote: string;
  waQuestion: string; waLink: string; waCaption: string;
  successTitle: string; successSub: string; codeLabel: string;
  btnWa: string; btnNew: string;
  waMsg: string; waDateLabel: string; waNameLabel: string; waAreaLabel: string;
  heroEyebrow: string; heroh1: string; heroh1em: string; heroP: string; heroPills: string[];
  summaryEyebrow: string;
  people1: (n: number) => string;
  errNoTreatment: string; errLoad: string; errSubmit: string; errNetwork: string;
  detailLabels: string[];
}

const BK_TEXT: Record<'en' | 'id', BK> = {
  en: {
    stepLabels: ['Treatment', 'Schedule', 'Details'],
    locTypes: [
      { v: 'VILLA',   l: 'Villa' },
      { v: 'HOTEL',   l: 'Hotel' },
      { v: 'RUMAH',   l: 'Home' },
      { v: 'AIRBNB',  l: 'Airbnb' },
      { v: 'LAINNYA', l: 'Other' },
    ],
    step1Title: 'Choose Your Treatment',
    step1Sub: 'Each drip is formulated for your specific need',
    step1Next: 'Continue to Schedule',
    step1Empty: 'No treatments available. Please contact us via WhatsApp to book manually.',
    schedTitle: 'Choose Schedule',
    schedSub: 'Available daily, 08:00–18:00 WITA',
    locTitle: 'Location',
    locSub: 'We come to you anywhere in Bali',
    dateLabel: 'Date *',
    timeLabel: 'Time *',
    loadingSlots: ' Loading…',
    noSlots: 'No slots available for this date. Please choose another date.',
    slotHint: 'Select a date first.',
    peopleLabel: 'Number of Guests *',
    locTypeLabel: 'Location Type *',
    areaLabel: 'Service Area *',
    areaDefault: 'Select service area…',
    addressLabel: 'Full Address *',
    addressPlaceholder: 'Villa/hotel name, room number, street name…',
    step3Title: 'Your Details',
    step3Sub: 'For booking confirmation and WhatsApp contact',
    nameLabel: 'Full Name *',
    namePlaceholder: 'Your name',
    phoneLabel: 'WhatsApp Number *',
    phonePlaceholder: '+62 812 3456 7890',
    notesLabel: 'Additional Notes',
    notesPlaceholder: 'Special conditions, allergies, or other info…',
    agree: (terms: React.ReactNode, privacy: React.ReactNode) => (
      <>I agree to the {terms} and {privacy} of Drips To You Bali.</>
    ),
    btnBack: 'Back',
    btnNext2: 'Next: Details',
    btnSubmit: 'Submit Booking',
    btnSubmitting: 'Processing…',
    sidebarTitle: 'Booking Summary',
    sidebarEmpty: 'Select a treatment to see the summary',
    sidebarDate: 'Date',
    sidebarTime: 'Time',
    sidebarArea: 'Area',
    sidebarLoc: 'Location',
    sidebarPeople: 'Guests',
    sidebarTotal: 'Estimated Total',
    sidebarNote: 'Final price confirmed via WhatsApp',
    waQuestion: 'Have a question?',
    waLink: 'Chat us on WhatsApp',
    waCaption: '— available 24/7.',
    successTitle: 'Booking Received!',
    successSub: 'Our team will contact you via WhatsApp within 30 minutes to confirm your appointment.',
    codeLabel: 'Your Booking Code',
    btnWa: 'Confirm via WhatsApp',
    btnNew: 'Make Another Booking',
    waMsg: 'Hello! I just made a booking via the website.',
    waDateLabel: 'Date',
    waNameLabel: 'Name',
    waAreaLabel: 'Area',
    heroEyebrow: 'Mobile IV Therapy · Bali',
    heroh1: 'Book Your',
    heroh1em: 'Drip',
    heroP: 'Three easy steps — choose your treatment, pick a schedule, and our team comes to you.',
    heroPills: ['✓ Door-to-door', '✓ 45–75 minutes', '✓ Experienced doctors', '✓ Fast confirmation'],
    summaryEyebrow: 'Summary',
    people1: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
    errNoTreatment: 'Please select a treatment first.',
    errLoad: 'Failed to load data. Please reload the page.',
    errSubmit: 'Failed to create booking. Please try via WhatsApp.',
    errNetwork: 'Network error. Please try again or contact us via WhatsApp.',
    detailLabels: ['Treatment', 'Date', 'Time', 'Area', 'Name', 'Total'],
  },
  id: {
    stepLabels: ['Treatment', 'Jadwal', 'Detail'],
    locTypes: [
      { v: 'VILLA',   l: 'Villa' },
      { v: 'HOTEL',   l: 'Hotel' },
      { v: 'RUMAH',   l: 'Rumah' },
      { v: 'AIRBNB',  l: 'Airbnb' },
      { v: 'LAINNYA', l: 'Lainnya' },
    ],
    step1Title: 'Pilih Treatment',
    step1Sub: 'Setiap drip diformulasikan untuk kebutuhan spesifik Anda',
    step1Next: 'Lanjut ke Jadwal',
    step1Empty: 'Treatment belum tersedia. Silakan hubungi WhatsApp untuk booking manual.',
    schedTitle: 'Pilih Jadwal',
    schedSub: 'Tersedia setiap hari, 08:00–18:00 WITA',
    locTitle: 'Lokasi',
    locSub: 'Kami datang ke tempat Anda di seluruh Bali',
    dateLabel: 'Tanggal *',
    timeLabel: 'Waktu *',
    loadingSlots: ' Memuat…',
    noSlots: 'Tidak ada slot tersedia untuk tanggal ini. Pilih tanggal lain.',
    slotHint: 'Pilih tanggal terlebih dahulu.',
    peopleLabel: 'Jumlah Peserta *',
    locTypeLabel: 'Tipe Lokasi *',
    areaLabel: 'Area Layanan *',
    areaDefault: 'Pilih area layanan…',
    addressLabel: 'Alamat Lengkap *',
    addressPlaceholder: 'Nama villa/hotel, nomor kamar, nama jalan…',
    step3Title: 'Data Diri',
    step3Sub: 'Untuk konfirmasi jadwal dan pengiriman detail booking',
    nameLabel: 'Nama Lengkap *',
    namePlaceholder: 'Nama Anda',
    phoneLabel: 'No. WhatsApp *',
    phonePlaceholder: '+62 812 3456 7890',
    notesLabel: 'Catatan Tambahan',
    notesPlaceholder: 'Kondisi khusus, alergi, atau info lainnya…',
    agree: (terms: React.ReactNode, privacy: React.ReactNode) => (
      <>Saya menyetujui {terms} serta {privacy} Drips To You Bali.</>
    ),
    btnBack: 'Kembali',
    btnNext2: 'Lanjut ke Detail',
    btnSubmit: 'Kirim Booking',
    btnSubmitting: 'Memproses…',
    sidebarTitle: 'Ringkasan Booking',
    sidebarEmpty: 'Pilih treatment untuk melihat ringkasan',
    sidebarDate: 'Tanggal',
    sidebarTime: 'Waktu',
    sidebarArea: 'Area',
    sidebarLoc: 'Lokasi',
    sidebarPeople: 'Peserta',
    sidebarTotal: 'Total Estimasi',
    sidebarNote: 'Harga final dikonfirmasi via WhatsApp',
    waQuestion: 'Ada pertanyaan?',
    waLink: 'Chat kami di WhatsApp',
    waCaption: '— siap membantu 24/7.',
    successTitle: 'Booking Diterima!',
    successSub: 'Tim kami akan menghubungi Anda via WhatsApp dalam 30 menit untuk konfirmasi jadwal.',
    codeLabel: 'Kode Booking Anda',
    btnWa: 'Konfirmasi via WhatsApp',
    btnNew: 'Buat Booking Baru',
    waMsg: 'Halo! Saya baru saja booking via website.',
    waDateLabel: 'Tanggal',
    waNameLabel: 'Nama',
    waAreaLabel: 'Area',
    heroEyebrow: 'Mobile IV Therapy · Bali',
    heroh1: 'Book Your',
    heroh1em: 'Drip',
    heroP: 'Tiga langkah mudah — pilih treatment, tentukan jadwal, dan tim kami datang ke lokasi Anda.',
    heroPills: ['✓ Door-to-door', '✓ 45–75 menit', '✓ Dokter berpengalaman', '✓ Konfirmasi cepat'],
    summaryEyebrow: 'Ringkasan',
    people1: (n: number) => `${n} orang`,
    errNoTreatment: 'Pilih treatment terlebih dahulu.',
    errLoad: 'Gagal memuat data. Silakan muat ulang halaman.',
    errSubmit: 'Gagal membuat booking. Silakan coba via WhatsApp.',
    errNetwork: 'Network error. Silakan coba lagi atau hubungi via WhatsApp.',
    detailLabels: ['Treatment', 'Tanggal', 'Waktu', 'Area', 'Nama', 'Total'],
  },
};

/* ─── Constants ─── */
const ALL_TIMES = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

const GRADIENTS = [
  'linear-gradient(140deg,#c8773a,#9e4c1a)',
  'linear-gradient(140deg,#2d9b8e,#185e57)',
  'linear-gradient(140deg,#c9a424,#8a6d0b)',
  'linear-gradient(140deg,#b26892,#7a3862)',
  'linear-gradient(140deg,#4a6fae,#2a4878)',
  'linear-gradient(140deg,#6a5caa,#3e307a)',
];

/* ─── Utils ─── */
const fmtIDR = (n: number) => 'IDR ' + n.toLocaleString('id-ID');
const fmtDate = (s: string) => {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};
function formatPrice(p: Product) {
  return p.price_label ?? fmtIDR(p.price_amount);
}
function initForm(): FormState {
  return { date: '', time: '', people: 1, locType: 'VILLA', areaId: '', address: '', name: '', phone: '', notes: '' };
}

/* ─── Icons ─── */
function IcCheck() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}
function IcArrowRight() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}
function IcArrowLeft() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}
function IcWA() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function IcCal() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="12" rx="2" /><path d="M1 7h14M5 1v4M11 1v4" />
    </svg>
  );
}
function IcClock() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="7" /><path d="M8 4v4l3 2" />
    </svg>
  );
}
function IcPin() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1C5.79 1 4 2.79 4 5c0 3 4 9 4 9s4-6 4-9c0-2.21-1.79-4-4-4z" /><circle cx="8" cy="5" r="1.5" />
    </svg>
  );
}
function IcHome() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7L8 1l7 6" /><path d="M3 6v8h4v-4h2v4h4V6" />
    </svg>
  );
}
function IcPeople() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="4" r="2.5" /><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" />
      <path d="M11 2c1.38 0 2.5 1.12 2.5 2.5S12.38 7 11 7" /><path d="M14 14c0-2.21-1.34-4.1-3.24-4.73" />
    </svg>
  );
}

const locIcon: Record<string, React.ReactNode> = {
  VILLA: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="12" height="8" rx="1"/><path d="M1 8L8 2l7 6"/><rect x="6" y="11" width="4" height="4"/>
    </svg>
  ),
  HOTEL: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="12" rx="1"/><path d="M2 7h12"/><rect x="5" y="10" width="2" height="2"/><rect x="9" y="10" width="2" height="2"/><path d="M6 3V2M10 3V2"/>
    </svg>
  ),
  RUMAH: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7L8 1l7 6"/><path d="M3 6v9h4v-4h2v4h4V6"/>
    </svg>
  ),
  AIRBNB: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="2.5"/><path d="M4 13.5c0-2.21 1.79-4 4-4s4 1.79 4 4"/><path d="M13 7l1 1-1 1"/>
    </svg>
  ),
  LAINNYA: (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1C5.79 1 4 2.79 4 5c0 3 4 9 4 9s4-6 4-9c0-2.21-1.79-4-4-4z"/><circle cx="8" cy="5" r="1.5"/>
    </svg>
  ),
};

/* ─── Step Bar ─── */
function StepBar({ step, bk }: { step: number; bk: BK }) {
  return (
    <div className="bk-step-bar-wrap">
      <div className="bk-step-bar">
        {bk.stepLabels.map((lbl, i) => {
          const n = i + 1;
          const state = step > n ? 'done' : step === n ? 'active' : '';
          return (
            <div className={`bk-step-item ${state}`} key={n}>
              <div className="bk-step-circle">
                {step > n ? <IcCheck /> : n}
              </div>
              <span className="bk-step-label">{lbl}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */
function Sidebar({
  bk, product, productGrad, date, time, areaName, people, locType,
}: {
  bk: BK;
  product: Product | undefined;
  productGrad: string | undefined;
  date: string;
  time: string;
  areaName: string;
  people: number;
  locType: string;
}) {
  const loc = bk.locTypes.find(l => l.v === locType);
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281200000000';
  const rows = [
    { ic: <IcCal />,    k: bk.sidebarDate,   v: date ? fmtDate(date) : null },
    { ic: <IcClock />,  k: bk.sidebarTime,   v: time || null },
    { ic: <IcPin />,    k: bk.sidebarArea,   v: areaName || null },
    { ic: <IcHome />,   k: bk.sidebarLoc,    v: loc?.l || null },
    { ic: <IcPeople />, k: bk.sidebarPeople, v: bk.people1(people) },
  ].filter(r => r.v);

  return (
    <aside className="bk-sidebar bk-desktop-only">
      <div className="bk-sum-card">
        <div className="bk-sum-top">
          <div className="bk-sum-eyebrow">{bk.sidebarTitle}</div>
          {product ? (
            <>
              <div className="bk-sum-swatch" style={{ background: productGrad }} />
              <div className="bk-sum-name">{product.name}</div>
              <div className="bk-sum-price">{formatPrice(product)}</div>
              {product.short_description && (
                <div className="bk-sum-subdesc">{product.short_description}</div>
              )}
            </>
          ) : (
            <div className="bk-sum-empty">{bk.sidebarEmpty}</div>
          )}
        </div>

        {rows.length > 0 && (
          <div className="bk-sum-rows">
            {rows.map(r => (
              <div className="bk-sum-row" key={r.k}>
                <div className="bk-sum-row-ic">{r.ic}</div>
                <div>
                  <div className="bk-sum-row-k">{r.k}</div>
                  <div className="bk-sum-row-v">{r.v}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {product && (
          <div className="bk-sum-footer">
            <div className="bk-sum-total-k">{bk.sidebarTotal}</div>
            <div className="bk-sum-total-v">{fmtIDR(product.price_amount * people)}</div>
            {people > 1 && <div className="bk-sum-note">{people} × {fmtIDR(product.price_amount)}</div>}
            <div className="bk-sum-note" style={{ marginTop: 6 }}>{bk.sidebarNote}</div>
          </div>
        )}
      </div>

      <div className="bk-wa-nudge">
        <div className="bk-wa-nudge-ic"><IcWA /></div>
        <div className="bk-wa-nudge-txt">
          {bk.waQuestion}{' '}
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
            <strong>{bk.waLink}</strong>
          </a>{' '}
          {bk.waCaption}
        </div>
      </div>
    </aside>
  );
}

/* ─── Step 1: Treatment ─── */
function Step1({
  bk, products, loading, selectedId, onSelect, onNext,
}: {
  bk: BK;
  products: Product[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="bk-fade-in">
      <div className="bk-card">
        <div className="bk-card-title">{bk.step1Title}</div>
        <div className="bk-card-subtitle">{bk.step1Sub}</div>
        <div className="bk-tc-grid">
          {loading
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="bk-tc">
                  <div className="bk-tc-cap" style={{ background: '#e8e6e1', animation: 'shimmer 1.3s infinite linear', backgroundSize: '800px 100%', backgroundImage: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)' }} />
                  <div className="bk-tc-body">
                    <div className="skeleton-line" style={{ width: '70%', marginBottom: 8 }} />
                    <div className="skeleton-line" style={{ width: '45%' }} />
                  </div>
                </div>
              ))
            : products.map((p, idx) => {
                const grad = GRADIENTS[idx % GRADIENTS.length];
                const sel = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`bk-tc${sel ? ' sel' : ''}`}
                    onClick={() => onSelect(p.id)}
                    aria-pressed={sel}
                  >
                    <div className="bk-tc-cap" style={{ background: grad }}>
                      <span className="bk-tc-initial">{p.name[0]}</span>
                      {p.label && (
                        <div className={`bk-tc-badge${p.label.toLowerCase() === 'premium' ? ' new' : ''}`}>
                          {p.label}
                        </div>
                      )}
                      <div className="bk-tc-check"><IcCheck /></div>
                    </div>
                    <div className="bk-tc-body">
                      <div className="bk-tc-name">{p.name}</div>
                      {p.short_description && <div className="bk-tc-desc">{p.short_description}</div>}
                      <div className="bk-tc-price">{formatPrice(p)}</div>
                      {p.duration_minutes && <div className="bk-tc-dur">{p.duration_minutes} min</div>}
                    </div>
                  </button>
                );
              })}
        </div>
        {!loading && products.length === 0 && (
          <p className="field-help" style={{ marginTop: 16 }}>{bk.step1Empty}</p>
        )}
      </div>
      <div className="bk-form-actions" style={{ marginTop: 14 }}>
        <button className="bk-btn bk-btn-primary" onClick={onNext} disabled={!selectedId}>
          {bk.step1Next} <IcArrowRight />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Schedule + Location ─── */
function Step2({
  bk, form, setForm, areas, slots, loadingSlots, slotError, onDateChange, onNext, onBack,
}: {
  bk: BK;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  areas: Area[];
  slots: string[];
  loadingSlots: boolean;
  slotError: string;
  onDateChange: (date: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const canNext = form.date && form.time && form.areaId && form.address.trim().length > 4;

  return (
    <div className="bk-fade-in">
      <div className="bk-card">
        <div className="bk-card-title">{bk.schedTitle}</div>
        <div className="bk-card-subtitle">{bk.schedSub}</div>
        <div className="bk-sched-grid">
          <label className="bk-field">
            <span className="bk-field-label">{bk.dateLabel}</span>
            <input
              type="date"
              className="control"
              value={form.date}
              min={minDate}
              onChange={e => onDateChange(e.target.value)}
            />
          </label>

          <div className="bk-field">
            <span className="bk-field-label">
              {bk.timeLabel}
              {loadingSlots && <span className="bk-loading-text">{bk.loadingSlots}</span>}
            </span>
            {loadingSlots ? (
              <div className="bk-slot-loading"><span /><span /><span /></div>
            ) : slots.length > 0 ? (
              <div className="bk-slot-grid">
                {ALL_TIMES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`bk-slot-btn${form.time === s ? ' act' : ''}${!slots.includes(s) ? ' dis' : ''}`}
                    disabled={!slots.includes(s)}
                    onClick={() => setForm(f => ({ ...f, time: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : slotError ? (
              <div className="bk-alert-err">{slotError}</div>
            ) : (
              <div className="bk-alert-info">
                {form.date ? bk.loadingSlots.trim() : bk.slotHint}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bk-card" style={{ marginTop: 14 }}>
        <div className="bk-card-title">{bk.locTitle}</div>
        <div className="bk-card-subtitle">{bk.locSub}</div>
        <div className="bk-loc-fields">

          <div className="bk-field">
            <span className="bk-field-label">{bk.peopleLabel}</span>
            <div className="bk-stepper-wrap">
              <div className="bk-stepper">
                <button
                  type="button"
                  className="bk-stepper-btn"
                  onClick={() => setForm(f => ({ ...f, people: Math.max(1, f.people - 1) }))}
                  aria-label="Decrease"
                >−</button>
                <div className="bk-stepper-val">{form.people}</div>
                <button
                  type="button"
                  className="bk-stepper-btn"
                  onClick={() => setForm(f => ({ ...f, people: Math.min(10, f.people + 1) }))}
                  aria-label="Increase"
                >+</button>
              </div>
              {form.people > 1 && (
                <span className="bk-people-badge">{bk.people1(form.people)}</span>
              )}
            </div>
          </div>

          <div className="bk-field">
            <span className="bk-field-label">{bk.locTypeLabel}</span>
            <div className="bk-loc-wrap">
              {bk.locTypes.map(lt => (
                <button
                  key={lt.v}
                  type="button"
                  className={`bk-loc-btn${form.locType === lt.v ? ' act' : ''}`}
                  onClick={() => setForm(f => ({ ...f, locType: lt.v }))}
                >
                  {locIcon[lt.v]} {lt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="bk-field">
            <span className="bk-field-label">{bk.areaLabel}</span>
            <select
              className="control bk-select"
              value={form.areaId}
              onChange={e => setForm(f => ({ ...f, areaId: e.target.value }))}
            >
              <option value="">{bk.areaDefault}</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="bk-field">
            <span className="bk-field-label">{bk.addressLabel}</span>
            <textarea
              className="control"
              rows={3}
              value={form.address}
              placeholder={bk.addressPlaceholder}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="bk-form-actions" style={{ marginTop: 14 }}>
        <button type="button" className="bk-btn bk-btn-ghost" onClick={onBack}>
          <IcArrowLeft /> {bk.btnBack}
        </button>
        <button className="bk-btn bk-btn-primary" onClick={onNext} disabled={!canNext}>
          {bk.btnNext2} <IcArrowRight />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Details + Submit ─── */
function Step3({
  bk, form, setForm, product, productGrad, areaName, submitting, error, onBack, onSubmit,
}: {
  bk: BK;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  product: Product | undefined;
  productGrad: string | undefined;
  areaName: string;
  submitting: boolean;
  error: string;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const canSubmit = form.name.trim().length > 1 && form.phone.trim().length >= 7 && agreed;
  const loc = bk.locTypes.find(l => l.v === form.locType);

  return (
    <form className="bk-fade-in" onSubmit={onSubmit}>
      <div className="bk-card">
        <div className="bk-card-title">{bk.step3Title}</div>
        <div className="bk-card-subtitle">{bk.step3Sub}</div>
        <div className="bk-details-grid">
          <label className="bk-field">
            <span className="bk-field-label">{bk.nameLabel}</span>
            <input
              type="text"
              className="control"
              placeholder={bk.namePlaceholder}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="bk-field">
            <span className="bk-field-label">{bk.phoneLabel}</span>
            <input
              type="tel"
              className="control"
              placeholder={bk.phonePlaceholder}
              inputMode="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="bk-field bk-field-full">
            <span className="bk-field-label">{bk.notesLabel}</span>
            <textarea
              className="control"
              rows={2}
              placeholder={bk.notesPlaceholder}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>
      </div>

      {product && (
        <div className="bk-mob-sum bk-mobile-only">
          <div className="bk-mob-sum-swatch" style={{ background: productGrad }} />
          <div className="bk-mob-sum-eyebrow">{bk.summaryEyebrow}</div>
          <div className="bk-mob-sum-name">{product.name}</div>
          <div className="bk-mob-sum-price">{fmtIDR(product.price_amount * form.people)}</div>
          <div className="bk-mob-sum-divider" />
          {form.date && <div className="bk-mob-sum-row">📅 {fmtDate(form.date)} · {form.time} WITA</div>}
          {areaName && <div className="bk-mob-sum-row">📍 {areaName}{loc ? ` · ${loc.l}` : ''}</div>}
          <div className="bk-mob-sum-row">👥 {bk.people1(form.people)}</div>
        </div>
      )}

      <div className="bk-card" style={{ marginTop: 14 }}>
        <label className="bk-agree-row">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <span className="bk-agree-txt">
            {bk.agree(
              <Link href="/legal/terms-conditions">Terms &amp; Conditions</Link>,
              <Link href="/legal/privacy-policy">Privacy Policy</Link>,
            )}
          </span>
        </label>
      </div>

      {error && <div className="bk-alert-err" style={{ marginTop: 12 }}>{error}</div>}

      <div className="bk-form-actions" style={{ marginTop: 14 }}>
        <button type="button" className="bk-btn bk-btn-ghost" onClick={onBack} disabled={submitting}>
          <IcArrowLeft /> {bk.btnBack}
        </button>
        <button type="submit" className="bk-btn bk-btn-gold" disabled={!canSubmit || submitting}>
          {submitting
            ? <><span className="bk-spin" /> {bk.btnSubmitting}</>
            : <>{bk.btnSubmit} <IcArrowRight /></>}
        </button>
      </div>
    </form>
  );
}

/* ─── Success Screen ─── */
function SuccessScreen({
  bk, bookingCode, product, form, areaName, onReset,
}: {
  bk: BK;
  bookingCode: string;
  product: Product | undefined;
  form: FormState;
  areaName: string;
  onReset: () => void;
}) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281200000000';
  const waText = encodeURIComponent([
    bk.waMsg,
    '',
    `Kode Booking: *${bookingCode}*`,
    `Treatment: ${product?.name ?? ''}`,
    `${bk.waDateLabel}: ${form.date} pukul ${form.time} WITA`,
    `${bk.waNameLabel}: ${form.name}`,
    `${bk.waAreaLabel}: ${areaName}`,
  ].join('\n'));

  const details: [string, string][] = [
    [bk.detailLabels[0], product?.name ?? '—'],
    [bk.detailLabels[1], fmtDate(form.date) || '—'],
    [bk.detailLabels[2], form.time ? form.time + ' WITA' : '—'],
    [bk.detailLabels[3], areaName || '—'],
    [bk.detailLabels[4], form.name],
    [bk.detailLabels[5], product ? fmtIDR(product.price_amount * form.people) : '—'],
  ];

  return (
    <div className="bk-success-wrap bk-fade-in">
      <div className="bk-success-card">
        <div className="bk-success-ico">
          <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#167a3f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5,16 12,23 27,9" />
          </svg>
        </div>
        <div className="bk-success-ttl">{bk.successTitle}</div>
        <div className="bk-success-sub">{bk.successSub}</div>

        <div className="bk-code-box">
          <div className="bk-code-k">{bk.codeLabel}</div>
          <div className="bk-code-v">{bookingCode}</div>
        </div>

        <div className="bk-success-deets">
          {details.map(([k, v]) => (
            <div className="bk-deet-row" key={k}>
              <span className="bk-deet-k">{k}</span>
              <span className="bk-deet-v" style={k === bk.detailLabels[5] ? { color: 'var(--gold)' } : {}}>{v}</span>
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/${waNumber}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bk-btn bk-btn-wa bk-btn-full"
        >
          <IcWA /> {bk.btnWa}
        </a>
        <button
          type="button"
          className="bk-btn bk-btn-ghost bk-btn-full"
          style={{ marginTop: 10 }}
          onClick={onReset}
        >
          {bk.btnNew}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BookingPage() {
  const { lang } = useLanguage();
  const bk = BK_TEXT[lang];

  const [products, setProducts]         = useState<Product[]>([]);
  const [areas, setAreas]               = useState<Area[]>([]);
  const [slots, setSlots]               = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError]       = useState('');

  const [step, setStep]           = useState(1);
  const [productId, setProductId] = useState('');
  const [form, setForm]           = useState<FormState>(initForm);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState<{ bookingCode: string } | null>(null);

  const slotReqRef = useRef(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch('/api/public/products').then(r => r.json() as Promise<ApiResponse<Product[]>>),
      fetch('/api/public/areas').then(r => r.json() as Promise<ApiResponse<Area[]>>),
    ]).then(([pJson, aJson]) => {
      if (!active) return;
      if (Array.isArray(pJson.data)) {
        setProducts(pJson.data);
        const requested = new URLSearchParams(window.location.search).get('treatment');
        if (requested) {
          const match = pJson.data.find(p => p.slug === requested || p.id === requested);
          if (match) setProductId(match.id);
        }
      }
      if (Array.isArray(aJson.data)) setAreas(aJson.data);
    }).catch(() => {
      if (active) setError(bk.errLoad);
    }).finally(() => {
      if (active) setLoadingInitial(false);
    });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSlots(date: string) {
    const reqId = ++slotReqRef.current;
    setLoadingSlots(true);
    setSlotError('');
    try {
      const res  = await fetch(`/api/public/availability?date=${date}`);
      const json = await res.json() as ApiResponse<AvailabilityData>;
      if (slotReqRef.current !== reqId) return;
      const next = Array.isArray(json.data?.slots) ? json.data!.slots : [];
      setSlots(next);
      setForm(f => ({ ...f, time: '' }));
      if (!next.length) setSlotError(bk.noSlots);
    } catch {
      if (slotReqRef.current !== reqId) return;
      setSlots([]);
      setForm(f => ({ ...f, time: '' }));
      setSlotError(bk.errLoad);
    } finally {
      if (slotReqRef.current === reqId) setLoadingSlots(false);
    }
  }

  function handleDateChange(date: string) {
    setForm(f => ({ ...f, date, time: '' }));
    setSlots([]);
    setSlotError('');
    if (!date) { slotReqRef.current++; setLoadingSlots(false); return; }
    void loadSlots(date);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!productId) { setError(bk.errNoTreatment); return; }
    setSubmitting(true);
    try {
      const res  = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName:  form.name,
          customerPhone: form.phone,
          bookingDate:   form.date,
          bookingTime:   form.time,
          peopleCount:   form.people,
          locationType:  form.locType,
          serviceAreaId: form.areaId || undefined,
          address:       form.address,
          notes:         form.notes || undefined,
        }),
      });
      const json = await res.json() as ApiResponse<BookingResult>;
      if (!res.ok || !json.data) {
        setError(json.message ?? json.error ?? bk.errSubmit);
        return;
      }
      setSuccess({ bookingCode: json.data.bookingCode });
    } catch {
      setError(bk.errNetwork);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSuccess(null);
    setStep(1);
    setProductId('');
    setForm(initForm());
    setSlots([]);
    setSlotError('');
    setError('');
    slotReqRef.current++;
  }

  const productIdx  = products.findIndex(p => p.id === productId);
  const product     = productIdx >= 0 ? products[productIdx] : undefined;
  const productGrad = productIdx >= 0 ? GRADIENTS[productIdx % GRADIENTS.length] : undefined;
  const areaName    = areas.find(a => a.id === form.areaId)?.name ?? '';

  if (success) {
    return (
      <>
        <Header />
        <div style={{ paddingTop: 64 }}>
          <SuccessScreen
            bk={bk}
            bookingCode={success.bookingCode}
            product={product}
            form={form}
            areaName={areaName}
            onReset={reset}
          />
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ paddingTop: 64 }}>
        <section className="bk-hero">
          <div className="bk-hero-glow-1" aria-hidden="true" />
          <div className="bk-hero-glow-2" aria-hidden="true" />
          <div className="bk-hero-inner">
            <div className="bk-hero-eyebrow">
              <span className="bk-hero-dot" aria-hidden="true" />
              {bk.heroEyebrow}
            </div>
            <h1 className="bk-hero-h1">{bk.heroh1} <em>{bk.heroh1em}</em></h1>
            <p className="bk-hero-p">{bk.heroP}</p>
            <div className="bk-hero-pills">
              {bk.heroPills.map(pill => (
                <span className="bk-hero-pill" key={pill}>{pill}</span>
              ))}
            </div>
          </div>
        </section>

        <StepBar step={step} bk={bk} />

        <div className="bk-layout">
          <main className="bk-main">
            {error && step === 1 && (
              <div className="bk-alert-err" style={{ marginBottom: 16 }}>{error}</div>
            )}

            {step === 1 && (
              <Step1
                bk={bk}
                products={products}
                loading={loadingInitial}
                selectedId={productId}
                onSelect={id => setProductId(id)}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2
                bk={bk}
                form={form}
                setForm={setForm}
                areas={areas}
                slots={slots}
                loadingSlots={loadingSlots}
                slotError={slotError}
                onDateChange={handleDateChange}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3
                bk={bk}
                form={form}
                setForm={setForm}
                product={product}
                productGrad={productGrad}
                areaName={areaName}
                submitting={submitting}
                error={error}
                onBack={() => setStep(2)}
                onSubmit={handleSubmit}
              />
            )}
          </main>

          <Sidebar
            bk={bk}
            product={product}
            productGrad={productGrad}
            date={form.date}
            time={form.time}
            areaName={areaName}
            people={form.people}
            locType={form.locType}
          />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}

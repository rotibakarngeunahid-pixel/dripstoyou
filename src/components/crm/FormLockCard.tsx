'use client';

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { formatDateTimeWITA, formatDayTime } from '@/lib/crm-format';

// Kartu "belum waktunya" untuk form on-site (screening / consent / treatment).
// Cermin dari time gate di php-api (crmRequireFormWindowOpen): form baru
// terbuka 30 menit sebelum jam booking.
export default function FormLockCard({
  backHref, formName, customerName, productName, bookingDate, bookingTime, opensAt,
}: {
  backHref: string;
  formName: string;
  customerName: string;
  productName: string;
  bookingDate: string;
  bookingTime: string;
  opensAt: string | null | undefined;
}) {
  return (
    <div className="crm-page mx-auto max-w-xl">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]">
        <ArrowLeft size={16} /> Kembali
      </Link>
      <div className="crm-card p-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0E7] text-[#C9944C]">
          <Clock size={24} />
        </span>
        <h2 className="crm-section-title mb-1">Form {formName} Belum Terbuka</h2>
        <p className="mx-auto mb-1 max-w-sm text-sm text-[#4d6060]">
          {customerName} · {productName}
        </p>
        <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
          Jadwal booking ini <strong>{formatDayTime(bookingDate, bookingTime)} WITA</strong>.
          Form {formName.toLowerCase()} baru bisa diisi mulai{' '}
          <strong>{opensAt ? formatDateTimeWITA(opensAt) : '30 menit sebelum jadwal'}</strong>{' '}
          (30 menit sebelum jadwal) agar data yang tercatat benar-benar kondisi pasien saat kunjungan.
        </p>
        <Link
          href={backHref}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#205251] px-6 text-sm font-semibold text-white"
        >
          Kembali ke Jadwal
        </Link>
      </div>
    </div>
  );
}

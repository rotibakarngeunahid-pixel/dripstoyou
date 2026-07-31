'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, Printer, Pencil } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah, formatDate } from '@/lib/crm-format';
import { downloadInvoicePdf, printInvoicePdf, type InvoiceData } from '@/lib/invoice-pdf';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, EmptyState } from '@/components/crm/states';

type InvoiceItem = { description: string; qty: number; price: number };
type InvoiceResponse = {
  invoice: { number: string; issued_date: string; issued_time: string };
  booking_code_display: string | null;
  patient: { name: string; phone: string; location: string; address: string | null };
  items: InvoiceItem[];
  charges: { addon_label: string; addon_fee: number; other_label: string; other_fee: number };
  subtotal: number;
  discount: { type: 'NONE' | 'PERCENT' | 'NOMINAL'; value: number; amount: number };
  grand_total: number;
  payment_method: string | null;
  nurse: string | null;
  doctor: string | null;
};

const PAYMENT_OPTIONS: { key: string; label: string }[] = [
  { key: 'CASH', label: 'Cash' },
  { key: 'QRIS', label: 'QRIS' },
  { key: 'TRANSFER', label: 'Bank Transfer' },
  { key: 'CARD', label: 'Credit / Debit Card' },
];

function baseMethod(method: string | null): string | null {
  if (!method) return null;
  return method.startsWith('DP_') ? method.slice(3) : method;
}

function toInvoiceData(d: InvoiceResponse): InvoiceData {
  return {
    invoiceNumber: d.invoice.number,
    issuedDate: d.invoice.issued_date,
    issuedTime: d.invoice.issued_time,
    bookingCode: d.booking_code_display,
    patientName: d.patient.name,
    patientPhone: d.patient.phone,
    patientLocation: d.patient.location,
    items: d.items,
    subtotal: d.subtotal,
    discountType: d.discount.type,
    discountValue: d.discount.value,
    discountAmount: d.discount.amount,
    grandTotal: d.grand_total,
    paymentMethod: d.payment_method,
    nurseName: d.nurse,
    doctorName: d.doctor,
  };
}

export default function InvoicePage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState<'' | 'pdf' | 'print'>('');

  const load = useCallback(async () => {
    setLoading(true);
    setNotAvailable('');
    try {
      setData(await crmGet<InvoiceResponse>(`/api/crm/invoice/${bookingId}`));
    } catch (e) {
      setNotAvailable(e instanceof Error ? e.message : 'Invoice tidak dapat dimuat');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <LoadingBlock label="Memuat invoice..." />;
  if (notAvailable || !data) {
    return (
      <div className="crm-page mx-auto max-w-2xl">
        <Link href={`/crm/treatment/${bookingId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-[#4d6060] hover:text-[#205251]">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <EmptyState
          title="Invoice Belum Tersedia"
          description={notAvailable || 'Invoice belum bisa dibuat untuk booking ini.'}
        />
      </div>
    );
  }

  const active = baseMethod(data.payment_method);

  async function handleDownload() {
    setBusy('pdf');
    try { await downloadInvoicePdf(toInvoiceData(data!)); } finally { setBusy(''); }
  }
  async function handlePrint() {
    setBusy('print');
    try { await printInvoicePdf(toInvoiceData(data!)); } finally { setBusy(''); }
  }

  return (
    <div className="crm-page mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/crm/booking/${data.booking_code_display ?? bookingId}`} className="inline-flex items-center gap-1 text-sm text-[#4d6060] hover:text-[#205251]">
          <ArrowLeft size={16} /> Kembali ke booking
        </Link>
        <div className="crm-actions">
          <button onClick={() => setShowEdit(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm font-medium text-[#205251]">
            <Pencil size={16} /> Edit Charges
          </button>
          <button onClick={handlePrint} disabled={!!busy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#205251] bg-white px-3 text-sm font-medium text-[#205251] disabled:opacity-60">
            <Printer size={16} /> {busy === 'print' ? 'Membuka…' : 'Print Invoice'}
          </button>
          <button onClick={handleDownload} disabled={!!busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#205251] px-3 text-sm font-medium text-white disabled:opacity-60">
            <Download size={16} /> {busy === 'pdf' ? 'Membuat…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice paper */}
      <div className="rounded-2xl border border-[#DBDAD7] bg-white p-6 shadow-sm sm:p-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F3F0E7] pb-6">
          <div className="flex items-center gap-3">
            <Image src="/img/drips-to-you-bali-icon.webp" alt="Drips To You - Bali" width={48} height={48} />
            <div>
              <p className="font-display text-xl font-bold text-[#205251]">DRIPS TO YOU</p>
              <p className="text-sm text-[#4d6060]">Mobile IV Therapy</p>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-[#EAD4AE] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#7a5a28]">
              Bill / Payment Receipt
            </span>
          </div>
        </div>

        {/* Invoice + Patient info */}
        <div className="grid gap-6 border-b border-[#F3F0E7] py-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#C9944C]">Patient Information</p>
            <InfoRow label="Patient Name" value={data.patient.name} />
            <InfoRow label="Phone Number" value={data.patient.phone} />
            <InfoRow label="Location" value={data.patient.location || '-'} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#C9944C]">Invoice Information</p>
            <InfoRow label="Invoice No." value={data.invoice.number} strong />
            <InfoRow label="Date" value={formatDate(data.invoice.issued_date)} />
            <InfoRow label="Time" value={`${data.invoice.issued_time} WITA`} />
          </div>
        </div>

        {/* Items */}
        <div className="py-6">
          <div className="overflow-x-auto rounded-xl border border-[#DBDAD7]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#D6EAEA] text-left text-xs font-semibold uppercase tracking-wide text-[#205251]">
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-center">Qty</th>
                  <th className="px-4 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, i) => (
                  <tr key={i} className="border-t border-[#F3F0E7]">
                    <td className="px-4 py-2.5 text-[#111a1a]">{it.description}</td>
                    <td className="px-4 py-2.5 text-center text-[#4d6060]">{it.qty}</td>
                    <td className="px-4 py-2.5 text-right text-[#111a1a]">{formatRupiah(it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment summary */}
        <div className="flex justify-end pb-6">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-[#4d6060]">
              <span>Subtotal</span><span className="text-[#111a1a]">{formatRupiah(data.subtotal)}</span>
            </div>
            {data.discount.type !== 'NONE' && (
              <div className="flex justify-between text-[#4d6060]">
                <span>Discount{data.discount.type === 'PERCENT' ? ` (${data.discount.value}%)` : ''}</span>
                <span className="text-[#C9944C]">- {formatRupiah(data.discount.amount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between rounded-xl bg-[#205251] px-4 py-3 text-base font-bold text-white">
              <span>Total Payment</span><span>{formatRupiah(data.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="border-t border-[#F3F0E7] py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#C9944C]">Payment Method</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <span key={opt.key} className="inline-flex items-center gap-2 text-sm text-[#111a1a]">
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${active === opt.key ? 'border-[#205251] bg-[#205251] text-white' : 'border-[#DBDAD7]'}`}>
                  {active === opt.key ? '✓' : ''}
                </span>
                {opt.label}
              </span>
            ))}
          </div>
        </div>

        {/* Medical info */}
        <div className="grid gap-2 border-t border-[#F3F0E7] py-6 sm:grid-cols-2">
          <InfoRow label="Nurse" value={data.nurse ?? '-'} />
          <InfoRow label="Doctor" value={data.doctor ?? '-'} />
        </div>

        {/* Footer */}
        <div className="border-t border-[#F3F0E7] pt-6 text-center">
          <p className="font-display text-lg font-bold text-[#205251]">Thank You</p>
          <p className="mt-1 text-sm text-[#4d6060]">Thank you for choosing Drips to You.</p>
          <p className="text-sm text-[#4d6060]">Your health, comfort, and recovery are our priority.</p>
          <p className="mt-3 text-xs font-semibold text-[#C9944C]">Drips to You – Mobile IV Therapy</p>
        </div>
      </div>

      {showEdit && (
        <EditChargesModal
          bookingId={bookingId}
          charges={data.charges}
          discount={data.discount}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-[#4d6060]">{label}</span>
      <span className={`text-right text-[#111a1a] ${strong ? 'font-semibold text-[#205251]' : ''}`}>{value}</span>
    </div>
  );
}

type Charges = { addon_label: string; addon_fee: number; other_label: string; other_fee: number };
type Discount = { type: 'NONE' | 'PERCENT' | 'NOMINAL'; value: number };

function EditChargesModal({
  bookingId, charges, discount, onClose, onSaved,
}: { bookingId: string; charges: Charges; discount: Discount; onClose: () => void; onSaved: () => void }) {
  const [addonLabel, setAddonLabel] = useState(charges.addon_label);
  const [addonFee, setAddonFee] = useState(String(charges.addon_fee));
  const [otherLabel, setOtherLabel] = useState(charges.other_label);
  const [otherFee, setOtherFee] = useState(String(charges.other_fee));
  const [discountType, setDiscountType] = useState<'NONE' | 'PERCENT' | 'NOMINAL'>(discount.type);
  const [discountValue, setDiscountValue] = useState(String(discount.value));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setSaving(true); setErr('');
    try {
      await crmSend(`/api/crm/invoice/${bookingId}`, 'POST', {
        action: 'update_charges',
        addon_label: addonLabel,
        addon_fee: Number(addonFee) || 0,
        other_label: otherLabel,
        other_fee: Number(otherFee) || 0,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
      });
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menyimpan'); setSaving(false); }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  return (
    <Modal open onClose={onClose} title="Edit Charges" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Add-on label<input value={addonLabel} onChange={(e) => setAddonLabel(e.target.value)} placeholder="Oral Add-on" className={inputCls} /></label>
          <label className="text-sm">Add-on fee<input type="number" value={addonFee} onChange={(e) => setAddonFee(e.target.value)} className={inputCls} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Other label<input value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} className={inputCls} /></label>
          <label className="text-sm">Other fee<input type="number" value={otherFee} onChange={(e) => setOtherFee(e.target.value)} className={inputCls} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Discount type
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'NONE' | 'PERCENT' | 'NOMINAL')} className={inputCls}>
              <option value="NONE">Tidak ada</option>
              <option value="PERCENT">Persen (%)</option>
              <option value="NOMINAL">Nominal (Rp)</option>
            </select>
          </label>
          <label className="text-sm">Discount value<input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} disabled={discountType === 'NONE'} className={`${inputCls} disabled:opacity-50`} /></label>
        </div>
      </div>
    </Modal>
  );
}

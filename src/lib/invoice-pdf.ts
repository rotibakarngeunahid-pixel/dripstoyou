// Renders a completed-treatment invoice as a downloadable / printable PDF —
// shared by the CRM invoice preview page (src/app/crm/invoice/[bookingId]).
// Mirrors the layout approach of consent-pdf.ts (same logo-loading helper,
// same jsPDF conventions) so both documents look like they belong to the
// same brand.

import { jsPDF } from 'jspdf';
import { formatRupiah } from './crm-format';

const LOGO_URL = '/img/drips-to-you-bali-icon.webp';

const TEAL: [number, number, number] = [32, 82, 81];
const GOLD: [number, number, number] = [201, 148, 76];
const PALE_AQUA: [number, number, number] = [214, 234, 234];
const GREY_TEXT: [number, number, number] = [77, 96, 96];
const DARK_TEXT: [number, number, number] = [17, 26, 26];
const LINE_GREY: [number, number, number] = [220, 218, 215];

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type InvoiceItem = { description: string; qty: number; price: number };
export type InvoiceData = {
  invoiceNumber: string;
  issuedDate: string; // "YYYY-MM-DD"
  issuedTime: string; // "HH:MM"
  bookingCode: string | null;
  patientName: string;
  patientPhone: string;
  patientLocation: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'NONE' | 'PERCENT' | 'NOMINAL';
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string | null; // raw enum e.g. 'DP_TRANSFER' | 'CASH' | null
  nurseName: string | null;
  doctorName: string | null;
};

const PAYMENT_CHECKBOXES: { key: string; label: string }[] = [
  { key: 'CASH', label: 'Cash' },
  { key: 'QRIS', label: 'QRIS' },
  { key: 'TRANSFER', label: 'Bank Transfer' },
  { key: 'CARD', label: 'Credit / Debit Card' },
];

function baseMethod(method: string | null): string | null {
  if (!method) return null;
  return method.startsWith('DP_') ? method.slice(3) : method;
}

function buildInvoiceDoc(doc: jsPDF, data: InvoiceData, logo: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 58;

  function ensureSpace(next: number) {
    if (y + next > pageHeight - margin) {
      doc.addPage();
      y = 58;
    }
  }
  function hr(color: [number, number, number] = LINE_GREY) {
    doc.setDrawColor(...color);
    doc.line(margin, y, pageWidth - margin, y);
  }
  function checkbox(x: number, yTop: number, checked: boolean) {
    const size = 9;
    doc.setDrawColor(...TEAL);
    if (checked) {
      doc.setFillColor(...TEAL);
      doc.rect(x, yTop, size, size, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.1);
      doc.line(x + 1.8, yTop + 4.8, x + 3.6, yTop + 7);
      doc.line(x + 3.6, yTop + 7, x + 7.3, yTop + 2);
      doc.setLineWidth(0.2);
    } else {
      doc.rect(x, yTop, size, size);
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────
  if (logo) {
    try { doc.addImage(logo, 'WEBP', margin, y - 22, 28, 28); } catch { /* logo optional */ }
  }
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...TEAL);
  doc.text('DRIPS TO YOU', margin + (logo ? 36 : 0), y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY_TEXT);
  doc.text('Mobile IV Therapy', margin + (logo ? 36 : 0), y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text('BILL / PAYMENT RECEIPT', pageWidth - margin, y - 2, { align: 'right' });

  y += 26;
  hr();
  y += 22;

  // ── Invoice info + Patient info (two columns) ───────────────────────────
  const colGap = 16;
  const colWidth = (contentWidth - colGap) / 2;
  const rightX = margin + colWidth + colGap;
  const sectionTop = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('PATIENT INFORMATION', margin, y);
  doc.text('INVOICE INFORMATION', rightX, y);
  y += 16;

  const patientRows: [string, string][] = [
    ['Patient Name', data.patientName],
    ['Phone Number', data.patientPhone],
    ['Location', data.patientLocation || '-'],
  ];
  const invoiceRows: [string, string][] = [
    ['Invoice No.', data.invoiceNumber],
    ['Date', formatDatePdf(data.issuedDate)],
    ['Time', `${data.issuedTime} WITA`],
  ];
  if (data.bookingCode) invoiceRows.push(['Booking', data.bookingCode]);

  const rowCount = Math.max(patientRows.length, invoiceRows.length);
  for (let i = 0; i < rowCount; i++) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    if (patientRows[i]) {
      const [label, value] = patientRows[i];
      doc.setTextColor(...GREY_TEXT);
      doc.text(label, margin, y);
      doc.setTextColor(...DARK_TEXT);
      const lines = doc.splitTextToSize(value, colWidth - 70);
      doc.text(lines, margin + 70, y);
    }
    if (invoiceRows[i]) {
      const [label, value] = invoiceRows[i];
      doc.setTextColor(...GREY_TEXT);
      doc.text(label, rightX, y);
      doc.setTextColor(...DARK_TEXT);
      doc.setFont('helvetica', 'bold');
      doc.text(value, rightX + 62, y);
    }
    y += 15;
  }
  y = Math.max(y, sectionTop + rowCount * 15 + 16) + 10;

  // ── Treatment items table ───────────────────────────────────────────────
  ensureSpace(24 + data.items.length * 18);
  const colDescW = contentWidth * 0.58;
  const colQtyW = contentWidth * 0.14;
  const qtyX = margin + colDescW;
  const priceRightX = pageWidth - margin;

  doc.setFillColor(...PALE_AQUA);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.text('DESCRIPTION', margin + 8, y + 13.5);
  doc.text('QTY', qtyX + colQtyW / 2, y + 13.5, { align: 'center' });
  doc.text('PRICE', priceRightX - 8, y + 13.5, { align: 'right' });
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const item of data.items) {
    ensureSpace(18);
    doc.setTextColor(...DARK_TEXT);
    doc.text(item.description, margin + 8, y + 13);
    doc.text(String(item.qty), qtyX + colQtyW / 2, y + 13, { align: 'center' });
    doc.text(formatRupiah(item.price), priceRightX - 8, y + 13, { align: 'right' });
    doc.setDrawColor(...LINE_GREY);
    doc.line(margin, y + 18, pageWidth - margin, y + 18);
    y += 18;
  }
  y += 16;

  // ── Payment summary ──────────────────────────────────────────────────────
  ensureSpace(90);
  const summaryX = pageWidth - margin - 220;
  const summaryW = 220;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY_TEXT);
  doc.text('Subtotal', summaryX, y);
  doc.setTextColor(...DARK_TEXT);
  doc.text(formatRupiah(data.subtotal), summaryX + summaryW, y, { align: 'right' });
  y += 15;

  if (data.discountType !== 'NONE') {
    const label = data.discountType === 'PERCENT' ? `Discount (${data.discountValue}%)` : 'Discount';
    doc.setTextColor(...GREY_TEXT);
    doc.text(label, summaryX, y);
    doc.setTextColor(...GOLD);
    doc.text(`- ${formatRupiah(data.discountAmount)}`, summaryX + summaryW, y, { align: 'right' });
    y += 15;
  }

  y += 6;
  doc.setFillColor(...TEAL);
  doc.rect(summaryX - 10, y - 12, summaryW + 10, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PAYMENT', summaryX, y + 5);
  doc.text(formatRupiah(data.grandTotal), summaryX + summaryW, y + 5, { align: 'right' });
  y += 34;

  // ── Payment method checkboxes ─────────────────────────────────────────────
  ensureSpace(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('PAYMENT METHOD', margin, y);
  y += 14;
  const active = baseMethod(data.paymentMethod);
  let cx = margin;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const opt of PAYMENT_CHECKBOXES) {
    checkbox(cx, y - 8, active === opt.key);
    doc.setTextColor(...DARK_TEXT);
    doc.text(opt.label, cx + 13, y);
    cx += 13 + doc.getTextWidth(opt.label) + 22;
  }
  y += 26;

  // ── Medical information ────────────────────────────────────────────────
  ensureSpace(46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('MEDICAL INFORMATION', margin, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY_TEXT);
  doc.text('Nurse', margin, y);
  doc.setTextColor(...DARK_TEXT);
  doc.text(data.nurseName || '-', margin + 70, y);
  doc.setTextColor(...GREY_TEXT);
  doc.text('Doctor', rightX, y);
  doc.setTextColor(...DARK_TEXT);
  doc.text(data.doctorName || '-', rightX + 62, y);
  y += 30;

  // ── Footer ───────────────────────────────────────────────────────────────
  ensureSpace(70);
  hr();
  y += 22;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TEAL);
  doc.text('Thank You', pageWidth / 2, y, { align: 'center' });
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GREY_TEXT);
  doc.text('Thank you for choosing Drips to You.', pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.text('Your health, comfort, and recovery are our priority.', pageWidth / 2, y, { align: 'center' });
  y += 18;
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text('Drips to You – Mobile IV Therapy', pageWidth / 2, y, { align: 'center' });
}

function formatDatePdf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

async function buildDoc(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const logo = await loadLogoDataUrl();
  buildInvoiceDoc(doc, data, logo);
  return doc;
}

export async function downloadInvoicePdf(data: InvoiceData): Promise<void> {
  const doc = await buildDoc(data);
  doc.save(`Invoice-${data.invoiceNumber}.pdf`);
}

export async function printInvoicePdf(data: InvoiceData): Promise<void> {
  const doc = await buildDoc(data);
  doc.autoPrint();
  window.open(String(doc.output('bloburl')), '_blank');
}

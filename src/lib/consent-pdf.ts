// Renders a signed informed-consent record as a downloadable PDF — shared by
// the public client-facing page (src/app/consent/[token]) and the CRM
// nurse-facing page (src/app/crm/consent/[bookingId]) so the document looks
// identical regardless of who downloads it.

import { jsPDF } from 'jspdf';
import { CONSENT_COPY, type ConsentLang } from './consent-copy';

const LOGO_URL = '/img/drips-to-you-bali-icon.webp';

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

export type ConsentPdfData = {
  lang: ConsentLang;
  bookingCode: string | null;
  patientName: string;
  serviceName: string;
  patientNameSigned: string;
  agreedOnLabel: string;
  signatureDataUrl?: string | null;
};

export async function downloadConsentPdf(data: ConsentPdfData): Promise<void> {
  const t = CONSENT_COPY[data.lang];
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 60;

  function ensureSpace(next: number) {
    if (y + next > pageHeight - margin) {
      doc.addPage();
      y = 60;
    }
  }

  const logo = await loadLogoDataUrl();
  if (logo) {
    try { doc.addImage(logo, 'WEBP', margin, y - 26, 30, 30); } catch { /* logo optional */ }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(32, 82, 81);
  doc.text('DRIPS TO YOU - BALI', margin + (logo ? 38 : 0), y);
  y += 26;

  doc.setFontSize(16);
  doc.setTextColor(17, 26, 26);
  doc.text(t.title, margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(120, 130, 130);
  doc.text(t.subtitle, margin, y);
  y += 22;

  doc.setDrawColor(220, 218, 215);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.patient}:`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patientName, margin + 70, y);
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.service}:`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.serviceName, margin + 70, y);
  y += 15;
  if (data.bookingCode) {
    doc.setFont('helvetica', 'bold');
    doc.text('Booking:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.bookingCode, margin + 70, y);
    y += 15;
  }
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const introLines: string[] = doc.splitTextToSize(t.intro, contentWidth);
  ensureSpace(introLines.length * 13 + 10);
  doc.text(introLines, margin, y);
  y += introLines.length * 13 + 12;

  t.clauses.forEach((c, i) => {
    const bodyLines: string[] = doc.splitTextToSize(c.body, contentWidth);
    ensureSpace(14 + bodyLines.length * 13 + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${c.title}`, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 13 + 10;
  });

  ensureSpace(24);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  const agreeLines: string[] = doc.splitTextToSize(`✓ ${t.agreeCheckbox}`, contentWidth);
  doc.text(agreeLines, margin, y);
  y += agreeLines.length * 13 + 18;

  ensureSpace(100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 26, 26);
  doc.text(`${t.nameLabel}: ${data.patientNameSigned}`, margin, y);
  y += 18;

  if (data.signatureDataUrl) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 130);
    doc.text(`${t.signatureLabel}:`, margin, y);
    y += 8;
    try {
      doc.addImage(data.signatureDataUrl, 'PNG', margin, y, 160, 55);
      y += 65;
    } catch { /* signature optional in the PDF if the image fails to embed */ }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 90, 90);
  doc.text(`${t.agreedOn}: ${data.agreedOnLabel}`, margin, y);

  const safeCode = (data.bookingCode ?? 'consent').replace(/[^a-zA-Z0-9-]/g, '');
  doc.save(`informed-consent-${safeCode}.pdf`);
}

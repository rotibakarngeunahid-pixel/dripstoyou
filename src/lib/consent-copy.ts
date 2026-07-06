// Bilingual informed-consent legal text — shared by the nurse-facing CRM page
// (src/app/crm/consent/[bookingId]) and the public client-facing link page
// (src/app/consent/[token]) so the two never drift out of sync.

// Nama rumah sakit / mitra klinis — tampil di klausul 1.
// TODO: ganti '……..' dengan nama mitra klinis resmi begitu kontraknya final.
export const CLINICAL_PARTNER = '……..';

export type ConsentLang = 'en' | 'id';

export type ConsentCopy = {
  flag: string; langName: string;
  title: string; subtitle: string; intro: string;
  clauses: { title: string; body: string }[];
  patient: string; service: string;
  agreeCheckbox: string; nameLabel: string;
  signatureLabel: string; clear: string; signatureHint: string;
  agreedOn: string; submit: string; saving: string;
  alreadyAgreed: (date: string, name: string) => string;
  errName: string; errAgree: string;
};

export const CONSENT_COPY: Record<ConsentLang, ConsentCopy> = {
  en: {
    flag: '🇬🇧', langName: 'English',
    title: 'Informed Consent',
    subtitle: 'IV Therapy / Vitamin Injection — Mobile Service',
    intro: 'By signing this document, I acknowledge, understand, and agree to the following terms:',
    clauses: [
      {
        title: 'Authorization of Treatment',
        body: `I voluntarily request and authorize the fully licensed healthcare professionals from Drips To You - Bali (operating under the clinical partnership with ${CLINICAL_PARTNER}) to administer Intravenous (IV) Therapy / Vitamin Injections to me.`,
      },
      {
        title: 'Acknowledgement of Risks',
        body: 'I have been fully informed of the intended benefits as well as the minor potential risks associated with IV cannulation, including but not limited to: mild bruising (hematoma), localized swelling, temporary soreness/redness at the injection site, or mild dizziness.',
      },
      {
        title: 'Accuracy of Medical History',
        body: 'I certify that all information provided regarding my health status, medical history, and allergies is true and complete. Drips To You - Bali and its partner hospital shall be fully released from any liability regarding adverse reactions caused by undisclosed or inaccurate medical info.',
      },
      {
        title: 'Right to Refuse',
        body: 'I understand that I retain the right to refuse, delay, or terminate the medical procedure at any point during the session at my own discretion.',
      },
    ],
    patient: 'Patient', service: 'Service',
    agreeCheckbox: 'I have read, understood, and agree to all the terms above.',
    nameLabel: 'Patient Full Name',
    signatureLabel: 'Digital Signature', clear: 'Clear',
    signatureHint: 'Signature is optional — full name is required.',
    agreedOn: 'Agreed on', submit: 'Sign & Submit Consent', saving: 'Submitting…',
    alreadyAgreed: (date, name) => `Already signed on ${date} by ${name}.`,
    errName: 'Patient full name is required.',
    errAgree: 'Please tick the agreement checkbox first.',
  },
  id: {
    flag: '🇮🇩', langName: 'Indonesia',
    title: 'Persetujuan Tindakan Medis',
    subtitle: 'Informed Consent — IV Therapy / Injeksi Vitamin',
    intro: 'Dengan menandatangani dokumen ini, saya mengakui, memahami, dan menyetujui ketentuan-ketentuan berikut:',
    clauses: [
      {
        title: 'Otorisasi Tindakan',
        body: `Saya secara sukarela meminta dan memberikan wewenang kepada tenaga kesehatan berlisensi penuh dari Drips To You - Bali (yang beroperasi dalam kemitraan klinis dengan ${CLINICAL_PARTNER}) untuk memberikan Terapi Intravena (IV) / Injeksi Vitamin kepada saya.`,
      },
      {
        title: 'Pemahaman Risiko',
        body: 'Saya telah diberi informasi lengkap mengenai manfaat yang diharapkan serta potensi risiko ringan yang terkait dengan pemasangan kanula IV, termasuk namun tidak terbatas pada: memar ringan (hematoma), pembengkakan lokal, nyeri/kemerahan sementara di area suntikan, atau pusing ringan.',
      },
      {
        title: 'Keakuratan Riwayat Medis',
        body: 'Saya menyatakan bahwa seluruh informasi yang saya berikan mengenai kondisi kesehatan, riwayat medis, dan alergi saya adalah benar dan lengkap. Drips To You - Bali beserta rumah sakit mitranya dibebaskan sepenuhnya dari segala tanggung jawab atas reaksi merugikan yang disebabkan oleh informasi medis yang tidak diungkapkan atau tidak akurat.',
      },
      {
        title: 'Hak untuk Menolak',
        body: 'Saya memahami bahwa saya tetap berhak menolak, menunda, atau menghentikan prosedur medis kapan pun selama sesi berlangsung atas pertimbangan saya sendiri.',
      },
    ],
    patient: 'Pasien', service: 'Layanan',
    agreeCheckbox: 'Saya telah membaca, memahami, dan menyetujui seluruh ketentuan di atas.',
    nameLabel: 'Nama Lengkap Pasien',
    signatureLabel: 'Tanda Tangan Digital', clear: 'Hapus',
    signatureHint: 'Tanda tangan opsional — nama wajib diisi.',
    agreedOn: 'Disetujui', submit: 'Tandatangani & Kirim', saving: 'Menyimpan…',
    alreadyAgreed: (date, name) => `Sudah disetujui pada ${date} oleh ${name}.`,
    errName: 'Nama lengkap pasien wajib diisi.',
    errAgree: 'Centang persetujuan terlebih dahulu.',
  },
};

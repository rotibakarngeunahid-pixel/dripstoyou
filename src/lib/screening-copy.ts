// Bilingual screening-form text for the nurse-facing CRM page
// (src/app/crm/screening/[bookingId]) — mirrors the pattern in consent-copy.ts.

export type ScreeningLang = 'en' | 'id';

export type ScreeningCopy = {
  flag: string; langName: string;
  back: string;
  section1: string; bpLabel: string; tempLabel: string; pulseLabel: string;
  section2: string;
  allergyQ: string; allergyPlaceholder: string;
  illnessQ: string; illnessPlaceholder: string;
  medicationQ: string; medicationPlaceholder: string;
  pregnantQ: string; pregnantOptions: { value: 'YES' | 'NO' | 'NA'; label: string }[];
  yes: string; no: string;
  section3: string; nurseNotesPlaceholder: string;
  conclusions: { value: string; label: string; cls: string }[];
  saveDraft: string; savingDraft: string;
  submit: string; submitting: string;
  draftSaved: string;
  errBp: string; errTemp: string; errPulse: string;
  loadError: string; notFound: string; saveError: string;
};

export const SCREENING_COPY: Record<ScreeningLang, ScreeningCopy> = {
  id: {
    flag: '🇮🇩', langName: 'Indonesia',
    back: 'Kembali',
    section1: '1. Tanda Vital', bpLabel: 'Tekanan Darah (mmHg)', tempLabel: 'Suhu (°C)', pulseLabel: 'Nadi (bpm)',
    section2: '2. Pertanyaan Medis',
    allergyQ: 'Alergi obat?', allergyPlaceholder: 'Catatan alergi',
    illnessQ: 'Riwayat penyakit?', illnessPlaceholder: 'Catatan riwayat penyakit',
    medicationQ: 'Sedang konsumsi obat?', medicationPlaceholder: 'Catatan obat',
    pregnantQ: 'Sedang hamil?',
    pregnantOptions: [
      { value: 'YES', label: 'Ya' },
      { value: 'NO', label: 'Tidak' },
      { value: 'NA', label: 'N.A.' },
    ],
    yes: 'Ya', no: 'Tidak',
    section3: '3. Kesimpulan', nurseNotesPlaceholder: 'Catatan nurse',
    conclusions: [
      { value: 'SAFE', label: '✅ Aman Treatment', cls: 'border-[#205251] bg-[#D6EAEA] text-[#205251]' },
      { value: 'NEEDS_REVIEW', label: '⚠️ Perlu Review', cls: 'border-amber-400 bg-amber-50 text-amber-700' },
      { value: 'NOT_RECOMMENDED', label: '❌ Tidak Disarankan', cls: 'border-red-400 bg-red-50 text-red-700' },
    ],
    saveDraft: 'Simpan Draft', savingDraft: 'Menyimpan…',
    submit: 'Submit Screening →', submitting: 'Mengirim…',
    draftSaved: 'Draft tersimpan.',
    errBp: 'Tekanan darah wajib diisi.', errTemp: 'Suhu wajib diisi.', errPulse: 'Nadi wajib diisi.',
    loadError: 'Gagal memuat', notFound: 'Tidak ditemukan', saveError: 'Gagal menyimpan',
  },
  en: {
    flag: '🇬🇧', langName: 'English',
    back: 'Back',
    section1: '1. Vital Signs', bpLabel: 'Blood Pressure (mmHg)', tempLabel: 'Temperature (°C)', pulseLabel: 'Pulse (bpm)',
    section2: '2. Medical Questions',
    allergyQ: 'Drug allergy?', allergyPlaceholder: 'Allergy notes',
    illnessQ: 'Medical history?', illnessPlaceholder: 'Medical history notes',
    medicationQ: 'Currently taking medication?', medicationPlaceholder: 'Medication notes',
    pregnantQ: 'Currently pregnant?',
    pregnantOptions: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'NA', label: 'N.A.' },
    ],
    yes: 'Yes', no: 'No',
    section3: '3. Conclusion', nurseNotesPlaceholder: 'Nurse notes',
    conclusions: [
      { value: 'SAFE', label: '✅ Safe for Treatment', cls: 'border-[#205251] bg-[#D6EAEA] text-[#205251]' },
      { value: 'NEEDS_REVIEW', label: '⚠️ Needs Review', cls: 'border-amber-400 bg-amber-50 text-amber-700' },
      { value: 'NOT_RECOMMENDED', label: '❌ Not Recommended', cls: 'border-red-400 bg-red-50 text-red-700' },
    ],
    saveDraft: 'Save Draft', savingDraft: 'Saving…',
    submit: 'Submit Screening →', submitting: 'Submitting…',
    draftSaved: 'Draft saved.',
    errBp: 'Blood pressure is required.', errTemp: 'Temperature is required.', errPulse: 'Pulse is required.',
    loadError: 'Failed to load', notFound: 'Not found', saveError: 'Failed to save',
  },
};

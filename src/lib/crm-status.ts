// CRM booking lifecycle status metadata — labels, badge colors, and the state
// machine (mirrors crmValidTransitions() in php-api/crm/_crm.php).

export type CRMBookingStatus =
  | 'PENDING' | 'NEED_CONFIRMATION' | 'CONFIRMED' | 'NURSE_ASSIGNED'
  | 'NURSE_ON_THE_WAY' | 'SCREENING_STARTED' | 'SCREENING_COMPLETED'
  | 'CONSENT_SIGNED' | 'TREATMENT_IN_PROGRESS' | 'TREATMENT_COMPLETED'
  | 'PAYMENT_COMPLETED' | 'FOLLOW_UP' | 'CLOSED' | 'CANCELLED'
  | 'RESCHEDULED' | 'NOT_ELIGIBLE' | 'NO_SHOW';

export const STATUS_LABEL: Record<CRMBookingStatus, string> = {
  PENDING: 'Pending',
  NEED_CONFIRMATION: 'Perlu Konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  NURSE_ASSIGNED: 'Nurse Ditugaskan',
  NURSE_ON_THE_WAY: 'Nurse Dalam Perjalanan',
  SCREENING_STARTED: 'Screening Dimulai',
  SCREENING_COMPLETED: 'Screening Selesai',
  CONSENT_SIGNED: 'Consent Ditandatangani',
  TREATMENT_IN_PROGRESS: 'Treatment Berlangsung',
  TREATMENT_COMPLETED: 'Treatment Selesai',
  PAYMENT_COMPLETED: 'Pembayaran Selesai',
  FOLLOW_UP: 'Follow Up',
  CLOSED: 'Selesai (Closed)',
  CANCELLED: 'Dibatalkan',
  RESCHEDULED: 'Dijadwalkan Ulang',
  NOT_ELIGIBLE: 'Tidak Memenuhi Syarat',
  NO_SHOW: 'Tidak Hadir',
};

export const STATUS_COLORS: Record<CRMBookingStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  NEED_CONFIRMATION: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  NURSE_ASSIGNED: 'bg-cyan-100 text-cyan-700',
  NURSE_ON_THE_WAY: 'bg-indigo-100 text-indigo-700',
  SCREENING_STARTED: 'bg-purple-100 text-purple-700',
  SCREENING_COMPLETED: 'bg-violet-100 text-violet-700',
  CONSENT_SIGNED: 'bg-fuchsia-100 text-fuchsia-700',
  TREATMENT_IN_PROGRESS: 'bg-orange-100 text-orange-700',
  TREATMENT_COMPLETED: 'bg-teal-100 text-teal-700',
  PAYMENT_COMPLETED: 'bg-green-100 text-green-700',
  FOLLOW_UP: 'bg-lime-100 text-lime-700',
  CLOSED: 'bg-emerald-700 text-white',
  CANCELLED: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-yellow-100 text-yellow-700',
  NOT_ELIGIBLE: 'bg-red-200 text-red-800',
  NO_SHOW: 'bg-zinc-200 text-zinc-700',
};

export const VALID_TRANSITIONS: Record<CRMBookingStatus, CRMBookingStatus[]> = {
  PENDING: ['NEED_CONFIRMATION', 'CONFIRMED', 'CANCELLED'],
  NEED_CONFIRMATION: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED'],
  CONFIRMED: ['NURSE_ASSIGNED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  NURSE_ASSIGNED: ['NURSE_ON_THE_WAY', 'CONFIRMED', 'CANCELLED'],
  NURSE_ON_THE_WAY: ['SCREENING_STARTED', 'CANCELLED'],
  SCREENING_STARTED: ['SCREENING_COMPLETED', 'NOT_ELIGIBLE'],
  SCREENING_COMPLETED: ['CONSENT_SIGNED', 'NOT_ELIGIBLE'],
  CONSENT_SIGNED: ['TREATMENT_IN_PROGRESS'],
  TREATMENT_IN_PROGRESS: ['TREATMENT_COMPLETED'],
  TREATMENT_COMPLETED: ['PAYMENT_COMPLETED', 'FOLLOW_UP'],
  PAYMENT_COMPLETED: ['FOLLOW_UP', 'CLOSED'],
  FOLLOW_UP: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
  NOT_ELIGIBLE: [],
  NO_SHOW: [],
  RESCHEDULED: ['NEED_CONFIRMATION'],
};

export function nextStatuses(from: CRMBookingStatus): CRMBookingStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function isValidTransition(from: CRMBookingStatus, to: CRMBookingStatus): boolean {
  return nextStatuses(from).includes(to);
}

// Ordered "happy path" milestones for the vertical timeline view.
export const TIMELINE_STEPS: CRMBookingStatus[] = [
  'CONFIRMED', 'NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'SCREENING_COMPLETED',
  'CONSENT_SIGNED', 'TREATMENT_IN_PROGRESS', 'TREATMENT_COMPLETED', 'PAYMENT_COMPLETED', 'CLOSED',
];

// Rough ordering for "have we reached at least X" checks in the timeline.
export const STATUS_RANK: Record<CRMBookingStatus, number> = {
  PENDING: 0, NEED_CONFIRMATION: 1, CONFIRMED: 2, NURSE_ASSIGNED: 3, NURSE_ON_THE_WAY: 4,
  SCREENING_STARTED: 5, SCREENING_COMPLETED: 6, CONSENT_SIGNED: 7, TREATMENT_IN_PROGRESS: 8,
  TREATMENT_COMPLETED: 9, PAYMENT_COMPLETED: 10, FOLLOW_UP: 11, CLOSED: 12,
  CANCELLED: -1, RESCHEDULED: 1, NOT_ELIGIBLE: -1, NO_SHOW: -1,
};

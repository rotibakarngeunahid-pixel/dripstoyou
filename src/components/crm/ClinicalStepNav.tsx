'use client';

import Link from 'next/link';
import { ClipboardList, FileSignature, Syringe } from 'lucide-react';

export type StepState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TreatmentSteps = {
  screening: { status: StepState; conclusion: 'SAFE' | 'NEEDS_REVIEW' | 'NOT_RECOMMENDED' | null; eligible: boolean };
  consent: { status: StepState };
  treatment: { status: StepState };
  ready_to_complete: boolean;
  blockers: string[];
};

const STATE_LABEL: Record<StepState, string> = {
  NOT_STARTED: 'Belum Diisi',
  IN_PROGRESS: 'Sedang Diisi',
  COMPLETED: 'Selesai',
};

const STATE_COLOR: Record<StepState, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-[#d1fae5] text-[#10b981]',
};

const STEPS = [
  { key: 'screening', href: (id: string) => `/crm/screening/${id}`, label: 'Screening', icon: ClipboardList },
  { key: 'consent', href: (id: string) => `/crm/consent/${id}`, label: 'Consent', icon: FileSignature },
  { key: 'treatment', href: (id: string) => `/crm/treatment/${id}`, label: 'Treatment', icon: Syringe },
] as const;

// Non-linear clinical workflow nav — lets a nurse jump between Screening,
// Consent, and Treatment in any order, each tab showing its own fill status
// (mirrors crmTreatmentStepStatus() in php-api/crm/_crm.php).
export default function ClinicalStepNav({
  bookingId, active, steps,
}: {
  bookingId: string;
  active: 'screening' | 'consent' | 'treatment';
  steps: TreatmentSteps | null;
}) {
  return (
    <div className="crm-card mb-4 flex flex-wrap gap-2 p-3">
      {STEPS.map(({ key, href, label, icon: Icon }) => {
        const state = steps?.[key]?.status ?? null;
        const isActive = key === active;
        const notEligible = key === 'screening' && steps?.screening.status === 'COMPLETED' && !steps.screening.eligible;
        return (
          <Link
            key={key}
            href={href(bookingId)}
            className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
              isActive ? 'border-[#205251] bg-[#205251] text-white' : 'border-[#DBDAD7] bg-white text-[#111a1a] hover:border-[#8EBFBF]'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-white' : 'text-[#205251]'} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{label}</span>
              <span className={`mt-0.5 inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isActive ? 'bg-white/20 text-white' : (state ? STATE_COLOR[state] : STATE_COLOR.NOT_STARTED)
              }`}>
                {state ? STATE_LABEL[state] : STATE_LABEL.NOT_STARTED}
              </span>
              {notEligible && (
                <span className={`ml-1 mt-0.5 inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  Tidak Direkomendasikan
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

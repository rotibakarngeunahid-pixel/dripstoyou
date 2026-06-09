export type DaySchedule = {
  open: string;
  close: string;
  is24h: boolean;
  isOpen: boolean;
};

export type OperatingHoursSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export const DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;
export type DayKey = typeof DAY_KEYS[number];

const SEED: OperatingHoursSchedule = {
  monday:    { open: '08:00', close: '22:00', is24h: false, isOpen: true },
  tuesday:   { open: '08:00', close: '22:00', is24h: false, isOpen: true },
  wednesday: { open: '08:00', close: '22:00', is24h: false, isOpen: true },
  thursday:  { open: '08:00', close: '22:00', is24h: false, isOpen: true },
  friday:    { open: '08:00', close: '22:00', is24h: false, isOpen: true },
  saturday:  { open: '08:00', close: '22:00', is24h: false, isOpen: true },
  sunday:    { open: '08:00', close: '22:00', is24h: false, isOpen: false },
};

export function getDefaultSchedule(): OperatingHoursSchedule {
  return JSON.parse(JSON.stringify(SEED)) as OperatingHoursSchedule;
}

export function parseOperatingHours(raw: string | null | undefined): OperatingHoursSchedule {
  if (!raw) return getDefaultSchedule();

  // Try structured JSON first
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && 'monday' in parsed) {
      const base = getDefaultSchedule();
      for (const key of DAY_KEYS) {
        const d = parsed[key];
        if (d && typeof d === 'object') {
          base[key] = { ...base[key], ...(d as Partial<DaySchedule>) };
        }
      }
      return base;
    }
  } catch {
    // Fall through to legacy parsing
  }

  // Legacy format: "08:00-22:00" — treat as every-day same hours
  const m = raw.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (m) {
    const [, open, close] = m;
    const base = getDefaultSchedule();
    for (const key of DAY_KEYS) {
      base[key] = { open, close, is24h: false, isOpen: true };
    }
    return base;
  }

  return getDefaultSchedule();
}

// ── Formatting ───────────────────────────────────────────────────────────────

const SHORT_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function to12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

function daySlot(day: DaySchedule, lang: 'id' | 'en'): string {
  if (!day.isOpen) return lang === 'id' ? 'Tutup' : 'Closed';
  if (day.is24h)   return lang === 'id' ? 'Buka 24 Jam' : 'Open 24 Hours';
  return lang === 'en'
    ? `${to12h(day.open)} – ${to12h(day.close)}`
    : `${day.open} – ${day.close}`;
}

export function formatOperatingHours(
  schedule: OperatingHoursSchedule,
  lang: 'id' | 'en' = 'id',
): string {
  const days = DAY_KEYS.map((k) => schedule[k]);

  if (days.every((d) => d.isOpen && d.is24h)) {
    return lang === 'id' ? 'Buka 24 Jam' : 'Open 24 Hours';
  }

  type Group = { start: number; end: number; slot: string };
  const groups: Group[] = [];
  for (let i = 0; i < 7; i++) {
    const slot = daySlot(days[i], lang);
    if (!groups.length || groups[groups.length - 1].slot !== slot) {
      groups.push({ start: i, end: i, slot });
    } else {
      groups[groups.length - 1].end = i;
    }
  }

  const names = lang === 'id' ? SHORT_ID : SHORT_EN;

  if (groups.length === 1) {
    const prefix = lang === 'id' ? 'Setiap Hari' : 'Every Day';
    return `${prefix}: ${groups[0].slot}`;
  }

  return groups
    .map((g) => {
      const label = g.start === g.end ? names[g.start] : `${names[g.start]}–${names[g.end]}`;
      return `${label}: ${g.slot}`;
    })
    .join(' | ');
}

// ── Schema.org openingHours ───────────────────────────────────────────────────

const SCHEMA_DAY = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function toSchemaOpeningHours(schedule: OperatingHoursSchedule): string | string[] {
  const days = DAY_KEYS.map((k) => schedule[k]);

  const openDays = days.filter((d) => d.isOpen);
  if (!openDays.length) return [];

  // All open days with identical hours — compact form
  const first = openDays[0];
  const allSame = openDays.every(
    (d) => d.is24h === first.is24h && d.open === first.open && d.close === first.close,
  );

  if (allSame && openDays.length === 7) {
    if (first.is24h) return 'Mo-Su 00:00-23:59';
    return `Mo-Su ${first.open}-${first.close}`;
  }

  return days.map((d, i) => {
    if (!d.isOpen) return null;
    if (d.is24h) return `${SCHEMA_DAY[i]} 00:00-23:59`;
    return `${SCHEMA_DAY[i]} ${d.open}-${d.close}`;
  }).filter(Boolean) as string[];
}

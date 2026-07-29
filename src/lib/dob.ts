// Date-of-birth helpers shared by the public booking form, admin, and CRM.
// Age is always derived from `dob` at display/compute time — never stored —
// so it stays accurate as time passes (see requirement in the DOB feature).

/** Accurate age in years: accounts for whether this year's birthday has passed yet. */
export function calculateAge(dob: string | Date | null | undefined, at: Date = new Date()): number | null {
  if (!dob) return null;
  const birth = dob instanceof Date ? dob : new Date(`${String(dob).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = at.getFullYear() - birth.getFullYear();
  const monthDiff = at.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

/** "YYYY-MM-DD" -> true if the date is after today (local time). */
export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr > todayStr;
}

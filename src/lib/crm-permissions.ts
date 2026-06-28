import type { CRMRole } from './crm-session';

// RBAC module map — mirrors crmPermissions() in php-api/crm/_crm.php.
// PHP is the final trust boundary; this client/server copy is for UI gating
// and early 403s in the Next proxy layer.
export const CRM_PERMISSIONS: Record<CRMRole, string[]> = {
  OWNER: [
    'dashboard', 'booking', 'patient', 'nurse', 'inventory', 'purchase_order',
    'finance', 'whatsapp', 'staff', 'area', 'audit', 'screening', 'consent', 'treatment', 'service',
  ],
  ADMIN: ['booking', 'patient', 'nurse', 'whatsapp', 'area', 'service', 'screening', 'consent', 'treatment'],
  NURSE: ['nurse_portal', 'screening', 'consent', 'treatment'],
  FINANCE: ['finance', 'purchase_order'],
};

export function crmCan(role: CRMRole, module: string): boolean {
  if (role === 'OWNER') return true;
  return CRM_PERMISSIONS[role]?.includes(module) ?? false;
}

// Every grantable module + a friendly Indonesian label, for the custom-access UI.
// Mirrors crmAllModules() in php-api/crm/_crm.php.
export const CRM_MODULE_LABELS: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'booking', label: 'Booking' },
  { key: 'patient', label: 'Pasien' },
  { key: 'nurse', label: 'Nurse (kelola & assign)' },
  { key: 'nurse_portal', label: 'Portal Nurse (jadwal sendiri)' },
  { key: 'service', label: 'Layanan' },
  { key: 'screening', label: 'Screening' },
  { key: 'consent', label: 'Consent' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'purchase_order', label: 'Purchase Order' },
  { key: 'finance', label: 'Finance' },
  { key: 'area', label: 'Area & Fee' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'staff', label: 'Staff & Role' },
  { key: 'audit', label: 'Audit Log' },
];

export const CRM_ALL_MODULES = CRM_MODULE_LABELS.map((m) => m.key);

// Effective modules for a role + optional custom permission override.
export function crmEffectiveModules(role: CRMRole, permissions?: string[] | null): string[] {
  if (role === 'OWNER') return CRM_ALL_MODULES;
  if (permissions && permissions.length > 0) return permissions;
  return CRM_PERMISSIONS[role] ?? [];
}

// Landing page after login — the first module the user can actually open,
// in priority order (so ADMIN/FINANCE don't land on the OWNER-only dashboard).
const HOME_PRIORITY: { module: string; path: string }[] = [
  { module: 'dashboard', path: '/crm/dashboard' },
  { module: 'nurse_portal', path: '/crm/nurse' },
  { module: 'booking', path: '/crm/booking' },
  { module: 'patient', path: '/crm/pasien' },
  { module: 'finance', path: '/crm/finance' },
  { module: 'purchase_order', path: '/crm/purchase-order' },
  { module: 'inventory', path: '/crm/inventory' },
  { module: 'service', path: '/crm/layanan' },
  { module: 'area', path: '/crm/area' },
  { module: 'whatsapp', path: '/crm/whatsapp' },
];

export function crmHomePath(role: CRMRole, modules?: string[]): string {
  if (role === 'OWNER') return '/crm/dashboard';
  if (role === 'NURSE') return '/crm/nurse';
  const m = modules && modules.length ? modules : (CRM_PERMISSIONS[role] ?? []);
  for (const h of HOME_PRIORITY) if (m.includes(h.module)) return h.path;
  return '/crm/dashboard';
}

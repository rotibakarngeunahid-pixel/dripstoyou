'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, Sparkles, Package, ShoppingCart,
  Wallet, MapPin, MessageCircle, Shield, ClipboardList, LogOut, X, ChevronDown,
  MoreHorizontal, type LucideIcon,
} from 'lucide-react';
import type { CRMRole } from '@/lib/crm-session';

export type CRMStaff = { id: string; email: string; role: CRMRole; name: string; modules: string[]; isWebsiteAdmin?: boolean };

const CRMStaffContext = createContext<CRMStaff | null>(null);
export function useCRMStaff() {
  return useContext(CRMStaffContext);
}

type NavItem = { href: string; label: string; icon: LucideIcon; module: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { href: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { href: '/crm/booking', label: 'Booking', icon: Calendar, module: 'booking' },
      { href: '/crm/pasien', label: 'Pasien', icon: Users, module: 'patient' },
      { href: '/crm/nurse', label: 'Nurse', icon: Stethoscope, module: 'nurse_portal' },
      { href: '/crm/layanan', label: 'Layanan', icon: Sparkles, module: 'service' },
    ],
  },
  {
    label: 'Operasional & Keuangan',
    items: [
      { href: '/crm/inventory', label: 'Inventory', icon: Package, module: 'inventory' },
      { href: '/crm/purchase-order', label: 'Purchase Order', icon: ShoppingCart, module: 'purchase_order' },
      { href: '/crm/finance', label: 'Finance', icon: Wallet, module: 'finance' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { href: '/crm/area', label: 'Area & Fee', icon: MapPin, module: 'area' },
      { href: '/crm/whatsapp', label: 'WhatsApp', icon: MessageCircle, module: 'whatsapp' },
      { href: '/crm/staff', label: 'Staff & Role', icon: Shield, module: 'staff' },
      { href: '/crm/audit', label: 'Audit Log', icon: ClipboardList, module: 'audit' },
    ],
  },
];

function canSee(modules: string[], role: CRMRole, item: NavItem): boolean {
  if (role === 'OWNER') return true;
  if (item.module === 'nurse_portal') return modules.includes('nurse_portal') || modules.includes('nurse');
  return modules.includes(item.module);
}

const ROLE_LABEL: Record<CRMRole, string> = {
  OWNER: 'Owner', ADMIN: 'Admin', NURSE: 'Nurse', FINANCE: 'Finance',
};
const ROLE_BADGE: Record<CRMRole, string> = {
  OWNER: 'bg-[#C9944C]', ADMIN: 'bg-[#29808B]', NURSE: 'bg-[#8EBFBF]', FINANCE: 'bg-[#C9944C]',
};

function initials(name?: string) {
  const clean = name?.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || clean[0].toUpperCase();
}

export default function CRMShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/crm/login';

  const [staff, setStaff] = useState<CRMStaff | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLogin) return;
    let active = true;
    async function verify() {
      try {
        const res = await fetch('/api/crm/auth/me', { cache: 'no-store' });
        if (!active) return;
        if (res.ok) {
          const json = (await res.json()) as { staff?: CRMStaff };
          setStaff(json.staff ?? null);
          setSessionOk(true);
          setAuthChecked(true);
          return;
        }
        setSessionOk(false);
        setAuthChecked(true);
        router.replace(res.status === 401 ? '/login?reason=session-expired' : '/login?reason=auth-unavailable');
      } catch {
        if (!active) return;
        setSessionOk(false);
        setAuthChecked(true);
        router.replace('/login?reason=auth-unavailable');
      }
    }
    void verify();
    const interval = window.setInterval(verify, 4 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isLogin, pathname, router]);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  if (isLogin) return <>{children}</>;

  if (!authChecked || !sessionOk || !staff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F0E7] font-ui">
        <div className="flex flex-col items-center gap-3 text-[#205251]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#8EBFBF] border-t-[#205251]" />
          <p className="text-sm">Memverifikasi sesi…</p>
        </div>
      </main>
    );
  }

  const role = staff.role;
  const modules = staff.modules ?? [];
  const visibleGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => canSee(modules, role, i)) }))
    .filter((g) => g.items.length > 0);
  const flatItems = visibleGroups.flatMap((g) => g.items);
  const activeItem = flatItems.find((i) => pathname.startsWith(i.href));
  const pageTitle = activeItem?.label ?? 'CRM';

  const bottomItems = flatItems.slice(0, 4);
  const hasOverflow = flatItems.length > 4;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <CRMStaffContext.Provider value={staff}>
      <div className="min-h-screen bg-[#f0f4f8] font-ui text-[#0f172a]">

        {/* ── Sidebar (desktop) ── */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#1a4342] text-white md:flex">
          {/* Brand */}
          <div className="flex h-[72px] items-center gap-3 border-b border-white/8 px-5">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold shadow-md"
              style={{ background: 'linear-gradient(135deg, #EAD4AE, #C9944C)', color: '#103b3a' }}
            >
              D
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-semibold leading-tight text-white">Drips To You</p>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/50">CRM Internal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[2px] text-white/35">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? 'border-[#C9944C] bg-white/12 text-white'
                            : 'border-transparent text-white/65 hover:bg-white/7 hover:text-white/90'
                        }`}
                      >
                        <Icon size={18} aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {active && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C9944C]" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User + logout */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-2 flex items-center gap-3">
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${ROLE_BADGE[role]}`}>
                {initials(staff.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{staff.name}</p>
                <p className="text-[11px] text-white/50">{ROLE_LABEL[role]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/55 transition hover:bg-white/10 hover:text-white/90 disabled:opacity-50"
            >
              <LogOut size={14} aria-hidden />
              {loggingOut ? 'Keluar…' : 'Logout'}
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="md:ml-64">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e4e9ef] bg-white px-4 shadow-sm md:px-8">
            {/* Mobile: brand mark + page title */}
            <div className="flex items-center gap-2.5 md:hidden">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #EAD4AE, #C9944C)', color: '#103b3a' }}
              >
                D
              </span>
              <span className="font-display text-base font-bold text-[#0f172a]">{pageTitle}</span>
            </div>

            {/* Desktop: page title + date */}
            <div className="hidden md:block">
              <h1 className="font-display text-lg font-bold text-[#0f172a] leading-tight">{pageTitle}</h1>
            </div>

            {/* Account menu */}
            <div className="relative flex items-center gap-3" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-[#F3F0E7]"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${ROLE_BADGE[role]}`}>
                  {initials(staff.name)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-semibold text-[#205251]">{staff.name}</span>
                  <span className="block text-[11px] text-[#4d6060]">{ROLE_LABEL[role]}</span>
                </span>
                <ChevronDown size={15} className="text-[#8EBFBF]" aria-hidden />
              </button>

              {accountOpen && (
                <div role="menu" className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-[#DBDAD7] bg-white shadow-xl">
                  <div className="border-b border-[#F3F0E7] px-4 py-3">
                    <p className="truncate text-sm font-semibold text-[#205251]">{staff.name}</p>
                    <p className="truncate text-xs text-[#8EBFBF]">{staff.email}</p>
                  </div>
                  {staff.isWebsiteAdmin && (
                    <Link
                      href="/admin/dashboard"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex w-full items-center gap-2 border-b border-[#F3F0E7] px-4 py-3 text-sm text-[#205251] transition hover:bg-[#F3F0E7]"
                    >
                      <Shield size={15} aria-hidden /> Panel Website Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <LogOut size={15} aria-hidden />
                    {loggingOut ? 'Keluar…' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-10">{children}</main>
        </div>

        {/* ── Bottom nav (mobile) ── */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DBDAD7] bg-white/95 backdrop-blur-md md:hidden">
          <div className="flex items-stretch">
            {bottomItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-1 flex-col items-center gap-0.5 py-2"
                >
                  <span
                    className={`flex h-9 w-14 items-center justify-center rounded-2xl transition-colors ${
                      active ? 'bg-[#D6EAEA]' : ''
                    }`}
                  >
                    <Icon
                      size={21}
                      aria-hidden
                      className={active ? 'text-[#205251]' : 'text-[#8EBFBF]'}
                    />
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      active ? 'text-[#205251]' : 'text-[#8EBFBF]'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {hasOverflow && (
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex flex-1 flex-col items-center gap-0.5 py-2"
              >
                <span className="flex h-9 w-14 items-center justify-center rounded-2xl">
                  <MoreHorizontal size={21} className="text-[#8EBFBF]" aria-hidden />
                </span>
                <span className="text-[10px] font-semibold leading-tight text-[#8EBFBF]">Lainnya</span>
              </button>
            )}
          </div>

        </nav>

        {/* ── Mobile "More" sheet ── */}
        {moreOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-label="Tutup"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
              {/* Drag handle */}
              <div className="flex justify-center pb-1 pt-3">
                <span className="h-1 w-10 rounded-full bg-[#DBDAD7]" />
              </div>

              <div className="px-5 pb-2 pt-3">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display text-xl font-semibold text-[#205251]">Menu</p>
                  <button
                    onClick={() => setMoreOpen(false)}
                    aria-label="Tutup"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F0E7] text-[#205251] transition hover:bg-[#D6EAEA]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {visibleGroups.map((group) => (
                  <div key={group.label} className="mb-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#8EBFBF]">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-[11px] font-semibold leading-tight transition ${
                              active
                                ? 'bg-[#D6EAEA] text-[#205251]'
                                : 'bg-[#F3F0E7] text-[#4d6060]'
                            }`}
                          >
                            <Icon size={20} aria-hidden />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Bottom padding for safe area */}
                <div className="pb-6" />
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMStaffContext.Provider>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageCircle,
  PackagePlus,
  Settings,
  Share2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };
type AdminUser = {
  id: string;
  email: string;
  role: string;
  name: string;
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Menu Utama',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/bookings', label: 'Booking', icon: ClipboardList },
    ],
  },
  {
    label: 'Layanan',
    items: [
      { href: '/admin/products', label: 'Treatment', icon: PackagePlus },
      { href: '/admin/schedule', label: 'Jadwal', icon: CalendarDays },
      { href: '/admin/coverage', label: 'Area Layanan', icon: MapPinned },
    ],
  },
  {
    label: 'Konten Website',
    items: [
      { href: '/admin/faqs', label: 'FAQ', icon: CircleHelp },
      { href: '/admin/social-links', label: 'Social Links', icon: Share2 },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { href: '/admin/settings', label: 'Pengaturan Umum', icon: Settings },
      { href: '/admin/settings/wa-template', label: 'WhatsApp Template', icon: MessageCircle },
    ],
  },
  {
    label: 'Bantuan',
    items: [
      { href: '/admin/guide', label: 'Panduan Admin', icon: FileText },
    ],
  },
];

function getActiveLabel(pathname: string) {
  let activeLabel = 'Admin';
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) activeLabel = item.label;
    }
  }
  return activeLabel;
}

function adminInitial(name?: string) {
  const clean = name?.trim();
  return clean ? clean.charAt(0).toUpperCase() : 'A';
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      return;
    }

    let active = true;

    async function verify() {
      try {
        const res = await fetch('/api/admin/auth/me', { cache: 'no-store' });
        if (!active) return;

        if (res.ok) {
          const json = await res.json() as { admin?: AdminUser };
          setAdmin(json.admin ?? null);
          setSessionOk(true);
          setAuthChecked(true);
          return;
        }

        if (res.status === 401) {
          setSessionOk(false);
          setAuthChecked(true);
          router.replace('/admin/login?reason=session-expired');
          return;
        }

        setSessionOk(false);
        setAuthChecked(true);
        router.replace('/admin/login?reason=auth-unavailable');
      } catch {
        if (!active) return;
        setSessionOk(false);
        setAuthChecked(true);
        router.replace('/admin/login?reason=auth-unavailable');
      }
    }

    void verify();
    const interval = window.setInterval(verify, 4 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (!authChecked || !sessionOk) {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card admin-verify-card">
          <span className="admin-verify-spinner" aria-hidden="true" />
          <p>Memverifikasi sesi admin...</p>
        </section>
      </main>
    );
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }

  const activeLabel = getActiveLabel(pathname);
  const name = admin?.name ?? 'Admin';

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          aria-label="Tutup menu"
          type="button"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="admin-sidebar"
        className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-head">
          <Link href="/admin/dashboard" className="admin-sidebar-brand" aria-label="Dashboard admin">
            <span className="admin-sidebar-logo">D</span>
            <span>
              Drips To You
              <small>Admin Panel</small>
            </span>
          </Link>
          <button
            type="button"
            className="admin-sidebar-close"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <div className="admin-nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      setSidebarOpen(false);
                      setAccountOpen(false);
                    }}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              aria-controls="admin-sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} />
            </button>
            <div className="admin-breadcrumb">
              <span>Admin</span>
              <strong>{activeLabel}</strong>
            </div>
          </div>

          <div className="admin-topbar-right" ref={accountRef}>
            <div className="admin-topbar-meta">
              <BarChart3 size={16} aria-hidden="true" />
              <span>Live panel</span>
            </div>
            <button
              type="button"
              className="admin-account-button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              <span className="admin-avatar">{adminInitial(name)}</span>
              <span className="admin-account-text">
                <strong>{name}</strong>
                <small>{admin?.role?.replaceAll('_', ' ') ?? 'Admin'}</small>
              </span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {accountOpen && (
              <div className="admin-account-menu" role="menu">
                <div className="admin-account-menu-head">
                  <strong>{name}</strong>
                  <span>{admin?.email}</span>
                </div>
                <button
                  type="button"
                  className="admin-account-menu-item"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  role="menuitem"
                >
                  {loggingOut ? <Clock3 size={16} /> : <LogOut size={16} />}
                  {loggingOut ? 'Keluar...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}

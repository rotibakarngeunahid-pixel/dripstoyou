'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

type NavItem  = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Menu Utama',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/bookings',  label: 'Booking' },
    ],
  },
  {
    label: 'Layanan',
    items: [
      { href: '/admin/products',  label: 'Treatment' },
      { href: '/admin/schedule',  label: 'Jadwal' },
      { href: '/admin/coverage',  label: 'Area Layanan' },
    ],
  },
  {
    label: 'Konten Website',
    items: [
      { href: '/admin/faqs',         label: 'FAQ' },
      { href: '/admin/social-links', label: 'Social Links' },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { href: '/admin/settings',             label: 'Pengaturan Umum' },
      { href: '/admin/settings/wa-template', label: 'WhatsApp Template' },
    ],
  },
  {
    label: 'Bantuan',
    items: [
      { href: '/admin/guide', label: 'Panduan Admin' },
    ],
  },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open,        setOpen]        = useState(false);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const [sessionOk,   setSessionOk]   = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  // stable ref so the interval closure always sees latest router
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Verify session once on mount, then re-check every 4 minutes in the background.
  // This prevents the per-navigation "Memverifikasi sesi…" loading flash.
  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const res = await fetch('/api/admin/auth/me', { cache: 'no-store' });
        if (!active) return;
        if (res.ok) {
          setSessionOk(true);
        } else if (res.status === 401) {
          setSessionOk(false);
          routerRef.current.replace('/admin/login?reason=session-expired');
        }
        // 503 (config issue) — keep current sessionOk; don't boot the user
      } catch {
        // network error — keep current state; navigation will fail gracefully
      }
    };

    void verify();
    const interval = setInterval(verify, 4 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []); // intentionally runs once on mount

  /* close drawer on Escape, lock body scroll */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (!sessionOk) {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card" style={{ textAlign: 'center' }}>
          <p>Memverifikasi sesi admin…</p>
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
      router.push('/admin/login');
    }
  }

  let activeLabel = 'Admin';
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) activeLabel = item.label;
    }
  }

  return (
    <div className="admin-layout">
      {/* ── Topbar ── */}
      <header className="admin-topbar">
        <Link href="/admin/dashboard" className="admin-brand" aria-label="Kembali ke dashboard">
          Drips To You
          <span>Admin Panel</span>
        </Link>

        <span className="admin-topbar-title" aria-hidden="true">{activeLabel}</span>

        <div className="admin-topbar-right">
          <button
            className="admin-hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="admin-drawer"
            type="button"
          >
            <span className={`admin-hamburger-icon${open ? ' open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>

          <button
            className="admin-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            type="button"
          >
            {loggingOut ? '...' : 'Logout'}
          </button>
        </div>
      </header>

      {/* ── Drawer overlay ── */}
      {open && (
        <div
          className="admin-drawer-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer ── */}
      <nav
        id="admin-drawer"
        className={`admin-drawer${open ? ' admin-drawer--open' : ''}`}
        aria-label="Admin navigation"
        ref={drawerRef}
      >
        <div className="admin-drawer-header">
          <span className="admin-drawer-brand">Navigation</span>
          <button
            className="admin-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="admin-drawer-body">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <div className="admin-nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-drawer-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="admin-drawer-footer">
          <button
            className="admin-drawer-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            type="button"
          >
            {loggingOut ? 'Keluar...' : 'Logout'}
          </button>
        </div>
      </nav>

      <main className="admin-main">{children}</main>
    </div>
  );
}

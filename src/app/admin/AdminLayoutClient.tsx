'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/products', label: 'Produk' },
  { href: '/admin/schedule', label: 'Jadwal' },
  { href: '/admin/settings', label: 'Pengaturan' },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
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

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <Link href="/admin/dashboard" className="admin-brand" aria-label="Admin dashboard">
          Drips To You - Bali
          <span>Admin</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={`admin-nav-link${active ? ' active' : ''}`}
                href={item.href}
                key={item.href}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="admin-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          type="button"
        >
          {loggingOut ? 'Keluar...' : 'Logout'}
        </button>
      </header>

      <main className="admin-main">{children}</main>
    </div>
  );
}

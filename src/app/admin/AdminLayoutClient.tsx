'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard' },
  { href: '/admin/bookings',   label: 'Bookings' },
  { href: '/admin/products',   label: 'Produk' },
  { href: '/admin/schedule',   label: 'Jadwal' },
  { href: '/admin/settings',   label: 'Pengaturan' },
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
    <div style={{ minHeight: '100vh', background: '#F3F0E7', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#205251', padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          Drips To You - Bali{' '}
          <span style={{
            fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 10, fontWeight: 400,
            color: '#8EBFBF', letterSpacing: 2, textTransform: 'uppercase', marginLeft: 4,
          }}>
            Admin
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  color: active ? 'white' : 'rgba(255,255,255,.65)',
                  fontSize: 12, fontWeight: active ? 600 : 500,
                  padding: '6px 12px', borderRadius: 6, textDecoration: 'none',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  background: active ? 'rgba(255,255,255,.14)' : 'transparent',
                  transition: 'all .15s',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            color: 'rgba(255,255,255,.8)', padding: '5px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: 500, cursor: loggingOut ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            transition: 'all .15s', opacity: loggingOut ? 0.6 : 1,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loggingOut ? 'Keluar...' : 'Logout'}
        </button>
      </header>

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

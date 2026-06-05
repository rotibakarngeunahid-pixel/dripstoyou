import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — DRIP TO YOU Bali',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F0E7', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#205251', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 700, color: 'white' }}>
          DRIP TO YOU <span style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 10, fontWeight: 400, color: '#8EBFBF', letterSpacing: 2, textTransform: 'uppercase', marginLeft: 6 }}>Admin</span>
        </div>
        <nav style={{ display: 'flex', gap: 4 }}>
          {[
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/bookings',  label: 'Bookings' },
            { href: '/admin/products',  label: 'Produk' },
            { href: '/admin/schedule',  label: 'Jadwal' },
            { href: '/admin/settings',  label: 'Pengaturan' },
          ].map((item) => (
            <a key={item.href} href={item.href} style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 6, textDecoration: 'none' }}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

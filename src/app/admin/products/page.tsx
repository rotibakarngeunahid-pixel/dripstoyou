import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';

interface Product {
  id: string; name: string; slug: string;
  short_description: string | null; price_amount: number; price_label: string | null;
  duration_minutes: number | null; label: string | null;
  is_active: boolean; show_on_homepage: boolean; homepage_order: number;
  category_name: string | null; booking_count: number;
}

async function getProducts(token: string): Promise<Product[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products.php`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const products = await getProducts(session.adminToken);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#205251', marginBottom: 4 }}>Produk / Treatment</h1>
          <p style={{ color: '#6b7e7e', fontSize: 14 }}>{products.length} produk</p>
        </div>
        <Link
          href="/admin/products/new"
          style={{ padding: '10px 20px', background: '#205251', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        >
          + Tambah Produk
        </Link>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(32,82,81,0.06)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#205251', margin: 0 }}>{p.name}</h3>
                {p.label && (
                  <span style={{ background: '#C9944C22', color: '#C9944C', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600, border: '1px solid #C9944C44' }}>{p.label}</span>
                )}
                <span style={{ background: p.is_active ? '#25D36622' : '#ef444422', color: p.is_active ? '#25D366' : '#ef4444', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>
                  {p.is_active ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
              <p style={{ color: '#6b7e7e', fontSize: 13, margin: '0 0 6px' }}>{p.short_description}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7e7e' }}>
                <span>{p.price_label ?? `IDR ${p.price_amount.toLocaleString('id-ID')}`}</span>
                {p.duration_minutes && <span>{p.duration_minutes} menit</span>}
                <span>{p.booking_count} booking</span>
                {p.show_on_homepage && <span style={{ color: '#29808B' }}>Homepage #{p.homepage_order}</span>}
              </div>
            </div>
            <Link
              href={`/admin/products/${p.id}/edit`}
              style={{ padding: '8px 16px', border: '1px solid #DBDAD7', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#205251', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Edit
            </Link>
          </div>
        ))}
        {products.length === 0 && (
          <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 40, textAlign: 'center', color: '#6b7e7e' }}>
            Belum ada produk. <Link href="/admin/products/new" style={{ color: '#29808B' }}>Tambah produk pertama</Link>
          </div>
        )}
      </div>
    </div>
  );
}

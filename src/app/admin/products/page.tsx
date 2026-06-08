import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { formatPrice as formatCurrencyPrice } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_amount: number;
  currency: string | null;
  price_label: string | null;
  duration_minutes: number | null;
  label: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  homepage_order: number;
  category_name: string | null;
  booking_count: number;
}

async function getProducts(token: string): Promise<Product[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products.php`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

function formatPrice(product: Product) {
  return product.price_label ?? formatCurrencyPrice(product.price_amount, product.currency);
}

export default async function ProductsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const products = await getProducts(session.adminToken);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Produk / Treatment</h1>
          <p className="admin-subtitle">{products.length} produk</p>
        </div>
        <Link href="/admin/products/new" className="button button-primary">
          Tambah Produk
        </Link>
      </div>

      <div className="admin-list">
        {products.map((product) => (
          <article className="admin-list-item surface-card" key={product.id}>
            <div>
              <div className="admin-list-title-row">
                <h2 className="admin-list-title">{product.name}</h2>
                {product.label && (
                  <span className="status-pill" style={{ color: 'var(--gold)', background: 'rgba(184,131,62,.12)' }}>
                    {product.label}
                  </span>
                )}
                <span
                  className="status-pill"
                  style={{
                    color: product.is_active ? '#1b8f4d' : '#c0392b',
                    background: product.is_active ? 'rgba(27,143,77,.12)' : 'rgba(192,57,43,.12)',
                  }}
                >
                  {product.is_active ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
              <p className="admin-list-desc">{product.short_description}</p>
              <div className="admin-list-meta">
                <span>{formatPrice(product)}</span>
                {product.duration_minutes && <span>{product.duration_minutes} menit</span>}
                <span>{product.booking_count} booking</span>
                {product.show_on_homepage && <span style={{ color: 'var(--ocean)' }}>Homepage #{product.homepage_order}</span>}
              </div>
            </div>
            <Link href={`/admin/products/${product.id}/edit`} className="button button-secondary">
              Edit
            </Link>
          </article>
        ))}

        {products.length === 0 && (
          <div className="empty-state surface-card">
            Belum ada produk.{' '}
            <Link href="/admin/products/new" style={{ color: 'var(--ocean)', fontWeight: 800 }}>
              Tambah produk pertama
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

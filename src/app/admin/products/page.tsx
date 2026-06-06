import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatPrice(product: { priceAmount: number; priceLabel: string | null }) {
  return product.priceLabel ?? `IDR ${product.priceAmount.toLocaleString('id-ID')}`;
}

export default async function ProductsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const products = await prisma.product.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

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
                    color: product.isActive ? '#1b8f4d' : '#c0392b',
                    background: product.isActive ? 'rgba(27,143,77,.12)' : 'rgba(192,57,43,.12)',
                  }}
                >
                  {product.isActive ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
              <p className="admin-list-desc">{product.shortDescription}</p>
              <div className="admin-list-meta">
                <span>{formatPrice(product)}</span>
                {product.durationMinutes && <span>{product.durationMinutes} menit</span>}
                <span>{product._count.bookings} booking</span>
                {product.showOnHomepage && <span style={{ color: 'var(--ocean)' }}>Homepage #{product.homepageOrder}</span>}
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

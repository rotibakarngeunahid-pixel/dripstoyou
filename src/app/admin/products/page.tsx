import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ProductsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const products = await prisma.product.findMany({
    orderBy: [{ homepageOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

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
                <span style={{ background: p.isActive ? '#25D36622' : '#ef444422', color: p.isActive ? '#25D366' : '#ef4444', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>
                  {p.isActive ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
              <p style={{ color: '#6b7e7e', fontSize: 13, margin: '0 0 6px' }}>{p.shortDescription}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7e7e' }}>
                <span>{p.priceLabel ?? `IDR ${p.priceAmount.toLocaleString('id-ID')}`}</span>
                {p.durationMinutes && <span>{p.durationMinutes} menit</span>}
                <span>{p._count.bookings} booking</span>
                {p.showOnHomepage && <span style={{ color: '#29808B' }}>Homepage #{p.homepageOrder}</span>}
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

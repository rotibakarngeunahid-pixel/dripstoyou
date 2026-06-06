import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ProductForm } from '../../ProductForm';

interface Product {
  id: string; name: string; slug: string;
  short_description: string | null; full_description: string | null;
  price_amount: number; price_label: string | null;
  duration_minutes: number | null; image_url: string | null; label: string | null;
  is_active: boolean; show_on_homepage: boolean; homepage_order: number;
  category_id: string | null;
  benefits: { id: string; benefit_text: string; sort_order: number }[];
}

async function getProduct(id: string, token: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products.php?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const { id }  = await params;
  const product = await getProduct(id, session.adminToken);
  if (!product) notFound();

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#205251', marginBottom: 28 }}>
        Edit Produk: {product.name}
      </h1>
      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 32, boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
        <ProductForm product={product} />
      </div>
    </div>
  );
}

import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ProductForm } from '../../ProductForm';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  price_amount: number;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  homepage_order: number;
  category_id: string | null;
  benefits: { id: string; benefit_text: string; sort_order: number }[];
}

async function getProduct(id: string, token: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products.php?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
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

  const { id } = await params;
  const product = await getProduct(id, session.adminToken);
  if (!product) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Edit Produk</h1>
          <p className="admin-subtitle">{product.name}</p>
        </div>
      </div>
      <section className="form-card">
        <ProductForm product={product} />
      </section>
    </div>
  );
}

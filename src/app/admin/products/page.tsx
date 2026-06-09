import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import ProductListClient from './ProductListClient';

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

export default async function ProductsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const products = await getProducts(session.adminToken);

  return <ProductListClient products={products} />;
}

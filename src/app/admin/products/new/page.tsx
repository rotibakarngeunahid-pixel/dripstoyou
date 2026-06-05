import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ProductForm } from '../ProductForm';

export default async function NewProductPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#205251', marginBottom: 28 }}>
        Tambah Produk Baru
      </h1>
      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 32, boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
        <ProductForm />
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ProductForm } from '../ProductForm';

export default async function NewProductPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Tambah Produk Baru</h1>
          <p className="admin-subtitle">Buat treatment baru untuk katalog publik dan homepage.</p>
        </div>
      </div>
      <section className="form-card">
        <ProductForm />
      </section>
    </div>
  );
}

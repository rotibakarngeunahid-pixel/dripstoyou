'use client';

import Link from 'next/link';
import { formatPrice as formatCurrencyPrice } from '@/lib/currency';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

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

function formatPrice(product: Product) {
  return product.price_label ?? formatCurrencyPrice(product.price_amount, product.currency);
}

export default function ProductListClient({ products }: { products: Product[] }) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.produkTitle}</h1>
          <p className="admin-subtitle">{products.length} {t.produkSuffix}</p>
        </div>
        <Link href="/admin/products/new" className="button button-primary">
          {t.tambahProdukBtn}
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
                    color:      product.is_active ? '#1b8f4d' : '#c0392b',
                    background: product.is_active ? 'rgba(27,143,77,.12)' : 'rgba(192,57,43,.12)',
                  }}
                >
                  {product.is_active ? t.aktif : t.nonaktif}
                </span>
              </div>
              <p className="admin-list-desc">{product.short_description}</p>
              <div className="admin-list-meta">
                <span>{formatPrice(product)}</span>
                {product.duration_minutes && <span>{product.duration_minutes} {t.menitSuffix}</span>}
                <span>{product.booking_count} {t.bookingSuffix}</span>
                {product.show_on_homepage && <span style={{ color: 'var(--ocean)' }}>Homepage #{product.homepage_order}</span>}
              </div>
            </div>
            <Link href={`/admin/products/${product.id}/edit`} className="button button-secondary">
              {t.edit}
            </Link>
          </article>
        ))}

        {products.length === 0 && (
          <div className="empty-state surface-card">
            {t.belumAdaProduk}{' '}
            <Link href="/admin/products/new" style={{ color: 'var(--ocean)', fontWeight: 800 }}>
              {t.tambahProdukPertama}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

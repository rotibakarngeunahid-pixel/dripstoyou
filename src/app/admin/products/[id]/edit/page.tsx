import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ProductForm } from '../../ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      benefits: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!product) notFound();

  const productForForm = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    short_description: product.shortDescription,
    full_description: product.fullDescription,
    price_amount: product.priceAmount,
    price_label: product.priceLabel,
    duration_minutes: product.durationMinutes,
    image_url: product.imageUrl,
    label: product.label,
    is_active: product.isActive,
    show_on_homepage: product.showOnHomepage,
    homepage_order: product.homepageOrder,
    benefits: product.benefits.map((b) => ({ benefit_text: b.benefitText })),
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Edit Produk</h1>
          <p className="admin-subtitle">{product.name}</p>
        </div>
      </div>
      <section className="form-card">
        <ProductForm product={productForForm} />
      </section>
    </div>
  );
}

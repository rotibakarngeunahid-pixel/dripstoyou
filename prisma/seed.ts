import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Service Areas
  const areas = [
    { name: 'Seminyak',        slug: 'seminyak',        sortOrder: 1 },
    { name: 'Canggu',          slug: 'canggu',          sortOrder: 2 },
    { name: 'Kuta',            slug: 'kuta',            sortOrder: 3 },
    { name: 'Ubud',            slug: 'ubud',            sortOrder: 4 },
    { name: 'Nusa Dua',        slug: 'nusa-dua',        sortOrder: 5 },
    { name: 'Jimbaran',        slug: 'jimbaran',        sortOrder: 6 },
    { name: 'Legian',          slug: 'legian',          sortOrder: 7 },
    { name: 'Sanur',           slug: 'sanur',           sortOrder: 8 },
    { name: 'Denpasar',        slug: 'denpasar',        sortOrder: 9 },
    { name: 'Uluwatu',         slug: 'uluwatu',         sortOrder: 10 },
    { name: 'Petitenget',      slug: 'petitenget',      sortOrder: 11 },
    { name: 'Bukit Peninsula', slug: 'bukit-peninsula', sortOrder: 12 },
  ];

  for (const area of areas) {
    await prisma.serviceArea.upsert({
      where:  { slug: area.slug },
      update: {},
      create: { ...area, isActive: true, estimatedArrivalMinutes: 60 },
    });
  }
  console.log(`✓ ${areas.length} service areas`);

  // Product Category
  const category = await prisma.productCategory.upsert({
    where:  { slug: 'iv-therapy' },
    update: {},
    create: { name: 'IV Therapy', slug: 'iv-therapy', sortOrder: 1 },
  });

  // Products
  const products = [
    {
      name: 'Hangover Recovery',
      slug: 'hangover-recovery',
      shortDescription: 'Rehidrasi cepat, vitamin B & C, anti-nausea',
      priceAmount: 750000,
      priceLabel: 'IDR 750.000',
      durationMinutes: 45,
      label: 'Popular',
      showOnHomepage: true,
      homepageOrder: 1,
    },
    {
      name: 'Immune Booster',
      slug: 'immune-booster',
      shortDescription: 'Vitamin C high-dose, zinc, glutathione',
      priceAmount: 650000,
      priceLabel: 'IDR 650.000',
      durationMinutes: 45,
      label: 'Best Seller',
      showOnHomepage: true,
      homepageOrder: 2,
    },
    {
      name: 'Energy Boost',
      slug: 'energy-boost',
      shortDescription: 'B-complex, magnesium, elektrolit penuh',
      priceAmount: 550000,
      priceLabel: 'IDR 550.000',
      durationMinutes: 45,
      label: null,
      showOnHomepage: true,
      homepageOrder: 3,
    },
    {
      name: 'Beauty Glow',
      slug: 'beauty-glow',
      shortDescription: 'Glutathione, collagen boost, antioksidan',
      priceAmount: 700000,
      priceLabel: 'IDR 700.000',
      durationMinutes: 45,
      label: 'New',
      showOnHomepage: true,
      homepageOrder: 4,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where:  { slug: p.slug },
      update: {},
      create: { ...p, categoryId: category.id, isActive: true },
    });
  }
  console.log(`✓ ${products.length} products`);

  // Schedule Settings (Mon-Sun, 0=Sun)
  for (let day = 0; day <= 6; day++) {
    await prisma.scheduleSetting.upsert({
      where:  { dayOfWeek: day },
      update: {},
      create: {
        dayOfWeek:            day,
        isOpen:               true,
        openTime:             '08:00',
        closeTime:            '22:00',
        slotDurationMinutes:  60,
        maxBookingsPerSlot:   3,
        minPrebookingMinutes: 120,
      },
    });
  }
  console.log('✓ Schedule settings (7 days)');

  // Testimonials
  const testimonials = [
    { customerName: 'Sarah Johnson', rating: 5, content: 'Pelayanannya sangat cepat dan profesional. Tim datang ke villa kami dalam 45 menit. Setelah treatment, langsung bisa jalan-jalan lagi! Sangat recommended.', treatmentTag: 'Hangover Recovery', sortOrder: 1 },
    { customerName: 'James Miller',  rating: 5, content: "Tried the Hangover Recovery after a night in Canggu. Genuinely felt better within 2 hours. Equipment was clean and the team was super professional. Worth every rupiah!", treatmentTag: 'Hangover Recovery', sortOrder: 2 },
    { customerName: 'Maria Santos',  rating: 5, content: 'Tim medisnya sangat ramah dan peralatan terlihat steril dan berkualitas tinggi. Harga worth it banget untuk kualitas yang diberikan. Pasti akan repeat!', treatmentTag: 'Immune Booster', sortOrder: 3 },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { customerName: t.customerName } });
    if (!existing) {
      await prisma.testimonial.create({ data: { ...t, isActive: true } });
    }
  }
  console.log(`✓ ${testimonials.length} testimonials`);

  // FAQs
  const faqs = [
    { question: 'Berapa lama proses IV therapy berlangsung?', answer: 'Proses IV therapy berlangsung sekitar 30-60 menit tergantung jenis treatment yang dipilih. Tim medis kami akan mempersiapkan dan memantau proses secara penuh.', sortOrder: 1 },
    { question: 'Apakah aman dilakukan di villa atau hotel?', answer: 'Ya, aman. Tim medis kami membawa semua peralatan steril yang diperlukan. Kami hanya membutuhkan tempat duduk atau berbaring yang nyaman untuk Anda.', sortOrder: 2 },
    { question: 'Berapa lama waktu respons setelah booking?', answer: 'Tim kami biasanya tiba dalam 30-60 menit setelah konfirmasi booking. Kami akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal.', sortOrder: 3 },
    { question: 'Area mana saja yang dicakup?', answer: 'Kami melayani seluruh area wisata utama Bali termasuk Seminyak, Canggu, Kuta, Ubud, Nusa Dua, Jimbaran, Legian, Sanur, Denpasar, Uluwatu, Petitenget, dan Bukit Peninsula.', sortOrder: 4 },
    { question: 'Apakah ada biaya tambahan?', answer: 'Harga yang tertera sudah termasuk biaya kunjungan ke lokasi Anda di area layanan kami. Untuk area yang sangat jauh, mungkin ada biaya perjalanan tambahan yang akan dikomunikasikan sebelum treatment.', sortOrder: 5 },
  ];

  for (const f of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (!existing) {
      await prisma.faq.create({ data: { ...f, isActive: true } });
    }
  }
  console.log(`✓ ${faqs.length} FAQs`);

  // Site Settings
  const settings = [
    { key: 'whatsapp_number',      valueEncryptedOrJson: process.env.WHATSAPP_NUMBER ?? '6281200000000' },
    { key: 'business_hours',       valueEncryptedOrJson: '08:00-22:00' },
    { key: 'response_time_minutes', valueEncryptedOrJson: '60' },
    { key: 'site_name',            valueEncryptedOrJson: 'DRIP TO YOU Bali' },
    { key: 'site_email',           valueEncryptedOrJson: 'hello@dripstoyou.com' },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log(`✓ ${settings.length} site settings`);

  // Super Admin (only if no admins exist)
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const tempPassword = 'AdminDrip2025!';
    const hash = await bcrypt.hash(tempPassword, 12);
    await prisma.admin.create({
      data: {
        name:         'Super Admin',
        email:        'admin@dripstoyou.com',
        passwordHash: hash,
        role:         'SUPER_ADMIN',
        isActive:     true,
      },
    });
    console.log(`✓ Super admin created: admin@dripstoyou.com / ${tempPassword}`);
    console.log('  ⚠  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!');
  } else {
    console.log('✓ Admin users already exist — skipping');
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

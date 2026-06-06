import { NextRequest, NextResponse } from 'next/server';
import { adminApiHandler } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TEMPLATE_KEY = 'wa_booking_template';

export const DEFAULT_TEMPLATE = `Hello Drips To You Bali, I would like to book a treatment.

Treatment: {treatment_name}
Name: {customer_name}
Date: {booking_date}
Time: {booking_time}
Location: {location}
Address: {address}
Notes: {notes}

Booking ID: {booking_id}`;

const ALLOWED_PLACEHOLDERS = new Set([
  'customer_name', 'treatment_name', 'booking_date', 'booking_time',
  'location', 'address', 'phone', 'notes', 'booking_id',
]);

function findInvalidPlaceholders(template: string): string[] {
  const found: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (!ALLOWED_PLACEHOLDERS.has(m[1])) found.push(m[1]);
  }
  return found;
}

export const GET = adminApiHandler(null, async () => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: TEMPLATE_KEY } });
    const template = row?.valueEncryptedOrJson ?? DEFAULT_TEMPLATE;
    return NextResponse.json({ data: { template, defaultTemplate: DEFAULT_TEMPLATE, allowedPlaceholders: [...ALLOWED_PLACEHOLDERS] } });
  } catch {
    return NextResponse.json({ data: { template: DEFAULT_TEMPLATE, defaultTemplate: DEFAULT_TEMPLATE, allowedPlaceholders: [...ALLOWED_PLACEHOLDERS] } });
  }
});

export const PUT = adminApiHandler(null, async (req: NextRequest, session) => {
  const body = await req.json() as { template?: unknown };
  const template = body.template;

  if (typeof template !== 'string' || !template.trim()) {
    return NextResponse.json({ error: 'Template tidak boleh kosong' }, { status: 400 });
  }

  const invalid = findInvalidPlaceholders(template);
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Placeholder tidak dikenal: {${invalid.join('}, {')}}. Gunakan hanya placeholder yang tersedia.` },
      { status: 400 },
    );
  }

  await prisma.siteSetting.upsert({
    where: { key: TEMPLATE_KEY },
    update: { valueEncryptedOrJson: template, updatedByAdminId: session.adminId },
    create: { key: TEMPLATE_KEY, valueEncryptedOrJson: template, updatedByAdminId: session.adminId },
  });

  return NextResponse.json({ success: true, message: 'Template WhatsApp berhasil disimpan.' });
});

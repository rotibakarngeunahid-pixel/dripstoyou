import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, category: true, question: true, answer: true },
    });
    return NextResponse.json({ data: faqs });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const links = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
      select: { id: true, platform: true, label: true, normalizedUrl: true },
    });
    return NextResponse.json({ data: links });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

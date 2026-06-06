import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = adminApiHandler('content:read', async () => {
  const pages = await prisma.legalPage.findMany({
    orderBy: { type: 'asc' },
    select: { id: true, type: true, title: true, slug: true, isPublished: true, updatedAt: true },
  });
  return NextResponse.json({ data: pages });
});

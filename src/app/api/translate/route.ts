import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { translateTextsOffline } from '@/lib/offline-translate';

const BodySchema = z.object({
  texts: z.array(z.string().max(6000)).min(1).max(60),
  targetLang: z.enum(['en', 'id']),
  sourceLang: z.enum(['en', 'id', 'auto']).optional().default('auto'),
});

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { texts, targetLang, sourceLang } = parsed.data;

  return NextResponse.json({
    translations: translateTextsOffline(texts, targetLang, sourceLang),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const BodySchema = z.object({
  texts: z.array(z.string().max(6000)).min(1).max(60),
  targetLang: z.enum(['en', 'id']),
});

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  id: 'Indonesian',
};

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json(
      { error: 'Translation service not configured' },
      { status: 503 },
    );
  }

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

  const { texts, targetLang } = parsed.data;
  const langName = LANG_NAMES[targetLang] ?? targetLang;

  const numbered = texts
    .map((t, i) => `${i + 1}. ${JSON.stringify(t)}`)
    .join('\n');

  const userMessage = `Translate the following Indonesian texts to ${langName} for a luxury mobile IV therapy wellness brand in Bali.

Rules:
- Keep the tone warm, natural, and premium — never stiff or robotic
- Preserve any line breaks (\\n) and spacing
- Medical and wellness terms should sound professional
- Brand names and proper nouns may be kept as-is when appropriate
- Return ONLY a valid JSON array of strings in the exact same order and count, no other text

Texts to translate:
${numbered}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[translate] Anthropic error:', res.status, errText);
      return NextResponse.json(
        { error: 'Translation upstream error' },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      content?: { type: string; text: string }[];
    };
    const rawText = data.content?.[0]?.text ?? '[]';

    // Extract JSON array — handle optional markdown code fences
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[translate] No JSON array found in response:', rawText.slice(0, 200));
      return NextResponse.json({ translations: texts });
    }

    let translations: unknown;
    try {
      translations = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[translate] JSON parse failed:', jsonMatch[0].slice(0, 200));
      return NextResponse.json({ translations: texts });
    }

    if (!Array.isArray(translations)) {
      return NextResponse.json({ translations: texts });
    }

    // Ensure array length matches; pad with originals if model returned fewer
    const result: string[] = texts.map(
      (t, i) => (typeof (translations as unknown[])[i] === 'string' ? (translations as string[])[i] : t),
    );

    return NextResponse.json({ translations: result });
  } catch (err) {
    console.error('[translate] Fetch error:', err);
    return NextResponse.json({ translations: texts });
  }
}

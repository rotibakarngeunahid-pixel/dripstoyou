// Skema Zod untuk mutation blog (docs/PRD-Blog.md §10.2).
//
// Blog adalah fitur pertama di panel admin yang benar-benar memvalidasi body di
// layer Next.js sebelum diteruskan ke PHP. PHP tetap memvalidasi ulang (trust
// boundary terakhir — endpoint PHP bisa dipanggil tanpa lewat proxy ini).

import { z } from 'zod';
import { BLOG_STATUSES, type BlogStatus } from '@/lib/blog-status';
import {
  estimateReadingMinutes,
  extractMarkdownImages,
  hasTopLevelHeading,
  renderMarkdown,
} from '@/lib/markdown';

export { BLOG_STATUSES, type BlogStatus } from '@/lib/blog-status';

const SLUG_RE = /^[a-z0-9-]+$/;

const optionalText = (max: number) =>
  z.string().max(max).transform((v) => v.trim()).optional().nullable();

const optionalUrl = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .refine((v) => v === '' || /^https?:\/\//i.test(v), 'URL harus diawali http:// atau https://')
    .optional()
    .nullable();

// "2026-07-24T09:00" (input datetime-local) atau "2026-07-24 09:00:00".
const optionalDateTime = z
  .string()
  .max(25)
  .transform((v) => v.trim())
  .refine(
    (v) => v === '' || !Number.isNaN(new Date(v.replace(' ', 'T')).getTime()),
    'Tanggal tayang tidak valid',
  )
  .optional()
  .nullable();

const baseFields = {
  title: z.string().transform((v) => v.trim()).pipe(z.string().min(3, 'Judul minimal 3 karakter').max(200)),
  slug: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, 'Slug wajib diisi').max(200).regex(SLUG_RE, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')),
  categoryId: optionalText(191),
  excerpt: optionalText(500),
  contentSource: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Isi artikel wajib diisi').max(200000)),
  coverImageUrl: optionalUrl(500),
  coverImageAlt: optionalText(255),
  metaTitle: optionalText(70),
  metaDescription: optionalText(200),
  canonicalUrl: optionalUrl(500),
  ogImageUrl: optionalUrl(500),
  authorName: optionalText(120),
  status: z.enum(BLOG_STATUSES).default('draft'),
  publishedAt: optionalDateTime,
};

type BlogInput = {
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  contentSource?: string | null;
  status?: BlogStatus;
  publishedAt?: string | null;
};

// Aturan lintas-field yang dipakai create & update.
function checkCrossFieldRules(value: BlogInput, ctx: z.RefinementCtx): void {
  // §8.9 — cover tanpa alt tidak boleh disimpan.
  if (value.coverImageUrl && !value.coverImageAlt) {
    ctx.addIssue({
      code: 'custom',
      path: ['coverImageAlt'],
      message: 'Alt text cover wajib diisi bila ada gambar cover.',
    });
  }

  if (value.contentSource) {
    // §8.8 — H1 hanya milik judul artikel.
    if (hasTopLevelHeading(value.contentSource)) {
      ctx.addIssue({
        code: 'custom',
        path: ['contentSource'],
        message: 'Body artikel tidak boleh memakai heading "# " (H1). Gunakan "## " untuk sub-judul.',
      });
    }
    // §8.9 — semua gambar di body wajib punya alt.
    if (extractMarkdownImages(value.contentSource).some((img) => img.alt === '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['contentSource'],
        message: 'Setiap gambar di body wajib punya alt text: ![deskripsi gambar](url).',
      });
    }
  }

  // Artikel terjadwal harus punya waktu tayang.
  if (value.status === 'scheduled' && !value.publishedAt) {
    ctx.addIssue({
      code: 'custom',
      path: ['publishedAt'],
      message: 'Artikel terjadwal butuh tanggal & jam tayang.',
    });
  }
}

export const blogPostCreateSchema = z.object(baseFields).superRefine(checkCrossFieldRules);

export const blogPostUpdateSchema = z
  .object({
    ...baseFields,
    // Semua field opsional saat update — hanya yang dikirim yang diubah.
    status: z.enum(BLOG_STATUSES).optional(),
  })
  .partial()
  .superRefine(checkCrossFieldRules);

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

// Payload yang dikirim ke PHP. `content` (HTML) diturunkan dari Markdown di sini
// supaya penulis tidak pernah bisa mengirim HTML mentah pilihannya sendiri.
export function toBlogPhpPayload(
  input: BlogPostCreateInput | BlogPostUpdateInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    payload[key] = value ?? '';
  }

  if (typeof input.contentSource === 'string') {
    payload.content = renderMarkdown(input.contentSource);
    payload.readingMinutes = estimateReadingMinutes(input.contentSource);
  }

  return payload;
}

/* ─── Kategori ─── */

export const blogCategoryCreateSchema = z.object({
  name: z.string().transform((v) => v.trim()).pipe(z.string().min(2, 'Nama kategori minimal 2 karakter').max(120)),
  slug: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, 'Slug wajib diisi').max(160).regex(SLUG_RE, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')),
  description: optionalText(500),
  metaTitle: optionalText(70),
  metaDescription: optionalText(200),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export const blogCategoryUpdateSchema = blogCategoryCreateSchema.partial();

export type BlogCategoryCreateInput = z.infer<typeof blogCategoryCreateSchema>;

// Pesan error Zod → satu kalimat yang layak ditampilkan di form admin.
export function zodErrorMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Data tidak valid.';
  return first.message;
}

// Lifecycle artikel blog (docs/PRD-Blog.md §7.3).
// Dipisah dari src/lib/validation/blog.ts supaya komponen admin bisa memakainya
// tanpa ikut menarik Zod + renderer Markdown ke bundle browser.
//
//   draft     — belum pernah tayang; URL publik 404, tidak di sitemap.
//   scheduled — sama seperti draft sampai published_at <= NOW() (gate, bukan cron).
//   published — tayang, indexable, masuk sitemap.
//   archived  — ditarik dari publik.

export const BLOG_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

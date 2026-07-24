'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import {
  formatBlogDate,
  pagedUrl,
  type BlogCategory,
  type BlogPagination,
  type BlogPostCard,
} from '@/lib/blog';

interface Props {
  posts: BlogPostCard[];
  categories: BlogCategory[];
  pagination: BlogPagination;
  /** Slug kategori aktif; kosong = halaman /blog (semua artikel). */
  activeCategory?: string;
  /** Path dasar untuk link paginasi: "/blog" atau "/blog/kategori/xxx". */
  basePath: string;
  /** Judul halaman kategori; kosong = pakai copy blog default (dwibahasa). */
  heading?: { eyebrow: string; title: string; titleEm?: string; subtitle?: string | null };
}

const ARROW_SVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CLOCK_SVG = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function BlogListContent({
  posts, categories, pagination, activeCategory, basePath, heading,
}: Props) {
  const { t, lang } = useLanguage();
  const b = t.blog;

  const { page, totalPages } = pagination;
  const hasPrev = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;

  const head = heading ?? {
    eyebrow: b.eyebrow,
    title: b.title,
    titleEm: b.titleEm,
    subtitle: b.subtitle,
  };

  return (
    <main className="page-shell">
      <section className="page-hero centered">
        <div className="page-hero-inner">
          <div className="page-eyebrow">{head.eyebrow}</div>
          <h1 className="page-title">
            {head.title} {head.titleEm && <em>{head.titleEm}</em>}
          </h1>
          {head.subtitle && <p className="page-subtitle">{head.subtitle}</p>}
        </div>
      </section>

      <section className="page-section">
        {/* Filter kategori — link <a> biasa, bukan filter JS, supaya bisa di-crawl. */}
        {categories.length > 0 && (
          <nav className="blog-cat-nav" aria-label={b.inCategory}>
            <Link
              href="/blog"
              className={`blog-cat-pill${!activeCategory ? ' active' : ''}`}
              aria-current={!activeCategory ? 'page' : undefined}
            >
              {b.allCategories}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog/kategori/${cat.slug}`}
                className={`blog-cat-pill${activeCategory === cat.slug ? ' active' : ''}`}
                aria-current={activeCategory === cat.slug ? 'page' : undefined}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <div className="empty-state surface-card">{b.emptyState}</div>
        ) : (
          <div className="blog-grid">
            {posts.map((post, index) => (
              <article className="blog-card" key={post.id}>
                <Link href={`/blog/${post.slug}`} className="blog-card-media" tabIndex={-1} aria-hidden="true">
                  {post.cover_image_url ? (
                    <Image
                      src={post.cover_image_url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="blog-card-photo"
                      /* Kartu pertama = kandidat LCP di halaman listing. */
                      priority={index === 0}
                    />
                  ) : (
                    <div className="blog-card-placeholder" />
                  )}
                </Link>

                <div className="blog-card-body">
                  {post.category && (
                    <Link href={`/blog/kategori/${post.category.slug}`} className="blog-card-cat">
                      {post.category.name}
                    </Link>
                  )}

                  <h2 className="blog-card-title">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}

                  <div className="blog-card-meta">
                    <time dateTime={post.published_at ?? undefined}>
                      {formatBlogDate(post.published_at, lang)}
                    </time>
                    {post.reading_minutes && (
                      <span className="blog-card-read">
                        {CLOCK_SVG}
                        {post.reading_minutes} {b.minRead}
                      </span>
                    )}
                  </div>

                  <Link href={`/blog/${post.slug}`} className="blog-card-link">
                    {b.readArticle}
                    {ARROW_SVG}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Paginasi crawlable: <a href> yang ter-render server-side (§8.12). */}
        {totalPages > 1 && (
          <nav className="blog-pagination" aria-label="Pagination">
            {hasPrev ? (
              <Link href={pagedUrl(basePath, page - 1)} className="blog-page-btn" rel="prev">
                {b.prevPage}
              </Link>
            ) : (
              <span className="blog-page-btn is-disabled" aria-disabled="true">{b.prevPage}</span>
            )}

            <span className="blog-page-status">
              {b.pageOf.replace('{n}', String(page)).replace('{total}', String(totalPages))}
            </span>

            {hasNext ? (
              <Link href={pagedUrl(basePath, page + 1)} className="blog-page-btn" rel="next">
                {b.nextPage}
              </Link>
            ) : (
              <span className="blog-page-btn is-disabled" aria-disabled="true">{b.nextPage}</span>
            )}
          </nav>
        )}

        {/* Nomor halaman eksplisit — memberi crawler jalur langsung ke halaman dalam. */}
        {totalPages > 1 && (
          <div className="blog-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pagedUrl(basePath, n)}
                className={`blog-page-num${n === page ? ' active' : ''}`}
                aria-current={n === page ? 'page' : undefined}
              >
                {n}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

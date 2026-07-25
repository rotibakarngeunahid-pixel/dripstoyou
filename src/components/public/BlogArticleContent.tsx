'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/language';
import type { MarkdownHeading } from '@/lib/markdown';
import { blogAuthorName, formatBlogDate, toIsoOrNull, type BlogPost, type BlogPostCard } from '@/lib/blog';

interface Props {
  post: BlogPost;
  /** HTML hasil renderMarkdown() di server — sudah escape-first, tidak pernah HTML mentah dari DB. */
  contentHtml: string;
  /** Sub-judul body, dari pass render yang sama supaya anchor-nya pasti cocok. */
  headings: MarkdownHeading[];
  related: BlogPostCard[];
}

// Daftar isi baru muncul saat artikel benar-benar panjang; di artikel pendek ia
// hanya mendorong isi ke bawah tanpa menolong siapa pun. H4 sengaja tidak ikut
// supaya daftarnya tetap terbaca sebagai kerangka, bukan salinan artikel.
const TOC_MIN_HEADINGS = 3;

const CLOCK_SVG = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ARROW_SVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
};

// Event GA4 `blog_cta_click` (§2 / §8.10). No-op selama GA/GTM belum dipasang —
// begitu tag terpasang, event langsung terkirim tanpa perubahan kode.
function trackCtaClick(slug: string, target: string) {
  if (typeof window === 'undefined') return;
  const w = window as AnalyticsWindow;
  const params = { article_slug: slug, cta_target: target };
  w.gtag?.('event', 'blog_cta_click', params);
  w.dataLayer?.push({ event: 'blog_cta_click', ...params });
}

// Indikator progres baca. Di ponsel tidak ada scrollbar, jadi pembaca tidak
// punya petunjuk seberapa panjang artikelnya — bar tipis ini menggantikannya.
// Dipasang lewat transform (bukan width) + rAF + listener passive supaya tidak
// memicu layout ulang dan tidak merusak target INP.
function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const el = barRef.current;
      if (!el) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.transform = `scaleX(${ratio})`;
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="blog-progress" aria-hidden="true">
      <div className="blog-progress-bar" ref={barRef} />
    </div>
  );
}

export default function BlogArticleContent({ post, contentHtml, headings, related }: Props) {
  const { t, lang } = useLanguage();
  const b = t.blog;

  const author = blogAuthorName(post);
  const publishedLabel = formatBlogDate(post.published_at, lang);
  const updatedLabel = formatBlogDate(post.updated_at, lang);
  const showUpdated = updatedLabel && updatedLabel !== publishedLabel;
  const readingMinutes = post.reading_minutes ?? 0;

  // MySQL mengirim "2026-07-24 09:00:00"; atribut datetime HTML menuntut ISO
  // 8601 ("2026-07-24T02:00:00.000Z"). Nilai mentah tadi tidak valid dan
  // diabaikan parser tanggal, termasuk milik mesin pencari.
  const publishedIso = toIsoOrNull(post.published_at);
  const updatedIso = toIsoOrNull(post.updated_at);

  const toc = headings.filter((heading) => heading.level <= 3);
  const showToc = toc.length >= TOC_MIN_HEADINGS;

  return (
    <main className="page-shell blog-article-shell">
      <ReadingProgress />
      <article className="blog-article">
        {/* Breadcrumb tampilan — pasangan visual dari BreadcrumbList JSON-LD. */}
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
          {post.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/blog/kategori/${post.category.slug}`}>{post.category.name}</Link>
            </>
          )}
        </nav>

        <header className="blog-article-head">
          {post.category && (
            <Link href={`/blog/kategori/${post.category.slug}`} className="blog-article-cat">
              {post.category.name}
            </Link>
          )}

          {/* Satu-satunya H1 di halaman ini (§8.8) — body tidak boleh punya H1. */}
          <h1 className="blog-article-title">{post.title}</h1>

          {post.excerpt && <p className="blog-article-lead">{post.excerpt}</p>}

          <div className="blog-article-meta">
            <span>{b.writtenBy} <strong>{author}</strong></span>
            {publishedLabel && (
              <span>
                {b.publishedOn}{' '}
                <time dateTime={publishedIso ?? undefined}>{publishedLabel}</time>
              </span>
            )}
            {showUpdated && (
              <span>
                {b.updatedOn}{' '}
                <time dateTime={updatedIso ?? undefined}>{updatedLabel}</time>
              </span>
            )}
            {readingMinutes > 0 && (
              <span className="blog-article-read">
                {CLOCK_SVG}
                {readingMinutes} {b.minRead}
              </span>
            )}
          </div>
        </header>

        {post.cover_image_url && (
          <figure className="blog-article-cover">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              width={1200}
              height={675}
              sizes="(max-width: 820px) 100vw, 820px"
              className="blog-article-cover-img"
              /* Cover = elemen LCP; dimensi eksplisit menjaga CLS tetap 0. */
              priority
            />
          </figure>
        )}

        {showToc && (
          <nav className="blog-toc" aria-labelledby="blog-toc-title">
            <h2 className="blog-toc-title" id="blog-toc-title">{b.tocTitle}</h2>
            <ol className="blog-toc-list">
              {toc.map((heading) => (
                <li key={heading.id} className={`blog-toc-item level-${heading.level}`}>
                  <a href={`#${heading.id}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />

        <p className="blog-disclaimer">{b.disclaimer}</p>

        {/* CTA wajib per artikel (§8.10) — internal link ke funnel booking. */}
        <aside className="blog-cta">
          <h2 className="blog-cta-title">{b.ctaTitle}</h2>
          <p className="blog-cta-sub">{b.ctaSub}</p>
          <div className="blog-cta-actions">
            <Link
              href="/booking"
              className="button button-gold"
              onClick={() => trackCtaClick(post.slug, 'booking')}
            >
              {b.ctaBook}
              {ARROW_SVG}
            </Link>
            <Link
              href="/treatments"
              className="button button-secondary"
              onClick={() => trackCtaClick(post.slug, 'treatments')}
            >
              {b.ctaTreatments}
            </Link>
          </div>
        </aside>

        {related.length > 0 && (
          <section className="blog-related" aria-labelledby="blog-related-title">
            <h2 className="blog-related-title" id="blog-related-title">{b.relatedTitle}</h2>
            <div className="blog-related-grid">
              {related.map((item) => (
                <article className="blog-related-card" key={item.id}>
                  {item.cover_image_url && (
                    <Link href={`/blog/${item.slug}`} className="blog-related-media" tabIndex={-1} aria-hidden="true">
                      <Image
                        src={item.cover_image_url}
                        alt=""
                        fill
                        /* Di ponsel kartu ini jadi baris ringkas dgn thumbnail
                           ~112px — jangan tarik gambar selebar viewport. */
                        sizes="(max-width: 767px) 120px, 260px"
                        className="blog-related-photo"
                      />
                    </Link>
                  )}
                  <div className="blog-related-body">
                    <h3 className="blog-related-heading">
                      <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                    </h3>
                    <span className="blog-related-date">{formatBlogDate(item.published_at, lang)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="blog-article-back">
          <Link href="/blog" className="icon-link">{b.backToBlog}</Link>
        </div>
      </article>
    </main>
  );
}

'use client';

// Pratinjau draf LANGSUNG dari editor — membaca isi form yang sedang diketik
// (lewat localStorage), bukan versi tersimpan di database. Karena itu berbeda
// dari /admin/blog/[id]/preview yang menampilkan artikel yang sudah disimpan.
//
// Dibuka di tab baru oleh tombol "Pratinjau" di BlogForm. Hidup di bawah /admin
// jadi otomatis butuh sesi + noindex (metadata layout admin). Tidak ada data
// dari server: semuanya berasal dari localStorage penulis sendiri.

import { useEffect, useState } from 'react';
import { renderMarkdownDocument } from '@/lib/markdown';

// Dibagikan dengan BlogForm — kalau berubah, ubah di kedua tempat.
export const BLOG_PREVIEW_STORAGE_KEY = 'drip-blog-preview';

interface PreviewPayload {
  title: string;
  excerpt: string;
  contentSource: string;
  coverUrl: string;
  coverAlt: string;
  categoryName: string;
  authorName: string;
  readingMinutes: number;
  savedAt: number;
}

export default function BlogDraftPreviewPage() {
  // `null` = belum dibaca (hindari mismatch hidrasi); `'empty'` = tidak ada data.
  const [data, setData] = useState<PreviewPayload | null | 'empty'>(null);

  useEffect(() => {
    let payload: PreviewPayload | 'empty';
    try {
      const raw = localStorage.getItem(BLOG_PREVIEW_STORAGE_KEY);
      payload = raw ? (JSON.parse(raw) as PreviewPayload) : 'empty';
    } catch {
      payload = 'empty';
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(payload);
    document.title = 'Pratinjau Artikel — Drips To You - Bali';
  }, []);

  if (data === null) {
    return (
      <div className="admin-page">
        <p className="admin-subtitle">Memuat pratinjau…</p>
      </div>
    );
  }

  if (data === 'empty') {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Pratinjau Artikel</h1>
        <p className="admin-subtitle">
          Tidak ada data pratinjau. Buka pratinjau lewat tombol di editor artikel.
        </p>
      </div>
    );
  }

  const { html, headings } = renderMarkdownDocument(data.contentSource);
  const toc = headings.filter((heading) => heading.level <= 3);
  const showToc = toc.length >= 3;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Pratinjau Artikel</h1>
          <p className="admin-subtitle">
            Draf yang sedang diedit · belum tersimpan · tidak diindeks mesin pencari.
          </p>
        </div>
        <button type="button" className="button button-secondary" onClick={() => window.close()}>
          Tutup Tab
        </button>
      </div>

      <section className="surface-card">
        <article className="blog-article" style={{ padding: 0 }}>
          <header className="blog-article-head">
            {data.categoryName && <span className="blog-article-cat">{data.categoryName}</span>}
            {/* Judul = H1 artikel (di sini H2 karena H1 halaman milik "Pratinjau Artikel"). */}
            <h2 className="blog-article-title">{data.title.trim() || 'Tanpa judul'}</h2>
            {data.excerpt && <p className="blog-article-lead">{data.excerpt}</p>}
            <div className="blog-article-meta">
              <span>{data.authorName.trim() || 'Drips To You - Bali'}</span>
              {data.readingMinutes > 0 && <span>{data.readingMinutes} menit baca</span>}
            </div>
          </header>

          {data.coverUrl && (
            <figure className="blog-article-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.coverUrl} alt={data.coverAlt} className="blog-article-cover-img" />
            </figure>
          )}

          {showToc && (
            <nav className="blog-toc" aria-label="Daftar isi">
              <h2 className="blog-toc-title">Daftar Isi</h2>
              <ol className="blog-toc-list">
                {toc.map((heading) => (
                  <li key={heading.id} className={`blog-toc-item level-${heading.level}`}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {html ? (
            <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="admin-subtitle">Isi artikel masih kosong.</p>
          )}
        </article>
      </section>
    </div>
  );
}

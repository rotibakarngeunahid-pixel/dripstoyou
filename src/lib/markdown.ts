// Markdown → HTML untuk body artikel blog.
//
// KEAMANAN (docs/PRD-Blog.md §9.1 / §10.1): renderer ini "escape-first".
// Seluruh sumber di-escape (& < > ") LEBIH DULU, baru sintaks Markdown
// diterjemahkan menjadi tag yang kita bangun sendiri. Konsekuensinya tidak ada
// satupun HTML mentah dari database yang bisa lolos ke halaman publik —
// `<script>alert(1)</script>` di body akan tampil sebagai teks biasa. Karena
// itu tidak dibutuhkan sanitizer HTML terpisah dan tidak ada dependency baru.
//
// Halaman publik SELALU merender ulang dari `content_source` (Markdown) lewat
// fungsi ini; kolom `content` (HTML turunan) tidak pernah disuntikkan mentah.
//
// Subset yang didukung sengaja dibatasi: H2/H3/H4 (H1 dinormalisasi jadi H2
// karena H1 halaman milik judul artikel — §8.8), paragraf, list, blockquote,
// fenced code, hr, gambar, link, bold/italic/inline-code.

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const UL_RE = /^[-*+]\s+(.*)$/;
const OL_RE = /^\d+[.)]\s+(.*)$/;
const HR_RE = /^\s*([-*_])(\s*\1){2,}\s*$/;
// Parsing blok berjalan SETELAH escape, jadi "> kutipan" sudah jadi "&gt; kutipan".
const QUOTE_RE = /^&gt;\s?(.*)$/;
const FENCE_RE = /^```\s*([a-zA-Z0-9+#-]*)\s*$/;
// Regex ini jalan di atas teks yang SUDAH di-escape, jadi tanda kutip judul
// opsional sudah berbentuk &quot;.
const IMAGE_ONLY_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)$/;

// Sentinel penampung potongan HTML jadi. Aman karena karakter kontrol dibuang
// dari sumber sebelum apa pun diproses.
const PH = '\u0001';

export interface MarkdownImage {
  alt: string;
  url: string;
}

function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Hanya skema yang aman. `javascript:`, `data:`, `vbscript:` ditolak → link
// dibuang dan hanya teksnya yang tersisa.
function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (url === '') return null;
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url)) return url;
  return null;
}

function isInternalUrl(url: string): boolean {
  return url.startsWith('/') || url.startsWith('#') || url.startsWith('https://dripstoyou.com');
}

export function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/* ─── Inline ─── */

function renderInline(escaped: string): string {
  const stash: string[] = [];
  const keep = (html: string) => {
    stash.push(html);
    return `${PH}${stash.length - 1}${PH}`;
  };

  let out = escaped;

  // 1. Inline code — disimpan lebih dulu supaya isinya tidak ikut diproses.
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => keep(`<code>${code}</code>`));

  // 2. Gambar ![alt](url)
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (_m, alt: string, url: string) => {
      const href = safeUrl(url);
      if (!href) return alt;
      return keep(`<img src="${href}" alt="${alt}" loading="lazy" decoding="async" />`);
    },
  );

  // 3. Link [teks](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_m, text: string, url: string, title?: string) => {
      const href = safeUrl(url);
      if (!href) return text;
      const attrs = isInternalUrl(href) ? '' : ' target="_blank" rel="noopener noreferrer"';
      const titleAttr = title ? ` title="${title}"` : '';
      return keep(`<a href="${href}"${titleAttr}${attrs}>${text}</a>`);
    },
  );

  // 4. Emphasis
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\n]+)_/g, '$1<em>$2</em>');

  // 5. Kembalikan potongan yang di-stash.
  out = out.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'), (_m, i: string) => stash[Number(i)] ?? '');

  return out;
}

/* ─── Block ─── */

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return '';

  const lines = escapeHtml(stripControlChars(source)).replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Baris kosong
    if (line.trim() === '') { i += 1; continue; }

    // Fenced code block
    const fence = FENCE_RE.exec(line);
    if (fence) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // lewati penutup fence
      const langClass = fence[1] ? ` class="language-${fence[1]}"` : '';
      out.push(`<pre><code${langClass}>${body.join('\n')}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (HR_RE.test(line)) { out.push('<hr />'); i += 1; continue; }

    // Heading — H1 dinormalisasi jadi H2 (§8.8: satu H1 per halaman = judul artikel)
    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length));
      const text = renderInline(heading[2].trim());
      const id = slugifyHeading(heading[2]);
      out.push(`<h${level}${id ? ` id="${id}"` : ''}>${text}</h${level}>`);
      i += 1;
      continue;
    }

    // Gambar sendirian di satu baris → figure
    const imageOnly = IMAGE_ONLY_RE.exec(line.trim());
    if (imageOnly) {
      const href = safeUrl(imageOnly[2]);
      if (href) {
        const alt = imageOnly[1];
        const caption = imageOnly[3];
        out.push(
          `<figure class="blog-figure"><img src="${href}" alt="${alt}" loading="lazy" decoding="async" />` +
          (caption ? `<figcaption>${renderInline(caption)}</figcaption>` : '') +
          '</figure>',
        );
        i += 1;
        continue;
      }
    }

    // Blockquote
    if (QUOTE_RE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        body.push(QUOTE_RE.exec(lines[i])![1]);
        i += 1;
      }
      out.push(`<blockquote><p>${renderInline(body.join(' ').trim())}</p></blockquote>`);
      continue;
    }

    // Unordered / ordered list
    const isUl = UL_RE.test(line);
    const isOl = OL_RE.test(line);
    if (isUl || isOl) {
      const re = isUl ? UL_RE : OL_RE;
      const tag = isUl ? 'ul' : 'ol';
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(`<li>${renderInline(re.exec(lines[i])![1].trim())}</li>`);
        i += 1;
      }
      out.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    // Paragraf — kumpulkan sampai baris kosong / awal blok lain.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HEADING_RE.test(lines[i]) &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i]) &&
      !HR_RE.test(lines[i]) &&
      !QUOTE_RE.test(lines[i]) &&
      !FENCE_RE.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    if (para.length > 0) {
      out.push(`<p>${renderInline(para.join(' '))}</p>`);
    }
  }

  return out.join('\n');
}

/* ─── Turunan teks ─── */

// Teks polos dari sumber Markdown MENTAH (bukan hasil escape) — dipakai untuk
// fallback meta description & excerpt, jadi harus enak dibaca.
export function markdownToPlainText(source: string | null | undefined): string {
  if (!source) return '';
  return stripControlChars(source)
    .replace(/\r\n?/g, '\n')
    .replace(/```[\s\S]*?```/g, ' ')
    // Buang HTML mentah yang mungkin diketik penulis — teks turunan ini dipakai
    // untuk meta description/excerpt, jadi harus bersih dari markup.
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateReadingMinutes(source: string | null | undefined): number {
  const words = markdownToPlainText(source).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Semua gambar Markdown di body — dipakai validasi "alt wajib" (§8.9).
export function extractMarkdownImages(source: string | null | undefined): MarkdownImage[] {
  if (!source) return [];
  const images: MarkdownImage[] = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    images.push({ alt: match[1].trim(), url: match[2] });
  }
  return images;
}

// True bila penulis mencoba menyisipkan H1 di body (dilarang — §8.8).
export function hasTopLevelHeading(source: string | null | undefined): boolean {
  if (!source) return false;
  return /^#\s+\S/m.test(source.replace(/```[\s\S]*?```/g, ''));
}

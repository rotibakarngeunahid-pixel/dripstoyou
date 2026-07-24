// HTML/DOM → Markdown. Pasangan balik dari `renderMarkdown()`.
//
// Dipakai editor WYSIWYG blog: penulis mengedit HTML di dalam contentEditable,
// tapi yang DISIMPAN tetap Markdown di `content_source`. Kolom `content` (HTML)
// tetap diturunkan server dari Markdown itu, jadi model keamanan blog tidak
// berubah sedikit pun — tidak ada HTML dari browser penulis yang pernah masuk
// database, apalagi ke halaman publik.
//
// Serializer ini juga jadi pembersih tempel (paste): HTML dari Word/Google Docs
// diperas dulu jadi Markdown, lalu dirender ulang oleh `renderMarkdown()`.
// Apa pun yang tidak punya padanan di subset kita (style inline, <font>, kelas
// Mso*, <script>) hilang dengan sendirinya karena tidak ada cabang yang
// menanganinya.
//
// Batasan yang disengaja, mengikuti subset renderer:
// - H1 dipetakan ke H2 (§8.8 — H1 halaman milik judul artikel), H5/H6 → H4.
// - List bersarang diratakan; renderer publik memang tidak merender nesting.
// - Underline & strikethrough dibuang jadi teks biasa (tidak ada padanan MD).

const BLOCK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DIV', 'DL', 'DT',
  'FIELDSET', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HR', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'UL',
]);

// Elemen yang isinya bukan konten artikel — teksnya pun tidak boleh ikut.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE']);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function isElement(node: Node): node is HTMLElement {
  return node.nodeType === ELEMENT_NODE;
}

function childNodes(node: Node): Node[] {
  return Array.prototype.slice.call(node.childNodes) as Node[];
}

/* ─── Escaping ─── */

// Karakter yang bisa dibaca renderer sebagai sintaks di TENGAH baris.
// `renderMarkdown()` mengerti backslash-escape, jadi teks aslinya kembali utuh.
function escapeText(value: string): string {
  return value
    .replace(/ /g, ' ') // nbsp dari contentEditable → spasi biasa
    .replace(/[\\`*_[\]]/g, '\\$&');
}

// Penanda yang hanya berarti di AWAL baris. Backtick/bintang/kurung sudah
// ditangani escapeText, jadi di sini tersisa heading, kutipan, list, dan garis.
function escapeBlockStart(text: string): string {
  if (/^#{1,6}(\s|$)/.test(text)) return `\\${text}`;
  if (text.startsWith('>')) return `\\${text}`;
  if (/^[-+](\s|$)/.test(text)) return `\\${text}`;
  if (/^-{3,}\s*$/.test(text)) return `\\${text}`;
  // "1. teks" → "1\. teks" (escape pemisahnya, bukan angkanya)
  return text.replace(/^(\d+)([.)])(\s)/, '$1\\$2$3');
}

function collapseWhitespace(value: string): string {
  return value.replace(/[\t\r\n ]+/g, ' ').trim();
}

/* ─── URL ─── */

function safeUrl(raw: string | null | undefined): string | null {
  const url = (raw ?? '').trim();
  if (url === '') return null;
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url)) return url;
  return null;
}

// Kurung tutup di dalam URL akan memutus sintaks `](url)` — dipersen-kan.
function encodeUrl(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');
}

/* ─── Deteksi tebal / miring dari style inline ─── */

// Word membungkus SELURUH tempelan dalam <b style="font-weight:normal"> —
// tanpa cek ini, satu dokumen utuh jadi tebal semua.
function isBold(el: HTMLElement): boolean {
  const weight = el.style.fontWeight;
  if (weight) {
    if (/^(bold|bolder)$/i.test(weight)) return true;
    const numeric = Number(weight);
    if (!Number.isNaN(numeric)) return numeric >= 600;
    return false;
  }
  return el.tagName === 'B' || el.tagName === 'STRONG';
}

// Google Docs mengirim <span style="font-style:italic"> alih-alih <em>.
function isItalic(el: HTMLElement): boolean {
  const style = el.style.fontStyle;
  if (style) return /^italic|oblique/i.test(style);
  return el.tagName === 'I' || el.tagName === 'EM';
}

// Spasi di dalam penanda tidak dirender ("** tebal **" gagal), jadi penanda
// dipasang rapat ke inti teks dan spasinya digeser ke luar.
function emphasize(inner: string, marker: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
  if (!match) return inner;
  const [, lead, core, trail] = match;
  if (core === '') return inner;
  return `${lead}${marker}${core}${marker}${trail}`;
}

/* ─── Inline ─── */

// Penanda yang sudah aktif dari elemen leluhur. Word & Google Docs gemar
// menumpuk <b> di dalam <b>; tanpa konteks ini hasilnya "**a **b** c**" yang
// justru terbaca terbalik oleh renderer.
interface InlineCtx {
  bold: boolean;
  italic: boolean;
}

const NO_EMPHASIS: InlineCtx = { bold: false, italic: false };

function inlineChildren(node: Node, ctx: InlineCtx = NO_EMPHASIS): string {
  return childNodes(node).map((child) => inlineNode(child, ctx)).join('');
}

function inlineNode(node: Node, ctx: InlineCtx = NO_EMPHASIS): string {
  if (node.nodeType === TEXT_NODE) return escapeText(node.nodeValue ?? '');
  if (!isElement(node)) return '';
  if (SKIP_TAGS.has(node.tagName)) return '';

  switch (node.tagName) {
    case 'BR':
      return ' ';

    case 'IMG':
      return imageMarkdown(node);

    case 'A': {
      const href = safeUrl(node.getAttribute('href'));
      const text = inlineChildren(node, ctx);
      if (!href || collapseWhitespace(text) === '') return text;
      return `[${text.trim()}](${encodeUrl(href)})`;
    }

    case 'CODE':
    case 'KBD':
    case 'SAMP': {
      // Isi code span dibiarkan literal — escaping justru akan terbaca.
      const raw = (node.textContent ?? '').replace(/ /g, ' ').replace(/[\r\n]+/g, ' ');
      return raw === '' ? '' : `\`${raw}\``;
    }

    default: {
      const bold = ctx.bold || isBold(node);
      const italic = ctx.italic || isItalic(node);
      const inner = inlineChildren(node, { bold, italic });
      if (collapseWhitespace(inner) === '') return inner;
      // Penanda hanya dipasang di elemen TERLUAR yang mengaktifkannya.
      let out = inner;
      if (italic && !ctx.italic) out = emphasize(out, '*');
      if (bold && !ctx.bold) out = emphasize(out, '**');
      return out;
    }
  }
}

function imageMarkdown(el: HTMLElement): string {
  const src = safeUrl(el.getAttribute('src'));
  if (!src) return '';
  const alt = collapseWhitespace(el.getAttribute('alt') ?? '').replace(/[[\]]/g, '');
  const title = collapseWhitespace(el.getAttribute('title') ?? '').replace(/"/g, '');
  return `![${alt}](${encodeUrl(src)}${title ? ` "${title}"` : ''})`;
}

/* ─── Block ─── */

function wrapsBlocks(el: HTMLElement): boolean {
  return childNodes(el).some((child) => isElement(child) && BLOCK_TAGS.has(child.tagName));
}

function containerBlocks(node: Node): string[] {
  const out: string[] = [];
  let buffer = '';

  const flush = () => {
    const text = collapseWhitespace(buffer);
    buffer = '';
    if (text !== '') out.push(escapeBlockStart(text));
  };

  for (const child of childNodes(node)) {
    if (child.nodeType === TEXT_NODE) {
      buffer += escapeText(child.nodeValue ?? '');
      continue;
    }
    if (!isElement(child)) continue;
    if (SKIP_TAGS.has(child.tagName)) continue;

    // <br> memisahkan paragraf: renderer publik menggabungkan baris dalam satu
    // paragraf pakai spasi, jadi ganti baris hanya bisa diwakili paragraf baru.
    if (child.tagName === 'BR') {
      flush();
      continue;
    }

    if (BLOCK_TAGS.has(child.tagName)) {
      flush();
      out.push(...elementBlocks(child));
      continue;
    }

    // Word membungkus seluruh dokumen dalam <b style="font-weight:normal">.
    // Elemen inline yang isinya justru blok harus ditembus, bukan diratakan —
    // kalau tidak, semua paragraf tempelan menyatu jadi satu.
    if (wrapsBlocks(child)) {
      flush();
      out.push(...containerBlocks(child));
      continue;
    }

    buffer += inlineNode(child);
  }

  flush();
  return out;
}

function elementBlocks(el: HTMLElement): string[] {
  switch (el.tagName) {
    case 'H1':
    case 'H2':
      return headingBlock(el, 2);
    case 'H3':
      return headingBlock(el, 3);
    case 'H4':
    case 'H5':
    case 'H6':
      return headingBlock(el, 4);

    case 'HR':
      return ['---'];

    case 'PRE':
      return [codeBlock(el)];

    case 'BLOCKQUOTE': {
      const inner = containerBlocks(el);
      if (inner.length === 0) return [];
      return [inner.join('\n\n').split('\n').map((line) => `> ${line}`.trimEnd()).join('\n')];
    }

    case 'UL':
    case 'OL': {
      const items = listItems(el);
      return items.length > 0 ? [items.join('\n')] : [];
    }

    case 'FIGURE':
      return figureBlock(el);

    case 'TABLE':
      return tableBlocks(el);

    default:
      return containerBlocks(el);
  }
}

function headingBlock(el: HTMLElement, level: number): string[] {
  const text = collapseWhitespace(inlineChildren(el));
  if (text === '') return [];
  return [`${'#'.repeat(level)} ${text}`];
}

function codeBlock(el: HTMLElement): string {
  const code = el.querySelector('code');
  const lang = code
    ? (/(?:^|\s)language-([a-zA-Z0-9+#-]+)/.exec(code.className)?.[1] ?? '')
    : '';
  const body = (el.textContent ?? '')
    .replace(/ /g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/```/g, "'''") // fence di dalam fence akan menutup blok lebih awal
    .replace(/\n+$/, '');
  return `\`\`\`${lang}\n${body}\n\`\`\``;
}

function figureBlock(el: HTMLElement): string[] {
  const img = el.querySelector('img');
  if (!img) return containerBlocks(el);
  const caption = el.querySelector('figcaption');
  const captionText = caption ? collapseWhitespace(caption.textContent ?? '').replace(/"/g, '') : '';
  const src = safeUrl(img.getAttribute('src'));
  if (!src) return [];
  const alt = collapseWhitespace(img.getAttribute('alt') ?? '').replace(/[[\]]/g, '');
  return [`![${alt}](${encodeUrl(src)}${captionText ? ` "${captionText}"` : ''})`];
}

// Renderer publik tidak mengenal list bersarang, jadi sub-item diratakan jadi
// item biasa di list yang sama.
function listItems(el: HTMLElement, ordered = el.tagName === 'OL'): string[] {
  const lines: string[] = [];
  let index = 1;

  for (const child of childNodes(el)) {
    if (!isElement(child)) continue;

    if (child.tagName === 'UL' || child.tagName === 'OL') {
      lines.push(...listItems(child, ordered));
      continue;
    }
    if (child.tagName !== 'LI') continue;

    const nested: HTMLElement[] = [];
    let text = '';
    for (const part of childNodes(child)) {
      if (isElement(part) && (part.tagName === 'UL' || part.tagName === 'OL')) {
        nested.push(part);
        continue;
      }
      if (isElement(part) && BLOCK_TAGS.has(part.tagName)) {
        text += ` ${elementBlocks(part).join(' ')}`;
        continue;
      }
      text += part.nodeType === TEXT_NODE ? escapeText(part.nodeValue ?? '') : inlineNode(part);
    }

    const clean = collapseWhitespace(text);
    if (clean !== '') lines.push(`${ordered ? `${index++}.` : '-'} ${clean}`);
    for (const sub of nested) lines.push(...listItems(sub, ordered));
  }

  return lines;
}

function tableBlocks(el: HTMLElement): string[] {
  // Tabel di luar subset renderer. Diratakan jadi satu paragraf per baris
  // supaya isinya tetap terbaca alih-alih hilang diam-diam.
  const rows = Array.prototype.slice.call(el.querySelectorAll('tr')) as HTMLElement[];
  const out: string[] = [];
  for (const row of rows) {
    const cells = (Array.prototype.slice.call(row.querySelectorAll('th,td')) as HTMLElement[])
      .map((cell) => collapseWhitespace(inlineChildren(cell)))
      .filter((cell) => cell !== '');
    if (cells.length > 0) out.push(escapeBlockStart(cells.join(' — ')));
  }
  return out;
}

/* ─── API ─── */

export function domToMarkdown(root: Node): string {
  return containerBlocks(root)
    .map((block) => block.replace(/[ \t]+$/gm, ''))
    .filter((block) => block !== '')
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Untuk konten tempelan: parsing lewat DOMParser tidak mengeksekusi apa pun,
// dan hasilnya hanya dibaca sebagai teks oleh serializer di atas.
export function htmlToMarkdown(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return domToMarkdown(doc.body);
}

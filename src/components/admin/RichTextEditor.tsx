'use client';

// Editor artikel WYSIWYG — penulis melihat hasil jadi (tebal, miring, judul,
// daftar) persis seperti di aplikasi pengolah kata, bukan sintaks Markdown.
//
// Yang DISIMPAN tetap Markdown (`content_source`). Setiap perubahan di
// contentEditable diserialisasi ulang jadi Markdown lewat `domToMarkdown()`,
// dan Markdown itulah satu-satunya yang dikirim ke server — HTML dari browser
// penulis tidak pernah sampai ke database maupun halaman publik. Konsekuensi
// baiknya: tempelan dari Word/Google Docs otomatis bersih, karena ikut diperas
// jadi Markdown lalu dirender ulang oleh renderer escape-first kita.
//
// Tombol judul sengaja mulai dari H2 (§8.8): H1 halaman adalah judul artikel,
// jadi "Judul 1" di toolbar = <h2> di HTML. Heading H1 dari tempelan pun ikut
// diturunkan jadi H2 oleh serializer.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Undo2,
  Unlink,
} from 'lucide-react';
import { domToMarkdown, htmlToMarkdown } from '@/lib/html-to-markdown';
import { renderMarkdown } from '@/lib/markdown';

type Lang = 'id' | 'en';

const TXT = {
  id: {
    blockParagraph: 'Paragraf',
    blockH2: 'Judul 1',
    blockH3: 'Judul 2',
    blockH4: 'Judul 3',
    blockHelp: 'Gaya teks — "Judul 1" jadi H2 karena H1 halaman dipakai judul artikel',
    bold: 'Tebal (Ctrl+B)',
    italic: 'Miring (Ctrl+I)',
    bullet: 'Daftar poin',
    numbered: 'Daftar bernomor',
    quote: 'Kutipan',
    code: 'Kode',
    link: 'Tautan (Ctrl+K)',
    unlink: 'Hapus tautan',
    image: 'Sisipkan gambar',
    hr: 'Garis pemisah',
    clear: 'Bersihkan format',
    undo: 'Batalkan (Ctrl+Z)',
    redo: 'Ulangi (Ctrl+Shift+Z)',
    modeRich: 'Mode teks',
    modeMarkdown: 'Mode Markdown',
    modeHelp: 'Beralih ke sumber Markdown mentah',
    placeholder: 'Mulai tulis artikel di sini…',
    linkTitle: 'Sisipkan tautan',
    linkUrl: 'Alamat tautan',
    linkText: 'Teks yang tampil',
    linkInvalid: 'Alamat harus diawali http://, https://, /, mailto:, atau tel:',
    imageTitle: 'Sisipkan gambar',
    imageUpload: 'Unggah dari komputer',
    imageUploading: 'Mengunggah…',
    imageUrl: 'URL gambar',
    imageAlt: 'Alt text (wajib)',
    imageAltHelp: 'Deskripsi singkat isi gambar — dipakai pembaca layar & Google.',
    imageCaption: 'Keterangan (opsional)',
    imageAltRequired: 'Alt text wajib diisi.',
    imageUrlRequired: 'Unggah gambar atau isi URL-nya dulu.',
    uploadFailed: 'Gagal mengunggah gambar.',
    insert: 'Sisipkan',
    cancel: 'Batal',
  },
  en: {
    blockParagraph: 'Paragraph',
    blockH2: 'Heading 1',
    blockH3: 'Heading 2',
    blockH4: 'Heading 3',
    blockHelp: 'Text style — "Heading 1" maps to H2 because the page H1 is the article title',
    bold: 'Bold (Ctrl+B)',
    italic: 'Italic (Ctrl+I)',
    bullet: 'Bulleted list',
    numbered: 'Numbered list',
    quote: 'Quote',
    code: 'Code',
    link: 'Link (Ctrl+K)',
    unlink: 'Remove link',
    image: 'Insert image',
    hr: 'Divider',
    clear: 'Clear formatting',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Shift+Z)',
    modeRich: 'Visual mode',
    modeMarkdown: 'Markdown mode',
    modeHelp: 'Switch to raw Markdown source',
    placeholder: 'Start writing your article here…',
    linkTitle: 'Insert link',
    linkUrl: 'Link address',
    linkText: 'Display text',
    linkInvalid: 'Address must start with http://, https://, /, mailto:, or tel:',
    imageTitle: 'Insert image',
    imageUpload: 'Upload from computer',
    imageUploading: 'Uploading…',
    imageUrl: 'Image URL',
    imageAlt: 'Alt text (required)',
    imageAltHelp: 'Short description of the image — used by screen readers and Google.',
    imageCaption: 'Caption (optional)',
    imageAltRequired: 'Alt text is required.',
    imageUrlRequired: 'Upload an image or fill in its URL first.',
    uploadFailed: 'Image upload failed.',
    insert: 'Insert',
    cancel: 'Cancel',
  },
} satisfies Record<Lang, Record<string, string>>;

const BLOCK_OPTIONS = ['p', 'h2', 'h3', 'h4'] as const;
type BlockTag = (typeof BLOCK_OPTIONS)[number];

// Konfigurasi toolbar sengaja statis di level modul: kalau array-nya dibangun
// ulang tiap render sambil menutup atas ref, aturan react-hooks/refs menolaknya.
const TOOLBAR_ITEMS = [
  { key: 'bold', icon: Bold },
  { key: 'italic', icon: Italic },
  { key: 'bullet', icon: List },
  { key: 'numbered', icon: ListOrdered },
  { key: 'quote', icon: Quote },
  { key: 'code', icon: Code },
  { key: 'link', icon: Link2 },
  { key: 'unlink', icon: Unlink },
  { key: 'image', icon: ImagePlus },
  { key: 'hr', icon: Minus },
  { key: 'clear', icon: RemoveFormatting },
  { key: 'undo', icon: Undo2 },
  { key: 'redo', icon: Redo2 },
] as const;

type ToolbarKey = (typeof TOOLBAR_ITEMS)[number]['key'];

const SAFE_URL_RE = /^(https?:\/\/|\/|#|mailto:|tel:)/i;

// `renderMarkdown` selalu mengembalikan blok. Untuk sisipan di tengah kalimat
// kita hanya butuh isinya.
function renderInlineHtml(markdown: string): string {
  const html = renderMarkdown(markdown);
  const single = /^<p>([\s\S]*)<\/p>$/.exec(html);
  return single ? single[1] : html;
}

type UploadResponse = { success?: boolean; data?: { publicUrl: string }; error?: string };

/* ─── Dialog kecil untuk tautan & gambar ─── */

function RteDialog({
  title,
  onClose,
  onSubmit,
  submitLabel,
  cancelLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  cancelLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rte-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rte-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h3 className="rte-dialog-title">{title}</h3>
        <div className="rte-dialog-body">{children}</div>
        <div className="rte-dialog-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>{cancelLabel}</button>
          <button type="button" className="button button-primary" onClick={onSubmit}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Editor ─── */

export interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  lang?: Lang;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  lang = 'id',
  disabled = false,
  ariaLabel,
}: RichTextEditorProps) {
  const t = TXT[lang];
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Markdown terakhir yang DIKIRIM editor ini. Selama prop `value` masih sama
  // dengan ini, perubahan berasal dari ketikan pengguna — innerHTML tidak boleh
  // ditulis ulang, karena itu akan memindahkan kursor ke awal setiap ketikan.
  const lastEmitted = useRef<string | null>(null);
  const savedRange = useRef<Range | null>(null);

  const [mode, setMode] = useState<'rich' | 'markdown'>('rich');
  const [blockTag, setBlockTag] = useState<BlockTag>('p');
  const [active, setActive] = useState({ bold: false, italic: false, ul: false, ol: false, quote: false });
  const [dialog, setDialog] = useState<null | 'link' | 'image'>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dialogError, setDialogError] = useState('');

  /* — sinkronisasi Markdown → DOM — */
  useEffect(() => {
    if (mode !== 'rich') return;
    const el = editorRef.current;
    if (!el) return;
    if (lastEmitted.current === value) return;
    lastEmitted.current = value;
    el.innerHTML = renderMarkdown(value);
  }, [value, mode]);

  useEffect(() => {
    if (mode !== 'rich') return;
    try {
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      // Browser lama boleh menolak — perintah format tetap jalan.
    }
  }, [mode]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const markdown = domToMarkdown(el);
    lastEmitted.current = markdown;
    onChange(markdown);
  }, [onChange]);

  /* — pelacakan seleksi: dipakai tombol aktif + pemulihan kursor — */
  const selectionInsideEditor = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    return el.contains(range.commonAncestorContainer) ? range : null;
  }, []);

  const refreshState = useCallback(() => {
    const range = selectionInsideEditor();
    if (!range) return;
    savedRange.current = range.cloneRange();

    const el = editorRef.current!;
    let node: Node | null = range.startContainer;
    let tag: BlockTag = 'p';
    let inQuote = false;
    while (node && node !== el) {
      if (node.nodeType === 1) {
        const name = (node as HTMLElement).tagName.toLowerCase();
        if (name === 'blockquote') inQuote = true;
        if (tag === 'p' && (name === 'h2' || name === 'h3' || name === 'h4')) tag = name;
      }
      node = node.parentNode;
    }
    setBlockTag(tag);
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      quote: inQuote,
    });
  }, [selectionInsideEditor]);

  useEffect(() => {
    if (mode !== 'rich') return;
    document.addEventListener('selectionchange', refreshState);
    return () => document.removeEventListener('selectionchange', refreshState);
  }, [mode, refreshState]);

  // Select & dialog mencuri fokus dari contentEditable, jadi rentang terakhir
  // dipasang ulang sebelum perintah dijalankan.
  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const range = savedRange.current;
    if (!range || !el.contains(range.commonAncestorContainer)) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  const run = useCallback((command: string, arg?: string) => {
    if (disabled) return;
    restoreSelection();
    document.execCommand(command, false, arg);
    emitChange();
    refreshState();
  }, [disabled, emitChange, refreshState, restoreSelection]);

  const insertHtml = useCallback((html: string) => {
    if (disabled) return;
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    emitChange();
    refreshState();
  }, [disabled, emitChange, refreshState, restoreSelection]);

  /* — perintah toolbar — */

  function applyBlock(tag: BlockTag) {
    run('formatBlock', `<${tag}>`);
  }

  function toggleQuote() {
    run('formatBlock', active.quote ? '<p>' : '<blockquote>');
  }

  function toggleInlineCode() {
    const text = window.getSelection()?.toString() ?? '';
    if (text.trim() === '') return;
    insertHtml(renderInlineHtml(`\`${text.replace(/`/g, '')}\``));
  }

  function openLinkDialog() {
    if (disabled) return;
    const range = selectionInsideEditor();
    if (range) savedRange.current = range.cloneRange();
    setLinkText(window.getSelection()?.toString() ?? '');
    setLinkUrl('');
    setDialogError('');
    setDialog('link');
  }

  function submitLink() {
    const url = linkUrl.trim();
    if (!SAFE_URL_RE.test(url)) {
      setDialogError(t.linkInvalid);
      return;
    }
    const label = linkText.trim();
    setDialog(null);
    if (label === '') {
      insertHtml(renderInlineHtml(`[${url}](${url})`));
      return;
    }
    // Ada teks terseleksi → cukup jadikan tautan, formatnya tetap utuh.
    const hasSelection = (window.getSelection()?.toString() ?? '') !== '';
    if (hasSelection) run('createLink', url);
    else insertHtml(renderInlineHtml(`[${label}](${url})`));
  }

  function openImageDialog() {
    if (disabled) return;
    const range = selectionInsideEditor();
    if (range) savedRange.current = range.cloneRange();
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setDialogError('');
    setDialog('image');
  }

  async function uploadImage(file: File) {
    setDialogError('');
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('type', 'blog');
    try {
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: form });
      const data = (await res.json()) as UploadResponse;
      if (!res.ok || !data.success || !data.data) {
        setDialogError(data.error ?? t.uploadFailed);
        return;
      }
      setImageUrl(data.data.publicUrl);
    } catch {
      setDialogError(t.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  function submitImage() {
    const url = imageUrl.trim();
    const alt = imageAlt.trim();
    if (url === '') { setDialogError(t.imageUrlRequired); return; }
    if (alt === '') { setDialogError(t.imageAltRequired); return; }
    const caption = imageCaption.trim().replace(/"/g, '');
    setDialog(null);
    insertHtml(renderMarkdown(`![${alt.replace(/[[\]]/g, '')}](${url}${caption ? ` "${caption}"` : ''})`));
  }

  /* — event editor — */

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    if (html) {
      // HTML tempelan tidak pernah masuk apa adanya: diperas jadi Markdown lalu
      // dirender ulang, sehingga hanya subset yang kita dukung yang tersisa.
      document.execCommand('insertHTML', false, renderMarkdown(htmlToMarkdown(html)));
    } else {
      document.execCommand('insertText', false, text);
    }
    emitChange();
    refreshState();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    const file = Array.from(e.dataTransfer.files ?? []).find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      openImageDialog();
      void uploadImage(file);
      return;
    }
    // Sisipan bawaan browser dibiarkan; hasilnya tetap dibersihkan serializer.
    setTimeout(emitChange, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openLinkDialog();
    }
  }

  function runToolbar(key: ToolbarKey) {
    switch (key) {
      case 'bold': return run('bold');
      case 'italic': return run('italic');
      case 'bullet': return run('insertUnorderedList');
      case 'numbered': return run('insertOrderedList');
      case 'quote': return toggleQuote();
      case 'code': return toggleInlineCode();
      case 'link': return openLinkDialog();
      case 'unlink': return run('unlink');
      case 'image': return openImageDialog();
      case 'hr': return run('insertHorizontalRule');
      case 'clear': return run('removeFormat');
      case 'undo': return run('undo');
      case 'redo': return run('redo');
    }
  }

  function isToolbarActive(key: ToolbarKey): boolean | undefined {
    switch (key) {
      case 'bold': return active.bold;
      case 'italic': return active.italic;
      case 'bullet': return active.ul;
      case 'numbered': return active.ol;
      case 'quote': return active.quote;
      default: return undefined;
    }
  }

  const blockLabels: Record<BlockTag, string> = {
    p: t.blockParagraph,
    h2: t.blockH2,
    h3: t.blockH3,
    h4: t.blockH4,
  };

  return (
    <div className={`rte${disabled ? ' rte--disabled' : ''}`}>
      <div className="rte-toolbar" role="toolbar" aria-label={ariaLabel ?? t.modeRich}>
        {mode === 'rich' && (
          <>
            <select
              className="rte-block-select"
              value={blockTag}
              title={t.blockHelp}
              aria-label={t.blockHelp}
              disabled={disabled}
              onChange={(e) => applyBlock(e.target.value as BlockTag)}
            >
              {BLOCK_OPTIONS.map((tag) => (
                <option key={tag} value={tag}>{blockLabels[tag]}</option>
              ))}
            </select>

            <span className="rte-sep" aria-hidden="true" />

            {TOOLBAR_ITEMS.map(({ key, icon: Icon }) => {
              const label = t[key];
              const isActive = isToolbarActive(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`rte-btn${isActive ? ' is-active' : ''}`}
                  title={label}
                  aria-label={label}
                  aria-pressed={isActive}
                  disabled={disabled}
                  // Tanpa ini, klik tombol menghapus seleksi sebelum perintah jalan.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runToolbar(key)}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </>
        )}

        <button
          type="button"
          className="rte-mode-toggle"
          title={t.modeHelp}
          onClick={() => {
            // Paksa sinkronisasi ulang saat kembali ke mode visual.
            lastEmitted.current = null;
            setMode((m) => (m === 'rich' ? 'markdown' : 'rich'));
          }}
        >
          {mode === 'rich' ? t.modeMarkdown : t.modeRich}
        </button>
      </div>

      {mode === 'rich' ? (
        <div
          ref={editorRef}
          className="rte-editor blog-prose"
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          data-placeholder={t.placeholder}
          data-empty={value.trim() === '' ? 'true' : undefined}
          spellCheck
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onKeyUp={refreshState}
          onMouseUp={refreshState}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <textarea
          className="rte-source"
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          rows={18}
          onChange={(e) => {
            lastEmitted.current = e.target.value;
            onChange(e.target.value);
          }}
        />
      )}

      {dialog === 'link' && (
        <RteDialog
          title={t.linkTitle}
          submitLabel={t.insert}
          cancelLabel={t.cancel}
          onClose={() => setDialog(null)}
          onSubmit={submitLink}
        >
          <label className="admin-field">
            <span className="admin-field-label">{t.linkUrl}</span>
            <input
              className="control"
              value={linkUrl}
              autoFocus
              placeholder="https://…"
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitLink(); } }}
            />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t.linkText}</span>
            <input className="control" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
          </label>
          {dialogError && <div className="alert alert-error">{dialogError}</div>}
        </RteDialog>
      )}

      {dialog === 'image' && (
        <RteDialog
          title={t.imageTitle}
          submitLabel={t.insert}
          cancelLabel={t.cancel}
          onClose={() => setDialog(null)}
          onSubmit={submitImage}
        >
          <div className="admin-field">
            <button
              type="button"
              className="button button-secondary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? t.imageUploading : t.imageUpload}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void uploadImage(file);
              }}
            />
          </div>
          <label className="admin-field">
            <span className="admin-field-label">{t.imageUrl}</span>
            <input className="control" value={imageUrl} placeholder="https://…" onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t.imageAlt}</span>
            <input className="control" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
            <span className="admin-help">{t.imageAltHelp}</span>
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t.imageCaption}</span>
            <input className="control" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} />
          </label>
          {dialogError && <div className="alert alert-error">{dialogError}</div>}
        </RteDialog>
      )}
    </div>
  );
}

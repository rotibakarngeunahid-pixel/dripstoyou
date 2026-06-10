'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENCY_OPTIONS, formatPrice, normalizeCurrency, type CurrencyCode } from '@/lib/currency';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

type PriceRow = { currency: CurrencyCode; amount: string };

type Product = {
  id?: string;
  name?: string;
  slug?: string;
  short_description?: string | null;
  full_description?: string | null;
  price_amount?: number;
  currency?: string | null;
  price_label?: string | null;
  prices?: Record<string, number>;
  duration_minutes?: number | null;
  image_url?: string | null;
  label?: string | null;
  is_active?: boolean;
  show_on_homepage?: boolean;
  homepage_order?: number;
  benefits?: { benefit_text: string }[];
};

type ApiResponse = { error?: string; message?: string };
type UploadResponse = { success?: boolean; data?: { publicUrl: string; mimeType: string }; error?: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function initPriceRows(product?: Product): PriceRow[] {
  if (product?.prices && Object.keys(product.prices).length > 0) {
    return Object.entries(product.prices)
      .filter(([, v]) => (v ?? 0) > 0)
      .map(([code, amount]) => ({ currency: normalizeCurrency(code), amount: String(amount) }));
  }
  if (product?.price_amount) {
    return [{ currency: normalizeCurrency(product.currency), amount: String(product.price_amount) }];
  }
  return [{ currency: 'IDR', amount: '' }];
}

/* ─── Confirm Modal ─── */
function ConfirmModal({
  open, title, message, confirmLabel, danger, loading,
  onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string;
  confirmLabel: string; danger?: boolean; loading?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: 'var(--teal)', fontSize: 20, marginBottom: 10 }}>{title}</h3>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="button button-secondary" style={{ minHeight: 40, padding: '8px 18px', fontSize: 13 }} onClick={onCancel} type="button" disabled={loading}>Cancel</button>
          <button className="button" style={{ minHeight: 40, padding: '8px 18px', fontSize: 13, background: danger ? '#dc2626' : 'var(--teal)', color: 'white', border: 'none', opacity: loading ? 0.7 : 1 }} onClick={onConfirm} type="button" disabled={loading}>
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div role="status" aria-live="polite" className={`admin-toast ${type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}>
      {msg}
    </div>
  );
}

/* ─── Image upload component ─── */
function ImageUpload({
  currentUrl, productName, onUploaded, onUploadingChange, t,
}: {
  currentUrl: string; productName: string;
  onUploaded: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  t: Record<string, string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');
  const [previewUrl,   setPreviewUrl]   = useState(currentUrl);

  function setUploadingState(v: boolean) { setUploading(v); onUploadingChange?.(v); }

  async function handleFile(file: File) {
    setUploadError(''); setUploadingState(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res  = await fetch('/api/admin/uploads', { method: 'POST', body: form });
      const data = (await res.json()) as UploadResponse;
      if (!res.ok || !data.success || !data.data) { setUploadError(data.error ?? t.uploadGagal); return; }
      setPreviewUrl(data.data.publicUrl);
      onUploaded(data.data.publicUrl);
    } catch {
      setUploadError(t.koneksiGagal);
    } finally {
      setUploadingState(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }

  function handleRemove() { setPreviewUrl(''); setUploadError(''); onUploaded(''); }

  const altText = productName ? `${productName} IV Therapy Bali` : t.fotoProduk;

  if (previewUrl) {
    return (
      <div className="upload-preview-wrap">
        <div className="upload-preview-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={altText} />
        </div>
        <div className="upload-preview-actions">
          <button type="button" className="button button-secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? t.mengunggahGambar : t.gantiFoto}
          </button>
          <button type="button" className="button" style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={handleRemove} disabled={uploading}>
            {t.hapusFoto}
          </button>
        </div>
        {uploadError && <div className="alert alert-error" style={{ marginTop: 8 }}>{uploadError}</div>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInputChange} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div
      className={`upload-dropzone${uploading ? ' uploading' : ''}`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      aria-label={t.fotoProduk}
    >
      {uploading ? (
        <><div className="upload-spinner" aria-hidden="true" /><span className="upload-hint">{t.mengunggahGambar}</span></>
      ) : (
        <>
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="upload-label">{t.pilihGambar}</span>
          <span className="upload-hint">{t.infoUpload}</span>
        </>
      )}
      {uploadError && <div className="alert alert-error" style={{ marginTop: 8 }}>{uploadError}</div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInputChange} style={{ display: 'none' }} disabled={uploading} />
    </div>
  );
}

/* ─── Main form ─── */
export function ProductForm({ product }: { product?: Product }) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];
  const router = useRouter();
  const isEdit = !!product?.id;

  const [name,           setName]           = useState(product?.name ?? '');
  const [shortDesc,      setShortDesc]      = useState(product?.short_description ?? '');
  const [fullDesc,       setFullDesc]       = useState(product?.full_description ?? '');
  const [priceRows,      setPriceRows]      = useState<PriceRow[]>(() => initPriceRows(product));
  const [duration,       setDuration]       = useState(String(product?.duration_minutes ?? '45'));
  const [imageUrl,       setImageUrl]       = useState(product?.image_url ?? '');
  const [label,          setLabel]          = useState(product?.label ?? '');
  const [isActive,       setIsActive]       = useState(product?.is_active ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(product?.show_on_homepage ?? false);
  const [homepageOrder,  setHomepageOrder]  = useState(String(product?.homepage_order ?? '0'));
  const [benefits,       setBenefits]       = useState<string[]>(product?.benefits?.map((b) => b.benefit_text) ?? ['']);
  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [error,          setError]          = useState('');
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm,        setConfirm]        = useState<{
    open: boolean; title: string; message: string; confirmLabel: string; danger?: boolean; loading?: boolean; onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });

  const slugValue = isEdit ? (product?.slug ?? '') : slugify(name);

  function availableCurrenciesForRow(idx: number) {
    const used = new Set(priceRows.filter((_, i) => i !== idx).map(r => r.currency));
    return CURRENCY_OPTIONS.filter(o => !used.has(o.code));
  }

  function updatePriceRow(idx: number, field: 'currency' | 'amount', value: string) {
    setPriceRows(prev => prev.map((row, i) =>
      i === idx ? { ...row, [field]: field === 'currency' ? normalizeCurrency(value) : value } : row,
    ));
  }

  function removePriceRow(idx: number) {
    if (priceRows.length === 1) return;
    setPriceRows(prev => prev.filter((_, i) => i !== idx));
  }

  function addPriceRow() {
    const used = new Set(priceRows.map(r => r.currency));
    const next = CURRENCY_OPTIONS.find(o => !used.has(o.code));
    if (!next) return;
    setPriceRows(prev => [...prev, { currency: next.code, amount: '' }]);
  }

  const pricePreview = priceRows.filter(r => parseFloat(r.amount) > 0).map(r => formatPrice(parseFloat(r.amount), r.currency)).join(' / ');

  function showToast(msg: string, type: 'success' | 'error' = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const prices: Record<string, number> = {};
    for (const row of priceRows) { const amount = parseFloat(row.amount); if (amount > 0) prices[row.currency] = amount; }
    if (Object.keys(prices).length === 0) { setError(t.minHargaRequired); setSaving(false); return; }
    const payload = { name, slug: slugValue, shortDescription: shortDesc, fullDescription: fullDesc, prices, durationMinutes: parseInt(duration, 10), imageUrl: imageUrl || null, label: label || null, isActive, showOnHomepage, homepageOrder: parseInt(homepageOrder, 10), benefits: benefits.map((b) => b.trim()).filter(Boolean) };
    const url    = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) { setError(data.error ?? data.message ?? t.gagalMenyimpanProduk); return; }
      showToast(isEdit ? t.produkBerhasilDiperbarui : t.produkBerhasilDibuat);
      setTimeout(() => { router.push('/admin/products'); router.refresh(); }, 800);
    } catch {
      setError(t.koneksiGagal);
    } finally {
      setSaving(false);
    }
  }

  function askDelete() {
    if (!product?.id) return;
    const msg = lang === 'id'
      ? `Produk "${name}" akan dihapus secara permanen. Semua data terkait akan hilang. Tindakan ini tidak dapat dibatalkan.`
      : `Product "${name}" will be permanently deleted. All related data will be lost. This cannot be undone.`;
    setConfirm({
      open: true, danger: true,
      title: t.hapusProdukTitle, message: msg, confirmLabel: t.hapus,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        setDeleting(true);
        try {
          const res = await fetch(`/api/admin/products/${product!.id}`, { method: 'DELETE' });
          setConfirm(c => ({ ...c, open: false, loading: false }));
          if (!res.ok) {
            let errMsg = t.gagalMenyimpanProduk;
            try { const data = (await res.json()) as ApiResponse; errMsg = data.message ?? data.error ?? errMsg; } catch { /* ignore */ }
            setError(errMsg); showToast(errMsg, 'error'); return;
          }
          showToast(t.produkBerhasilDihapus);
          setTimeout(() => { router.push('/admin/products'); router.refresh(); }, 800);
        } catch {
          setConfirm(c => ({ ...c, open: false, loading: false }));
          setError(t.koneksiGagal); showToast(t.koneksiGagal, 'error');
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} danger={confirm.danger} loading={confirm.loading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* Name */}
        <label className="admin-field">
          <span className="admin-field-label">{t.namaProduk}</span>
          <input className="control" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        {/* Descriptions */}
        <label className="admin-field">
          <span className="admin-field-label">{t.deskripsiSingkat}</span>
          <input className="control" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} maxLength={500} />
        </label>

        <label className="admin-field">
          <span className="admin-field-label">{t.deskripsiLengkap}</span>
          <textarea className="control" value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} rows={5} />
        </label>

        {/* Multi-currency Price */}
        <div className="admin-form-grid">
          <div className="admin-field">
            <span className="admin-field-label">{t.harga}</span>
            {priceRows.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px auto', gap: 8, marginBottom: 8 }}>
                <input className="control" type="number" value={row.amount} onChange={(e) => updatePriceRow(idx, 'amount', e.target.value)} min="0" step={row.currency === 'IDR' ? '1' : '0.01'} placeholder={`${lang === 'en' ? 'Amount' : 'Jumlah'} (${row.currency})`} required={idx === 0} />
                <select className="control" value={row.currency} onChange={(e) => updatePriceRow(idx, 'currency', e.target.value)} aria-label={`${lang === 'en' ? 'Currency row' : 'Mata uang baris'} ${idx + 1}`}>
                  {availableCurrenciesForRow(idx).map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.flag} {opt.code}</option>
                  ))}
                </select>
                <button className="button button-secondary" type="button" onClick={() => removePriceRow(idx)} disabled={priceRows.length === 1} aria-label={`${t.hapus} ${idx + 1}`} style={{ minWidth: 72, padding: '0 12px' }}>
                  {t.hapus}
                </button>
              </div>
            ))}
            {priceRows.length < CURRENCY_OPTIONS.length && (
              <button className="button button-secondary" type="button" onClick={addPriceRow} style={{ marginBottom: pricePreview ? 6 : 0 }}>
                {t.tambahMataUang}
              </button>
            )}
            {pricePreview && <span className="admin-help">{pricePreview}</span>}
          </div>
          <label className="admin-field">
            <span className="admin-field-label">{t.durasiMenit}</span>
            <input className="control" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
          </label>
        </div>

        {/* Image upload */}
        <div className="admin-field">
          <span className="admin-field-label">{t.fotoProduk}</span>
          {uploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--ocean)', fontSize: 13 }}>
              <span className="upload-spinner" aria-hidden="true" style={{ width: 16, height: 16 }} />
              {t.mengunggahGambarMsg}
            </div>
          )}
          <ImageUpload currentUrl={imageUrl} productName={name} onUploaded={(url) => setImageUrl(url)} onUploadingChange={setUploading} t={t} />
        </div>

        {/* Badge label */}
        <label className="admin-field">
          <span className="admin-field-label">{t.labelBadge}</span>
          <input className="control" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Popular, New…" maxLength={50} />
        </label>

        {/* Toggles */}
        <div className="admin-form-grid three">
          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span className="admin-field-label">{t.aktifLabel}</span>
          </label>
          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span className="admin-field-label">{t.tampilHomepage}</span>
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t.urutanHomepage}</span>
            <input className="control" type="number" value={homepageOrder} onChange={(e) => setHomepageOrder(e.target.value)} min="0" />
          </label>
        </div>

        {/* Benefits */}
        <div className="admin-field">
          <span className="admin-field-label">{t.benefitKandungan}</span>
          {benefits.map((benefit, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, marginBottom: 8 }}>
              <input
                className="control"
                value={benefit}
                onChange={(e) => setBenefits((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
                placeholder={`${lang === 'en' ? 'Benefit' : 'Benefit'} ${index + 1}`}
              />
              <button className="button button-secondary" type="button" onClick={() => setBenefits((prev) => prev.filter((_, i) => i !== index))} aria-label={`${t.hapus} ${index + 1}`}>
                {t.hapus}
              </button>
            </div>
          ))}
          <button className="button button-secondary" type="button" onClick={() => setBenefits((prev) => [...prev, ''])}>
            {t.tambahBenefit}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="admin-form-actions">
          <button
            className={`button button-primary${saving ? ' loading' : ''}`}
            type="submit"
            disabled={saving || deleting || uploading}
            title={uploading ? (lang === 'en' ? 'Wait for upload to finish' : 'Tunggu hingga upload selesai') : undefined}
          >
            {uploading ? t.mengunggahStatus : saving ? t.menyimpan : isEdit ? t.simpanProduk : t.buatProduk}
          </button>
          <button className="button button-secondary" type="button" onClick={() => router.back()} disabled={saving || deleting}>
            {t.batal}
          </button>
          {isEdit && (
            <button
              className="button button-secondary"
              type="button"
              onClick={askDelete}
              disabled={saving || deleting}
              style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,.35)', marginLeft: 'auto' }}
            >
              {deleting ? t.menghapusProduk : t.hapus}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

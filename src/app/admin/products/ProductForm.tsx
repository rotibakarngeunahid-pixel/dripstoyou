'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id?: string;
  name?: string;
  slug?: string;
  short_description?: string | null;
  full_description?: string | null;
  price_amount?: number;
  price_label?: string | null;
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32,
        maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: 'var(--teal)', fontSize: 20, marginBottom: 10 }}>
          {title}
        </h3>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="button button-secondary"
            style={{ minHeight: 40, padding: '8px 18px', fontSize: 13 }}
            onClick={onCancel} type="button" disabled={loading}
          >
            Batal
          </button>
          <button
            className="button"
            style={{
              minHeight: 40, padding: '8px 18px', fontSize: 13,
              background: danger ? '#dc2626' : 'var(--teal)',
              color: 'white', border: 'none',
              opacity: loading ? 0.7 : 1,
            }}
            onClick={onConfirm} type="button" disabled={loading}
          >
            {loading ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 2000, background: type === 'success' ? 'var(--teal)' : '#dc2626',
      color: 'white', padding: '12px 24px', borderRadius: 12,
      fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap', pointerEvents: 'none',
    }}>
      {msg}
    </div>
  );
}

/* ─── Image upload component ─────────────────── */
function ImageUpload({
  currentUrl,
  productName,
  onUploaded,
}: {
  currentUrl: string;
  productName: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  async function handleFile(file: File) {
    setUploadError('');
    setUploading(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const res  = await fetch('/api/admin/uploads', { method: 'POST', body: form });
      const data = (await res.json()) as UploadResponse;
      if (!res.ok || !data.success || !data.data) {
        setUploadError(data.error ?? 'Upload gagal. Coba lagi.');
        return;
      }
      setPreviewUrl(data.data.publicUrl);
      onUploaded(data.data.publicUrl);
    } catch {
      setUploadError('Koneksi gagal. Periksa jaringan.');
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreviewUrl('');
    setUploadError('');
    onUploaded('');
  }

  const altText = productName ? `${productName} IV Therapy Bali` : 'Preview gambar produk';

  if (previewUrl) {
    return (
      <div className="upload-preview-wrap">
        <div className="upload-preview-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={altText} />
        </div>
        <div className="upload-preview-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Mengunggah…' : 'Ganti Foto'}
          </button>
          <button
            type="button"
            className="button"
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
            onClick={handleRemove}
            disabled={uploading}
          >
            Hapus Foto
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
      aria-label="Upload gambar produk"
    >
      {uploading ? (
        <>
          <div className="upload-spinner" aria-hidden="true" />
          <span className="upload-hint">Mengunggah gambar…</span>
        </>
      ) : (
        <>
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="upload-label">Pilih Gambar</span>
          <span className="upload-hint">JPG, PNG, WEBP · Maks. 5 MB · Rasio 1:1 disarankan</span>
        </>
      )}
      {uploadError && <div className="alert alert-error" style={{ marginTop: 8 }}>{uploadError}</div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInputChange} style={{ display: 'none' }} disabled={uploading} />
    </div>
  );
}

/* ─── Main form ──────────────────────────────── */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product?.id;

  const [name,          setName]          = useState(product?.name ?? '');
  const [shortDesc,     setShortDesc]     = useState(product?.short_description ?? '');
  const [fullDesc,      setFullDesc]      = useState(product?.full_description ?? '');
  const [price,         setPrice]         = useState(String(product?.price_amount ?? ''));
  const [priceLabel,    setPriceLabel]    = useState(product?.price_label ?? '');
  const [duration,      setDuration]      = useState(String(product?.duration_minutes ?? '45'));
  const [imageUrl,      setImageUrl]      = useState(product?.image_url ?? '');
  const [label,         setLabel]         = useState(product?.label ?? '');
  const [isActive,      setIsActive]      = useState(product?.is_active ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(product?.show_on_homepage ?? false);
  const [homepageOrder, setHomepageOrder] = useState(String(product?.homepage_order ?? '0'));
  const [benefits,      setBenefits]      = useState<string[]>(product?.benefits?.map((b) => b.benefit_text) ?? ['']);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState('');
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm,       setConfirm]       = useState<{
    open: boolean; title: string; message: string;
    confirmLabel: string; danger?: boolean; loading?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });

  /* slug is generated server-side on create; kept on edit */
  const slugValue = isEdit ? (product?.slug ?? '') : slugify(name);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name,
      slug: slugValue,
      shortDescription: shortDesc,
      fullDescription:  fullDesc,
      priceAmount:      parseInt(price, 10),
      priceLabel,
      durationMinutes:  parseInt(duration, 10),
      imageUrl:         imageUrl || null,
      label:            label || null,
      isActive,
      showOnHomepage,
      homepageOrder:    parseInt(homepageOrder, 10),
      benefits:         benefits.map((b) => b.trim()).filter(Boolean),
    };

    const url    = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Gagal menyimpan. Coba lagi.');
        return;
      }
      showToast(isEdit ? 'Produk berhasil diperbarui.' : 'Produk berhasil dibuat.');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 800);
    } catch {
      setError('Koneksi gagal. Periksa jaringan dan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  function askDelete() {
    if (!product?.id) return;
    setConfirm({
      open: true,
      danger: true,
      title: 'Hapus Produk',
      message: `Produk "${name}" akan dihapus secara permanen. Semua data terkait akan hilang. Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Produk',
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        setDeleting(true);
        try {
          const res = await fetch(`/api/admin/products/${product!.id}`, { method: 'DELETE' });
          setConfirm(c => ({ ...c, open: false, loading: false }));
          if (!res.ok) {
            setError('Gagal menghapus produk. Coba lagi.');
            showToast('Gagal menghapus produk.', 'error');
            return;
          }
          showToast('Produk berhasil dihapus.');
          setTimeout(() => {
            router.push('/admin/products');
            router.refresh();
          }, 800);
        } catch {
          setConfirm(c => ({ ...c, open: false, loading: false }));
          setError('Koneksi gagal. Coba lagi.');
          showToast('Koneksi gagal. Coba lagi.', 'error');
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        loading={confirm.loading}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* Name */}
        <label className="admin-field">
          <span className="admin-field-label">Nama Produk *</span>
          <input
            className="control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        {/* Descriptions */}
        <label className="admin-field">
          <span className="admin-field-label">Deskripsi Singkat</span>
          <input className="control" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} maxLength={500} />
        </label>

        <label className="admin-field">
          <span className="admin-field-label">Deskripsi Lengkap</span>
          <textarea className="control" value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} rows={5} />
        </label>

        {/* Price / Duration */}
        <div className="admin-form-grid three">
          <label className="admin-field">
            <span className="admin-field-label">Harga (IDR) *</span>
            <input className="control" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Label Harga</span>
            <input className="control" value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="IDR 750.000" />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Durasi (menit)</span>
            <input className="control" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
          </label>
        </div>

        {/* Image upload */}
        <div className="admin-field">
          <span className="admin-field-label">Foto Produk</span>
          <ImageUpload
            currentUrl={imageUrl}
            productName={name}
            onUploaded={(url) => setImageUrl(url)}
          />
        </div>

        {/* Badge label */}
        <label className="admin-field">
          <span className="admin-field-label">Label Badge</span>
          <input className="control" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Popular, New…" maxLength={50} />
        </label>

        {/* Toggles */}
        <div className="admin-form-grid three">
          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span className="admin-field-label">Aktif</span>
          </label>
          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span className="admin-field-label">Tampil di Homepage</span>
          </label>
          <label className="admin-field">
            <span className="admin-field-label">Urutan Homepage</span>
            <input className="control" type="number" value={homepageOrder} onChange={(e) => setHomepageOrder(e.target.value)} min="0" />
          </label>
        </div>

        {/* Benefits */}
        <div className="admin-field">
          <span className="admin-field-label">Benefit / Kandungan</span>
          {benefits.map((benefit, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, marginBottom: 8 }}>
              <input
                className="control"
                value={benefit}
                onChange={(e) => setBenefits((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
                placeholder={`Benefit ${index + 1}`}
              />
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setBenefits((prev) => prev.filter((_, i) => i !== index))}
                aria-label={`Hapus benefit ${index + 1}`}
              >
                Hapus
              </button>
            </div>
          ))}
          <button className="button button-secondary" type="button" onClick={() => setBenefits((prev) => [...prev, ''])}>
            Tambah Benefit
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="admin-form-actions">
          <button
            className={`button button-primary${saving ? ' loading' : ''}`}
            type="submit"
            disabled={saving || deleting}
          >
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Buat Produk'}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => router.back()}
            disabled={saving || deleting}
          >
            Batal
          </button>
          {isEdit && (
            <button
              className="button button-secondary"
              type="button"
              onClick={askDelete}
              disabled={saving || deleting}
              style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,.35)', marginLeft: 'auto' }}
            >
              {deleting ? 'Menghapus…' : 'Hapus Produk'}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

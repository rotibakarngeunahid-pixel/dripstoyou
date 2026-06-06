'use client';

import { useEffect, useRef, useState } from 'react';
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

type ApiResponse = {
  error?: string;
  message?: string;
};

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product?.id;

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? '');
  const [fullDesc, setFullDesc] = useState(product?.full_description ?? '');
  const [price, setPrice] = useState(String(product?.price_amount ?? ''));
  const [priceLabel, setPriceLabel] = useState(product?.price_label ?? '');
  const [duration, setDuration] = useState(String(product?.duration_minutes ?? '45'));
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [label, setLabel] = useState(product?.label ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(product?.show_on_homepage ?? false);
  const [homepageOrder, setHomepageOrder] = useState(String(product?.homepage_order ?? '0'));
  const [benefits, setBenefits] = useState<string[]>(product?.benefits?.map((item) => item.benefit_text) ?? ['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [imagePreviewUrl, setImagePreviewUrl] = useState(product?.image_url ?? '');
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    const delay = imageUrl.trim() ? 600 : 0;
    previewDebounceRef.current = setTimeout(() => {
      if (!imageUrl.trim()) {
        setImagePreviewUrl('');
        setImageStatus('idle');
      } else {
        setImageStatus('loading');
        setImagePreviewUrl(imageUrl.trim());
      }
    }, delay);
    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [imageUrl]);

  function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name,
      slug,
      shortDescription: shortDesc,
      fullDescription: fullDesc,
      priceAmount: parseInt(price, 10),
      priceLabel,
      durationMinutes: parseInt(duration, 10),
      imageUrl: imageUrl || null,
      label: label || null,
      isActive,
      showOnHomepage,
      homepageOrder: parseInt(homepageOrder, 10),
      benefits: benefits.map((item) => item.trim()).filter(Boolean),
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Gagal menyimpan');
        return;
      }
      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product?.id) return;
    if (!confirm(`Hapus produk "${name}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Gagal menghapus');
        return;
      }
      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span className="admin-field-label">Nama Produk *</span>
          <input
            className="control"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!isEdit) setSlug(slugify(e.target.value));
            }}
            required
          />
        </label>
        <label className="admin-field">
          <span className="admin-field-label">Slug *</span>
          <input
            className="control"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9-]+"
          />
        </label>
      </div>

      <label className="admin-field">
        <span className="admin-field-label">Deskripsi Singkat</span>
        <input
          className="control"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          maxLength={500}
        />
      </label>

      <label className="admin-field">
        <span className="admin-field-label">Deskripsi Lengkap</span>
        <textarea className="control" value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} />
      </label>

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

      <div className="admin-form-grid">
        <label className="admin-field">
          <span className="admin-field-label">URL Gambar Produk</span>
          <input
            className="control"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.pexels.com/..."
          />
          <span className="admin-help">Rekomendasi rasio 1:1, min. 600x600px. Format JPG, PNG, atau WebP.</span>
        </label>
        <label className="admin-field">
          <span className="admin-field-label">Label Badge</span>
          <input className="control" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Popular, New..." maxLength={50} />
        </label>
      </div>

      {imageUrl.trim() && (
        <div className="surface-card" style={{ maxWidth: 280, padding: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#e8e4da', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imageStatus === 'loading' && <div className="admin-help">Memuat preview...</div>}
            {imagePreviewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imagePreviewUrl}
                alt="Preview gambar produk"
                onLoad={() => setImageStatus('ok')}
                onError={() => setImageStatus('error')}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageStatus === 'error' ? 'none' : 'block',
                }}
              />
            )}
            {imageStatus === 'error' && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ color: '#c0392b', fontWeight: 800 }}>Gambar tidak dapat dimuat</div>
                <div className="admin-help" style={{ marginTop: 4 }}>Periksa URL atau gunakan URL lain.</div>
              </div>
            )}
          </div>
          {imageStatus === 'ok' && (
            <div style={{ padding: '9px 12px', background: '#ecfdf3', color: '#167a3f', fontSize: '.78rem', fontWeight: 800 }}>
              Gambar berhasil dimuat
            </div>
          )}
        </div>
      )}

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

      <div className="admin-field">
        <span className="admin-field-label">Benefit / Kandungan</span>
        {benefits.map((benefit, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8 }}>
            <input
              className="control"
              value={benefit}
              onChange={(e) => setBenefits((prev) => prev.map((value, itemIndex) => (itemIndex === index ? e.target.value : value)))}
              placeholder={`Benefit ${index + 1}`}
            />
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setBenefits((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
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
        <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
          {saving ? 'Menyimpan' : isEdit ? 'Simpan Perubahan' : 'Buat Produk'}
        </button>
        <button className="button button-secondary" type="button" onClick={() => router.back()}>
          Batal
        </button>
        {isEdit && (
          <button
            className="button button-secondary"
            type="button"
            onClick={handleDelete}
            disabled={saving}
            style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,.35)', marginLeft: 'auto' }}
          >
            Hapus Produk
          </button>
        )}
      </div>
    </form>
  );
}

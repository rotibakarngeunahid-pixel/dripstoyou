'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id?: string;
  name?: string;
  slug?: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  priceAmount?: number;
  priceLabel?: string | null;
  durationMinutes?: number | null;
  imageUrl?: string | null;
  label?: string | null;
  isActive?: boolean;
  showOnHomepage?: boolean;
  homepageOrder?: number;
  benefits?: { benefitText: string }[];
};

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product?.id;

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [shortDesc, setShortDesc] = useState(product?.shortDescription ?? '');
  const [fullDesc, setFullDesc] = useState(product?.fullDescription ?? '');
  const [price, setPrice] = useState(String(product?.priceAmount ?? ''));
  const [priceLabel, setPriceLabel] = useState(product?.priceLabel ?? '');
  const [duration, setDuration] = useState(String(product?.durationMinutes ?? '45'));
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [label, setLabel] = useState(product?.label ?? '');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(product?.showOnHomepage ?? false);
  const [homepageOrder, setHomepageOrder] = useState(String(product?.homepageOrder ?? '0'));
  const [benefits, setBenefits] = useState<string[]>(product?.benefits?.map((b) => b.benefitText) ?? ['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
      imageUrl: imageUrl || undefined,
      label: label || undefined,
      isActive,
      showOnHomepage,
      homepageOrder: parseInt(homepageOrder, 10),
      benefits: benefits.filter((b) => b.trim()),
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal menyimpan'); return; }
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
      if (!res.ok) { setError('Gagal menghapus'); return; }
      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #DBDAD7', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#6b7e7e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Nama Produk *</label>
          <input value={name} onChange={(e) => { setName(e.target.value); if (!isEdit) setSlug(slugify(e.target.value)); }} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Slug *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Deskripsi Singkat</label>
        <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} style={inputStyle} maxLength={500} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Deskripsi Lengkap</label>
        <textarea value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Harga (IDR) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Label Harga</label>
          <input value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="IDR 750.000" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Durasi (menit)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>URL Gambar</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Label Badge</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Popular, New..." style={inputStyle} maxLength={50} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 14, height: 14 }} />
            Aktif
          </label>
        </div>
        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} style={{ width: 14, height: 14 }} />
            Tampil di Homepage
          </label>
        </div>
        <div>
          <label style={labelStyle}>Urutan Homepage</label>
          <input type="number" value={homepageOrder} onChange={(e) => setHomepageOrder(e.target.value)} min="0" style={inputStyle} />
        </div>
      </div>

      {/* Benefits */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Benefit / Kandungan</label>
        {benefits.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={b} onChange={(e) => setBenefits((prev) => prev.map((v, j) => j === i ? e.target.value : v))} placeholder={`Benefit ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={() => setBenefits((prev) => prev.filter((_, j) => j !== i))} style={{ padding: '0 12px', border: '1px solid #DBDAD7', borderRadius: 8, background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => setBenefits((prev) => [...prev, ''])} style={{ padding: '6px 14px', border: '1px dashed #DBDAD7', borderRadius: 8, background: 'white', color: '#29808B', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
          + Tambah Benefit
        </button>
      </div>

      {error && <div style={{ background: '#fee2e222', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" disabled={saving} style={{ padding: '11px 28px', background: '#205251', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Produk'}
        </button>
        <button type="button" onClick={() => router.back()} style={{ padding: '11px 20px', border: '1px solid #DBDAD7', borderRadius: 8, fontSize: 13, color: '#6b7e7e', background: 'white', cursor: 'pointer' }}>
          Batal
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={saving} style={{ padding: '11px 20px', border: '1px solid #ef4444', borderRadius: 8, fontSize: 13, color: '#ef4444', background: 'white', cursor: saving ? 'not-allowed' : 'pointer', marginLeft: 'auto' }}>
            Hapus Produk
          </button>
        )}
      </div>
    </form>
  );
}

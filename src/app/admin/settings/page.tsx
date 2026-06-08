'use client';

import { useEffect, useMemo, useState } from 'react';
import { Coins, Mail, MessageCircle, Settings2 } from 'lucide-react';
import { CURRENCY_OPTIONS, normalizeCurrency, type CurrencyCode } from '@/lib/currency';

type CurrencySetting = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
  manualRateToIdr: number | null;
  isActive: boolean;
};

type SettingsData = Record<string, string | CurrencySetting[] | undefined> & {
  currencySettings?: CurrencySetting[];
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

function defaultCurrencySettings(): CurrencySetting[] {
  return CURRENCY_OPTIONS.map((option) => ({
    code: option.code,
    symbol: option.symbol,
    name: option.name,
    decimalPlaces: option.decimalPlaces,
    manualRateToIdr: null,
    isActive: true,
  }));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [currencySettings, setCurrencySettings] = useState<CurrencySetting[]>(defaultCurrencySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((res) => res.json() as Promise<ApiResponse<SettingsData>>)
      .then((json) => {
        const data = json.data ?? {};
        setSettings(data);
        if (Array.isArray(data.currencySettings)) {
          setCurrencySettings(data.currencySettings);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal memuat pengaturan.');
        setLoading(false);
      });
  }, []);

  const defaultCurrency = normalizeCurrency(settings.default_currency as string | undefined);
  const activeCurrencyCodes = useMemo(
    () => currencySettings.filter((item) => item.isActive).map((item) => item.code),
    [currencySettings],
  );

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updateCurrency(code: CurrencyCode, patch: Partial<CurrencySetting>) {
    setCurrencySettings((prev) => prev.map((item) => (
      item.code === code ? { ...item, ...patch } : item
    )));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const nextDefault = activeCurrencyCodes.includes(defaultCurrency)
        ? defaultCurrency
        : (activeCurrencyCodes[0] ?? 'IDR');

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number: settings.whatsapp_number,
          business_hours: settings.business_hours,
          response_time_minutes: settings.response_time_minutes,
          site_name: settings.site_name,
          site_email: settings.site_email,
          default_currency: nextDefault,
          currencySettings,
        }),
      });
      const json = (await res.json()) as ApiResponse<null>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan');
        return;
      }
      updateField('default_currency', nextDefault);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page" style={{ maxWidth: 980 }}>
        <div className="skeleton-line" style={{ width: 220, height: 28, marginBottom: 28 }} />
        {[1, 2, 3].map((item) => (
          <div className="form-card" key={item} style={{ marginBottom: 16 }}>
            <div className="skeleton-line" style={{ width: 180, height: 20, marginBottom: 20 }} />
            <div className="skeleton-button" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-page settings-page" style={{ maxWidth: 980 }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Pengaturan Situs</h1>
          <p className="admin-subtitle">Kontak, jam operasional, identitas website, dan mata uang.</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          Pengaturan berhasil disimpan.
        </div>
      )}

      <form className="admin-form settings-form" onSubmit={save}>
        <section className="form-card">
          <h2 className="form-card-title"><MessageCircle size={18} /> Kontak & WhatsApp</h2>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">Nomor WhatsApp</span>
              <input
                className="control"
                value={(settings.whatsapp_number as string | undefined) ?? ''}
                onChange={(e) => updateField('whatsapp_number', e.target.value)}
                placeholder="6281234567890"
                pattern="\d{10,15}"
              />
              <span className="admin-help">Tanpa tanda + atau spasi. Contoh: 6281234567890</span>
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Email Bisnis</span>
              <input
                className="control"
                type="email"
                value={(settings.site_email as string | undefined) ?? ''}
                onChange={(e) => updateField('site_email', e.target.value)}
                placeholder="hello@dripstoyou.com"
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card-title"><Settings2 size={18} /> Operasional</h2>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">Jam Operasional</span>
              <input
                className="control"
                value={(settings.business_hours as string | undefined) ?? ''}
                onChange={(e) => updateField('business_hours', e.target.value)}
                placeholder="08:00-22:00"
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Waktu Respons (menit)</span>
              <input
                className="control"
                type="number"
                value={(settings.response_time_minutes as string | undefined) ?? ''}
                onChange={(e) => updateField('response_time_minutes', e.target.value)}
                placeholder="60"
                min="1"
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card-title"><Mail size={18} /> Info Situs</h2>
          <label className="admin-field">
            <span className="admin-field-label">Nama Situs</span>
            <input
              className="control"
              value={(settings.site_name as string | undefined) ?? ''}
              onChange={(e) => updateField('site_name', e.target.value)}
              placeholder="Drips To You - Bali"
            />
          </label>
        </section>

        <section className="form-card">
          <h2 className="form-card-title"><Coins size={18} /> Pengaturan Mata Uang</h2>
          <label className="admin-field">
            <span className="admin-field-label">Default Currency</span>
            <select
              className="control"
              value={defaultCurrency}
              onChange={(e) => updateField('default_currency', normalizeCurrency(e.target.value))}
            >
              {currencySettings.filter((item) => item.isActive).map((item) => {
                const option = CURRENCY_OPTIONS.find((currency) => currency.code === item.code);
                return (
                  <option key={item.code} value={item.code}>
                    {option?.flag} {item.code} - {item.name}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="currency-settings-grid">
            {currencySettings.map((item) => {
              const option = CURRENCY_OPTIONS.find((currency) => currency.code === item.code);
              return (
                <div className="currency-setting-card" key={item.code}>
                  <label className="currency-setting-head">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(event) => updateCurrency(item.code, { isActive: event.target.checked })}
                    />
                    <span className="currency-code">
                      <span>{option?.flag}</span>
                      <strong>{item.code}</strong>
                    </span>
                    <small>{item.symbol}</small>
                  </label>
                  <div className="currency-setting-name">{item.name}</div>
                  <label className="admin-field">
                    <span className="admin-field-label">Kurs Manual ke IDR</span>
                    <input
                      className="control"
                      type="number"
                      min="0"
                      step="0.000001"
                      value={item.manualRateToIdr ?? ''}
                      onChange={(event) => updateCurrency(item.code, {
                        manualRateToIdr: event.target.value === '' ? null : Number(event.target.value),
                      })}
                      placeholder={item.code === 'IDR' ? '1' : 'Opsional'}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <div className="admin-form-actions">
          <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
            {saving ? 'Menyimpan' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}

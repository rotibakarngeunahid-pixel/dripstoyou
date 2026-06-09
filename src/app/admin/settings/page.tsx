'use client';

import { useEffect, useMemo, useState } from 'react';
import { Coins, Mail, MessageCircle, Settings2 } from 'lucide-react';
import { CURRENCY_OPTIONS, normalizeCurrency, type CurrencyCode } from '@/lib/currency';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import {
  DAY_KEYS,
  type DayKey,
  type OperatingHoursSchedule,
  getDefaultSchedule,
  parseOperatingHours,
} from '@/lib/operatingHours';

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

// day1=Mon…day6=Sat, day0=Sun — matches DAY_KEYS order Mon→Sun
const DAY_TRANS_KEYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day0'] as const;

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
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [settings, setSettings] = useState<SettingsData>({});
  const [currencySettings, setCurrencySettings] = useState<CurrencySetting[]>(defaultCurrencySettings);
  const [operatingHours, setOperatingHours] = useState<OperatingHoursSchedule>(getDefaultSchedule);
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
        setOperatingHours(parseOperatingHours(data.business_hours as string | undefined));
        setLoading(false);
      })
      .catch(() => {
        setError(t.gagalMemuatPengaturan);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function updateDay(key: DayKey, patch: Partial<OperatingHoursSchedule[DayKey]>) {
    setOperatingHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function applyToAll() {
    const monday = { ...operatingHours.monday };
    setOperatingHours((prev) => {
      const next = { ...prev };
      for (const key of DAY_KEYS) next[key] = { ...monday };
      return next;
    });
  }

  function resetToDefault() {
    setOperatingHours(getDefaultSchedule());
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
          business_hours: JSON.stringify(operatingHours),
          response_time_minutes: settings.response_time_minutes,
          site_name: settings.site_name,
          site_email: settings.site_email,
          default_currency: nextDefault,
          currencySettings,
        }),
      });
      const json = (await res.json()) as ApiResponse<null>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? t.gagalMenyimpan);
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
          <h1 className="admin-title">{t.settingsTitle}</h1>
          <p className="admin-subtitle">{t.settingsSubtitle}</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {t.ohBerhasil}
        </div>
      )}

      <form className="admin-form settings-form" onSubmit={save}>
        {/* Kontak */}
        <section className="form-card">
          <h2 className="form-card-title"><MessageCircle size={18} /> {t.kontakWhatsApp}</h2>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">{t.nomorWA}</span>
              <input
                className="control"
                value={(settings.whatsapp_number as string | undefined) ?? ''}
                onChange={(e) => updateField('whatsapp_number', e.target.value)}
                placeholder="6281234567890"
                pattern="\d{10,15}"
              />
              <span className="admin-help">{t.waHelp}</span>
            </label>
            <label className="admin-field">
              <span className="admin-field-label">{t.emailBisnis}</span>
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

        {/* Operasional — weekly schedule */}
        <section className="form-card">
          <h2 className="form-card-title"><Settings2 size={18} /> {t.operasional}</h2>

          <div className="oh-schedule">
            <div className="oh-schedule-actions">
              <button type="button" className="button button-secondary oh-action-btn" onClick={applyToAll}>
                {t.ohTerapkanSemua}
              </button>
              <button type="button" className="button oh-action-btn oh-reset-btn" onClick={resetToDefault}>
                {t.resetDefault}
              </button>
            </div>

            {DAY_KEYS.map((key, i) => {
              const day = operatingHours[key];
              return (
                <div className="oh-row" key={key}>
                  <span className="oh-day">{t[DAY_TRANS_KEYS[i]]}</span>

                  <button
                    type="button"
                    className={`oh-toggle${day.isOpen ? ' oh-toggle-open' : ''}`}
                    onClick={() => updateDay(key, { isOpen: !day.isOpen })}
                    aria-pressed={day.isOpen}
                  >
                    {day.isOpen ? t.buka : t.ohTutup}
                  </button>

                  <div className="oh-times">
                    <input
                      type="time"
                      className="control oh-time"
                      value={day.open}
                      onChange={(e) => updateDay(key, { open: e.target.value })}
                      disabled={!day.isOpen || day.is24h}
                    />
                    <span className="oh-sep">{t.ohSampai}</span>
                    <input
                      type="time"
                      className="control oh-time"
                      value={day.close}
                      onChange={(e) => updateDay(key, { close: e.target.value })}
                      disabled={!day.isOpen || day.is24h}
                    />
                  </div>

                  <label className="oh-24h-label">
                    <input
                      type="checkbox"
                      checked={day.is24h}
                      onChange={(e) => updateDay(key, { is24h: e.target.checked })}
                      disabled={!day.isOpen}
                    />
                    <span>{t.oh24Jam}</span>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Response time */}
          <div className="admin-form-grid" style={{ marginTop: 24 }}>
            <label className="admin-field">
              <span className="admin-field-label">{t.waktuResponsMenit}</span>
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

        {/* Info Situs */}
        <section className="form-card">
          <h2 className="form-card-title"><Mail size={18} /> {t.infoSitus}</h2>
          <label className="admin-field">
            <span className="admin-field-label">{t.namaSitus}</span>
            <input
              className="control"
              value={(settings.site_name as string | undefined) ?? ''}
              onChange={(e) => updateField('site_name', e.target.value)}
              placeholder="Drips To You - Bali"
            />
          </label>
        </section>

        {/* Mata Uang */}
        <section className="form-card">
          <h2 className="form-card-title"><Coins size={18} /> {t.pengaturanMataUang}</h2>
          <label className="admin-field">
            <span className="admin-field-label">{t.defaultCurrency}</span>
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
                    <span className="admin-field-label">{t.kursManualIDR}</span>
                    <input
                      className="control"
                      type="number"
                      min="0"
                      step="0.000001"
                      value={item.manualRateToIdr ?? ''}
                      onChange={(event) => updateCurrency(item.code, {
                        manualRateToIdr: event.target.value === '' ? null : Number(event.target.value),
                      })}
                      placeholder={item.code === 'IDR' ? '1' : t.opsional}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <div className="admin-form-actions">
          <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
            {saving ? t.menyimpan : t.simpanPengaturan}
          </button>
        </div>
      </form>
    </div>
  );
}

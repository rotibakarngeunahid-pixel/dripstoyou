'use client';

import { useEffect, useState } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

type ApiDaySetting = {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
  max_bookings_per_slot: number;
  min_prebooking_minutes: number;
};

type DaySetting = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  maxBookingsPerSlot: number;
  minPrebookingMinutes: number;
};

function fromApi(day: ApiDaySetting): DaySetting {
  return {
    dayOfWeek: day.day_of_week,
    isOpen: day.is_open,
    openTime: day.open_time,
    closeTime: day.close_time,
    slotDurationMinutes: day.slot_duration_minutes,
    maxBookingsPerSlot: day.max_bookings_per_slot,
    minPrebookingMinutes: day.min_prebooking_minutes,
  };
}

export default function SchedulePage() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [schedule, setSchedule] = useState<DaySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/schedule')
      .then((res) => res.json() as Promise<ApiResponse<ApiDaySetting[]>>)
      .then((json) => {
        setSchedule(Array.isArray(json.data) ? json.data.map(fromApi) : []);
        setLoading(false);
      })
      .catch(() => {
        setError(t.gagalMemuatJadwal);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(day: number, field: keyof DaySetting, value: boolean | string | number) {
    setSchedule((prev) => prev.map((item) => (
      item.dayOfWeek === day ? { ...item, [field]: value } : item
    )));
  }

  async function save() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      const json = (await res.json()) as ApiResponse<ApiDaySetting[]>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? t.gagalMenyimpan);
        return;
      }
      if (Array.isArray(json.data)) setSchedule(json.data.map(fromApi));
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
      <div className="admin-page">
        <div className="skeleton-line" style={{ width: 240, height: 28, marginBottom: 28 }} />
        <div className="table-shell">
          <div style={{ padding: 22 }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <div className="skeleton-line" key={item} style={{ marginBottom: 16 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.jadwalTitle}</h1>
          <p className="admin-subtitle">{t.jadwalSubtitle}</p>
        </div>
        <button className={`button button-primary${saving ? ' loading' : ''}`} onClick={save} disabled={saving} type="button">
          {saving ? t.menyimpan : t.simpanJadwal}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert" style={{ marginBottom: 16, background: '#ecfdf3', border: '1px solid #b7e4c7', color: '#167a3f' }}>
          {t.jadwalBerhasil}
        </div>
      )}

      <section className="table-shell">
        <div className="table-wrap">
          <table className="data-table admin-schedule-table">
            <thead>
              <tr>
                {[t.hari, t.buka, t.jamBuka, t.jamTutup, t.slotDurasi, t.maxPerSlot, t.minPreBooking].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((day) => (
                <tr key={day.dayOfWeek}>
                  <td data-label={t.hari} style={{ color: 'var(--teal)', fontWeight: 800 }}>
                    {t[`day${day.dayOfWeek}` as keyof typeof t] ?? String(day.dayOfWeek)}
                  </td>
                  <td data-label={t.buka}>
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => update(day.dayOfWeek, 'isOpen', e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                  </td>
                  <td data-label={t.jamBuka}>
                    <input
                      className="control"
                      type="time"
                      value={day.openTime}
                      onChange={(e) => update(day.dayOfWeek, 'openTime', e.target.value)}
                      disabled={!day.isOpen}
                    />
                  </td>
                  <td data-label={t.jamTutup}>
                    <input
                      className="control"
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => update(day.dayOfWeek, 'closeTime', e.target.value)}
                      disabled={!day.isOpen}
                    />
                  </td>
                  <td data-label={t.slotDurasi}>
                    <input
                      className="control"
                      type="number"
                      value={day.slotDurationMinutes}
                      onChange={(e) => update(day.dayOfWeek, 'slotDurationMinutes', parseInt(e.target.value, 10))}
                      min="15"
                      max="480"
                      disabled={!day.isOpen}
                    />
                  </td>
                  <td data-label={t.maxPerSlot}>
                    <input
                      className="control"
                      type="number"
                      value={day.maxBookingsPerSlot}
                      onChange={(e) => update(day.dayOfWeek, 'maxBookingsPerSlot', parseInt(e.target.value, 10))}
                      min="1"
                      max="20"
                      disabled={!day.isOpen}
                    />
                  </td>
                  <td data-label={t.minPreBooking}>
                    <input
                      className="control"
                      type="number"
                      value={day.minPrebookingMinutes}
                      onChange={(e) => update(day.dayOfWeek, 'minPrebookingMinutes', parseInt(e.target.value, 10))}
                      min="0"
                      disabled={!day.isOpen}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="admin-help" style={{ marginTop: 12 }}>
        {t.minPreBookingHelp}
      </p>
      <p className="admin-help" style={{ marginTop: 4 }}>
        {t.jamTutupHelp}
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type DaySetting = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  maxBookingsPerSlot: number;
  minPrebookingMinutes: number;
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/schedule')
      .then((r) => r.json())
      .then((d) => { setSchedule(d.schedule ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function update(day: number, field: keyof DaySetting, value: boolean | string | number) {
    setSchedule((prev) => prev.map((d) => d.dayOfWeek === day ? { ...d, [field]: value } : d));
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
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal menyimpan'); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7e7e' }}>Memuat...</div>;

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #DBDAD7', borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#205251' }}>Jadwal Operasional</h1>
        <button onClick={save} disabled={saving} style={{ padding: '10px 24px', background: '#205251', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
      </div>

      {error && <div style={{ background: '#fee2e222', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: '#dcfce722', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 13, marginBottom: 16 }}>Jadwal berhasil disimpan!</div>}

      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {['Hari', 'Buka', 'Jam Buka', 'Jam Tutup', 'Slot (menit)', 'Max/Slot', 'Min Pre-booking'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: '#6b7e7e', fontWeight: 600, borderBottom: '1px solid #DBDAD7', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((day) => (
              <tr key={day.dayOfWeek} style={{ borderBottom: '1px solid #f0eeea' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#205251' }}>{DAY_NAMES[day.dayOfWeek]}</td>
                <td style={{ padding: '10px 14px' }}>
                  <input type="checkbox" checked={day.isOpen} onChange={(e) => update(day.dayOfWeek, 'isOpen', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '8px 14px', minWidth: 100 }}>
                  <input type="time" value={day.openTime} onChange={(e) => update(day.dayOfWeek, 'openTime', e.target.value)} disabled={!day.isOpen} style={{ ...inputStyle, opacity: day.isOpen ? 1 : 0.4 }} />
                </td>
                <td style={{ padding: '8px 14px', minWidth: 100 }}>
                  <input type="time" value={day.closeTime} onChange={(e) => update(day.dayOfWeek, 'closeTime', e.target.value)} disabled={!day.isOpen} style={{ ...inputStyle, opacity: day.isOpen ? 1 : 0.4 }} />
                </td>
                <td style={{ padding: '8px 14px', minWidth: 80 }}>
                  <input type="number" value={day.slotDurationMinutes} onChange={(e) => update(day.dayOfWeek, 'slotDurationMinutes', parseInt(e.target.value, 10))} min="15" max="480" disabled={!day.isOpen} style={{ ...inputStyle, opacity: day.isOpen ? 1 : 0.4 }} />
                </td>
                <td style={{ padding: '8px 14px', minWidth: 70 }}>
                  <input type="number" value={day.maxBookingsPerSlot} onChange={(e) => update(day.dayOfWeek, 'maxBookingsPerSlot', parseInt(e.target.value, 10))} min="1" max="20" disabled={!day.isOpen} style={{ ...inputStyle, opacity: day.isOpen ? 1 : 0.4 }} />
                </td>
                <td style={{ padding: '8px 14px', minWidth: 90 }}>
                  <input type="number" value={day.minPrebookingMinutes} onChange={(e) => update(day.dayOfWeek, 'minPrebookingMinutes', parseInt(e.target.value, 10))} min="0" disabled={!day.isOpen} style={{ ...inputStyle, opacity: day.isOpen ? 1 : 0.4 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: '#6b7e7e', fontSize: 12, marginTop: 12 }}>Min Pre-booking = menit minimum sebelum waktu booking (e.g. 120 = minimal pesan 2 jam sebelumnya)</p>
    </div>
  );
}

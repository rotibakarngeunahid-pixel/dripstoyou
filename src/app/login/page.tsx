'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

type LoginResponse = { success?: boolean; error?: string; message?: string; target?: string };

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'checking' | 'login' | 'setup'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let needsSetup = false;
      try {
        const res = await fetch('/api/crm/setup', { cache: 'no-store' });
        const json = (await res.json()) as { data?: { needs_setup?: boolean } };
        needsSetup = Boolean(json.data?.needs_setup);
      } catch { /* default to login */ }
      if (!active) return;
      setMode(needsSetup ? 'setup' : 'login');
      const reason = new URLSearchParams(window.location.search).get('reason');
      if (reason === 'session-expired') setError('Sesi Anda telah berakhir. Silakan login kembali.');
      else if (reason === 'auth-unavailable') setError('Layanan autentikasi sedang tidak tersedia.');
    })();
    return () => { active = false; };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as LoginResponse;
      if (!res.ok || !data.success) { setError(data.error ?? data.message ?? 'Email atau password salah'); setLoading(false); return; }
      router.replace(data.target ?? '/crm/dashboard');
      router.refresh();
    } catch { setError('Koneksi ke server gagal. Silakan coba lagi.'); setLoading(false); }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/crm/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; message?: string };
      if (!res.ok || !data.success) { setError(data.error ?? data.message ?? 'Gagal membuat akun'); setLoading(false); return; }
      setMode('login'); setPassword(''); setLoading(false);
      setNotice('Akun OWNER berhasil dibuat. Silakan login.');
    } catch { setError('Koneksi ke server gagal. Silakan coba lagi.'); setLoading(false); }
  }

  const isSetup = mode === 'setup';
  const serif = { fontFamily: 'var(--font-playfair, Georgia, serif)' };
  const sans = { fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' };

  return (
    <main
      style={{ ...sans, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', background: 'radial-gradient(1200px 600px at 50% -10%, #2c6b69 0%, #205251 45%, #163b3a 100%)' }}
    >
      {/* soft brand glows */}
      <div aria-hidden style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -120, right: -100, background: 'radial-gradient(circle, rgba(201,148,76,0.18), transparent 70%)' }} />
      <div aria-hidden style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', bottom: -160, left: -120, background: 'radial-gradient(circle, rgba(142,191,191,0.18), transparent 70%)' }} />

      <style>{`
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:hover,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset;
          box-shadow: 0 0 0 1000px #ffffff inset;
          -webkit-text-fill-color: #111a1a;
          caret-color: #111a1a;
        }
      `}</style>

      <section
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, background: '#ffffff', borderRadius: 24, boxShadow: '0 30px 80px rgba(0,0,0,0.35)', padding: '40px 32px' }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#205251', color: '#EAD4AE', boxShadow: '0 8px 20px rgba(32,82,81,0.35)', marginBottom: 16 }}>
            <span style={{ ...serif, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>D</span>
          </div>
          <h1 style={{ ...serif, fontSize: 26, color: '#205251', margin: 0 }}>Drips To You</h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, letterSpacing: 2, color: '#8EBFBF', fontWeight: 600 }}>
            {isSetup ? 'SETUP AKUN OWNER' : 'PORTAL INTERNAL'}
          </p>
        </div>

        {mode === 'checking' ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #D6EAEA', borderTopColor: '#205251', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <form onSubmit={isSetup ? handleSetup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isSetup && (
              <Field label="Nama" icon={<User size={18} />}>
                <input className="auth-input" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nama Owner" disabled={loading} />
              </Field>
            )}

            <Field label="Email" icon={<Mail size={18} />}>
              <input className="auth-input" style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="email@dripstoyou.com" disabled={loading} />
            </Field>

            <Field label="Password" icon={<Lock size={18} />}>
              <input className="auth-input" style={{ ...inputStyle, paddingRight: 44 }} type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSetup ? 'new-password' : 'current-password'} placeholder={isSetup ? 'Min 8 karakter' : '••••••••'} disabled={loading} />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Sembunyikan password' : 'Lihat password'}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#8EBFBF', cursor: 'pointer', padding: 4, display: 'flex' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            {notice && <div role="status" style={{ borderRadius: 12, border: '1px solid #8EBFBF', background: '#D6EAEA', padding: '10px 14px', fontSize: 14, color: '#205251' }}>{notice}</div>}
            {error && <div role="alert" style={{ borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', padding: '10px 14px', fontSize: 14, color: '#b91c1c' }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ height: 50, borderRadius: 14, border: 'none', cursor: loading ? 'default' : 'pointer', color: '#fff', fontSize: 16, fontWeight: 600, marginTop: 4, background: 'linear-gradient(180deg,#d4a35a,#C9944C)', boxShadow: '0 10px 24px rgba(201,148,76,0.35)', opacity: loading ? 0.75 : 1, transition: 'filter .15s' }}>
              {loading ? 'Memproses…' : isSetup ? 'Buat Akun & Lanjut' : 'Masuk'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#9ab' }}>
          Admin · Nurse · Finance — satu portal &nbsp;·&nbsp; Drips To You Bali
        </p>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 50, borderRadius: 14, border: '1px solid #DBDAD7', padding: '0 14px 0 42px',
  fontSize: 16, color: '#111a1a', outline: 'none', background: '#fff', boxSizing: 'border-box',
};

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#205251' }}>{label}</span>
      <span style={{ position: 'relative', display: 'block' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8EBFBF', display: 'flex', pointerEvents: 'none' }}>{icon}</span>
        {children}
      </span>
    </label>
  );
}

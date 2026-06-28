'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = { success?: boolean; error?: string; message?: string; target?: string };

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'checking' | 'login' | 'setup'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

  const inputCls = 'h-12 w-full rounded-xl border border-[#DBDAD7] px-4 text-base text-[#111a1a] outline-none transition focus:border-[#29808B] focus:ring-2 focus:ring-[#D6EAEA] disabled:opacity-60';
  const isSetup = mode === 'setup';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#205251] px-4 py-10" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#205251] text-2xl font-bold text-[#EAD4AE]">D</div>
          <h1 className="text-2xl text-[#205251]" style={{ fontFamily: 'var(--font-playfair, serif)' }}>Drips To You</h1>
          <p className="mt-1 text-sm tracking-wide text-[#4d6060]">{isSetup ? 'SETUP AKUN OWNER PERTAMA' : 'PORTAL INTERNAL'}</p>
        </div>

        {mode === 'checking' ? (
          <div className="flex justify-center py-8"><span className="h-7 w-7 animate-spin rounded-full border-2 border-[#8EBFBF] border-t-[#205251]" /></div>
        ) : (
          <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-5">
            {isSetup && (
              <div>
                <label htmlFor="login-name" className="mb-1.5 block text-sm font-medium text-[#205251]">Nama</label>
                <input id="login-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nama Owner" disabled={loading} className={inputCls} />
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-[#205251]">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="email@dripstoyou.com" disabled={loading} className={inputCls} />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-[#205251]">Password</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSetup ? 'new-password' : 'current-password'} placeholder={isSetup ? 'Min 8 karakter' : '••••••••'} disabled={loading} className={inputCls} />
            </div>

            {notice && <div role="status" className="rounded-xl border border-[#8EBFBF] bg-[#D6EAEA] px-4 py-3 text-sm text-[#205251]">{notice}</div>}
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#C9944C] text-base font-semibold text-white transition hover:brightness-95 disabled:opacity-70">
              {loading ? 'Memproses…' : isSetup ? 'Buat Akun & Lanjut' : 'Masuk'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-[#8EBFBF]">Admin, Nurse, Finance — satu portal · Drips To You Bali</p>
      </section>
    </main>
  );
}

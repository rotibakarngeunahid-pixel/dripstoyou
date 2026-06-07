'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason === 'session-expired') {
      const timer = window.setTimeout(() => {
        setError('Sesi admin telah berakhir. Silakan login kembali.');
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (reason === 'auth-unavailable') {
      const timer = window.setTimeout(() => {
        setError('Layanan autentikasi admin sedang tidak tersedia. Periksa konfigurasi server.');
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as LoginResponse;
      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Login failed');
        return;
      }
      setSuccess(data.message ?? 'Login berhasil. Mengalihkan ke dashboard...');
      window.setTimeout(() => {
        router.replace('/admin/dashboard?login=success');
      }, 500);
    } catch {
      setError('Koneksi ke server gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <h1>Drips To You - Bali</h1>
          <p>Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dark-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              className="dark-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@dripstoyou.com"
              disabled={loading || Boolean(success)}
            />
          </div>

          <div className="dark-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="dark-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
              disabled={loading || Boolean(success)}
            />
          </div>

          {error && (
            <div className="alert" role="alert" style={{ marginBottom: 18, background: 'rgba(220,38,38,.16)', border: '1px solid rgba(220,38,38,.32)', color: '#fecaca' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status" style={{ marginBottom: 18 }}>
              {success}
            </div>
          )}

          <button className={`button button-gold full${loading ? ' loading' : ''}`} type="submit" disabled={loading || Boolean(success)}>
            {loading ? 'Memverifikasi...' : success ? 'Login Berhasil' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  );
}

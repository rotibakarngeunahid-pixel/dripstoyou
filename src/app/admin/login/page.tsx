'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = {
  error?: string;
  message?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
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
      router.push('/admin/dashboard');
    } catch {
      setError('Network error. Please try again.');
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
            />
          </div>

          {error && (
            <div className="alert" style={{ marginBottom: 18, background: 'rgba(220,38,38,.16)', border: '1px solid rgba(220,38,38,.32)', color: '#fecaca' }}>
              {error}
            </div>
          )}

          <button className={`button button-gold full${loading ? ' loading' : ''}`} type="submit" disabled={loading}>
            {loading ? 'Masuk' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  );
}

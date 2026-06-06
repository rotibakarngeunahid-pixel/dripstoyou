export default function PublicLoading() {
  return (
    <main className="loading-shell">
      <section className="loading-hero">
        <div className="loading-hero-inner">
          <div className="skeleton-line light" style={{ width: 160, margin: '0 auto 18px' }} />
          <div className="skeleton-line light" style={{ width: 'min(420px, 80%)', height: 42, margin: '0 auto 14px' }} />
          <div className="skeleton-line light" style={{ width: 'min(540px, 92%)', margin: '0 auto 12px' }} />
          <div className="skeleton-button light" style={{ width: 180, margin: '24px auto 0' }} />
        </div>
      </section>

      <section className="page-section">
        <div className="loading-grid">
          {[1, 2, 3].map((item) => (
            <div className="surface-card" key={item}>
              <div className="skeleton-block" style={{ minHeight: 120, marginBottom: 18 }} />
              <div className="skeleton-line" style={{ width: '68%', marginBottom: 12 }} />
              <div className="skeleton-line" style={{ width: '92%', marginBottom: 10 }} />
              <div className="skeleton-line" style={{ width: '76%' }} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

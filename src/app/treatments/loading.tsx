import Header from '@/components/public/Header';

export default function TreatmentsLoading() {
  return (
    <>
      <Header />
      <main className="loading-shell">
        <section className="loading-hero">
          <div className="loading-hero-inner">
            <div className="skeleton-line light" style={{ width: 160, margin: '0 auto 18px' }} />
            <div className="skeleton-line light" style={{ width: 'min(420px, 80%)', height: 42, margin: '0 auto 14px' }} />
            <div className="skeleton-line light" style={{ width: 'min(540px, 92%)', margin: '0 auto 22px' }} />
            <div className="skeleton-button light" style={{ width: 160, margin: '0 auto' }} />
          </div>
        </section>

        <section className="page-section">
          <div className="product-grid">
            {[1, 2, 3, 4].map((item) => (
              <div className="product-card" key={item}>
                <div className="skeleton-block" style={{ minHeight: 210 }} />
                <div className="product-body">
                  <div className="skeleton-line" style={{ width: '62%', height: 22, marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ width: '94%', marginBottom: 10 }} />
                  <div className="skeleton-line" style={{ width: '78%', marginBottom: 18 }} />
                  <div className="skeleton-button" style={{ marginTop: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

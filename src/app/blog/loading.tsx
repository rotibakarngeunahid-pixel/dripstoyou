import Header from '@/components/public/Header';

export default function BlogLoading() {
  return (
    <>
      <Header />
      <main className="loading-shell">
        <section className="loading-hero">
          <div className="loading-hero-inner">
            <div className="skeleton-line light" style={{ width: 160, margin: '0 auto 18px' }} />
            <div className="skeleton-line light" style={{ width: 'min(420px, 80%)', height: 42, margin: '0 auto 14px' }} />
            <div className="skeleton-line light" style={{ width: 'min(540px, 92%)', margin: '0 auto' }} />
          </div>
        </section>

        <section className="page-section">
          <div className="blog-grid">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="blog-card" key={item}>
                <div className="skeleton-block" style={{ minHeight: 190 }} />
                <div className="blog-card-body">
                  <div className="skeleton-line" style={{ width: '40%', marginBottom: 14 }} />
                  <div className="skeleton-line" style={{ width: '86%', height: 20, marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ width: '94%', marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: '72%', marginBottom: 18 }} />
                  <div className="skeleton-line" style={{ width: '46%' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

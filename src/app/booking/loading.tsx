export default function BookingLoading() {
  return (
    <main className="loading-shell">
      <section className="loading-hero">
        <div className="loading-hero-inner">
          <div className="skeleton-line light" style={{ width: 110, margin: '0 auto 18px' }} />
          <div className="skeleton-line light" style={{ width: 'min(360px, 84%)', height: 38, margin: '0 auto 12px' }} />
          <div className="skeleton-line light" style={{ width: 'min(520px, 92%)', margin: '0 auto' }} />
        </div>
      </section>

      <section className="booking-wrap">
        {[1, 2, 3].map((card) => (
          <div className="form-card" key={card} style={{ marginBottom: 16 }}>
            <div className="skeleton-line" style={{ width: 180, height: 22, marginBottom: 20 }} />
            <div className="form-grid">
              <div className="skeleton-button" />
              <div className="skeleton-button" />
              <div className="skeleton-button" />
              <div className="skeleton-button" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

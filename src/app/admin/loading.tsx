export default function AdminLoading() {
  return (
    <div className="admin-page">
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton-line" style={{ width: 220, height: 28, marginBottom: 10 }} />
        <div className="skeleton-line" style={{ width: 170 }} />
      </div>

      <div className="admin-stat-grid">
        {[1, 2, 3].map((item) => (
          <div className="admin-card" key={item}>
            <div className="skeleton-line" style={{ width: 86, height: 40, marginBottom: 14 }} />
            <div className="skeleton-line" style={{ width: '70%' }} />
          </div>
        ))}
      </div>

      <div className="table-shell">
        <div className="table-head">
          <div className="skeleton-line" style={{ width: 180, height: 22 }} />
          <div className="skeleton-button" style={{ width: 120 }} />
        </div>
        <div style={{ padding: 22 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 120px',
                gap: 16,
                padding: '12px 0',
                borderBottom: '1px solid #f0eee8',
              }}
            >
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

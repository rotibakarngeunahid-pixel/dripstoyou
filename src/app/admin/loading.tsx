export default function AdminLoading() {
  return (
    <div style={{
      padding: '40px 24px', maxWidth: 1200, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header skeleton */}
      <div style={{ height: 32, width: 220, borderRadius: 8, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
      <div style={{ height: 16, width: 160, borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />

      {/* Cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16, marginTop: 16 }}>
        {[1,2,3].map((i) => (
          <div key={i} style={{
            background: 'white', border: '1px solid #DBDAD7', borderRadius: 16,
            padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)',
          }}>
            <div style={{ height: 40, width: 80, borderRadius: 8, marginBottom: 12, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
            <div style={{ height: 14, width: '70%', borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)', marginTop: 8 }}>
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #f0eeea', alignItems: 'center' }}>
            <div style={{ height: 14, flex: 1, borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
            <div style={{ height: 14, width: 100, borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

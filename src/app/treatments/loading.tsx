export default function TreatmentsLoading() {
  return (
    <div style={{ background: '#F3F0E7', minHeight: '100vh', paddingTop: 64 }}>
      {/* Hero skeleton */}
      <section style={{
        background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)',
        padding: '72px 24px 56px', textAlign: 'center',
      }}>
        <div style={{ height: 22, width: 160, borderRadius: 100, background: 'rgba(255,255,255,.12)', margin: '0 auto 20px' }} />
        <div style={{ height: 48, width: '40%', minWidth: 200, borderRadius: 8, background: 'rgba(255,255,255,.1)', margin: '0 auto 16px' }} />
        <div style={{ height: 20, width: '50%', minWidth: 240, borderRadius: 6, background: 'rgba(255,255,255,.08)', margin: '0 auto 28px' }} />
        <div style={{ height: 48, width: 160, borderRadius: 10, background: 'rgba(255,255,255,.12)', margin: '0 auto' }} />
      </section>

      {/* Products grid skeleton */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(32,82,81,0.08)', border: '1px solid rgba(32,82,81,0.06)',
            }}>
              <div style={{ height: 200, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 24, width: '60%', borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                <div style={{ height: 16, width: '90%', borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                <div style={{ height: 16, width: '75%', borderRadius: 6, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                  <div style={{ height: 44, flex: 1, borderRadius: 8, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                  <div style={{ height: 44, flex: 1, borderRadius: 8, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

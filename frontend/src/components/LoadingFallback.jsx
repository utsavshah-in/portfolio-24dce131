export default function LoadingFallback({ message = 'Loading page content…', minHeight = '50vh' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-fallback-container"
      style={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '32px 16px',
        width: '100%',
      }}
    >
      <div className="portfolio-spinner" aria-hidden="true" />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>
          {message}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          Code-split chunk requested via React.lazy()
        </p>
      </div>
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
        {message}
      </span>
    </div>
  );
}

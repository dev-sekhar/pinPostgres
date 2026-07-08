'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#09090b', color: '#f4f4f5' }}>
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem', background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>Critical Error</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>
              A critical application error has occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => reset()}
              style={{ padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

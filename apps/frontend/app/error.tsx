'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Unhandled React Error:', error);
  }, [error]);

  return (
    <div className="container center-screen">
      <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--error-color)' }}>Something went wrong!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          An unexpected error has occurred. We've been notified and are looking into it.
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

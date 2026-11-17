'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Last-resort boundary: replaces the root layout, so global styles may not
 * apply — everything here is inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffaf2',
          color: '#33251d',
          fontFamily: "Nunito, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: '32rem', padding: '2rem', textAlign: 'center' }}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            role="img"
            aria-label="Speeko the fox, a little disappointed"
            style={{ margin: '0 auto', display: 'block' }}
          >
            <path d="M22 48 27 12q1-4 5 0l17 21Z" fill="#ef6a1c" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
            <path d="M98 48 93 12q-1-4-5 0L71 33Z" fill="#ef6a1c" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
            <ellipse cx="60" cy="66" rx="38" ry="34" fill="#ef6a1c" stroke="#a8420f" strokeWidth="3" />
            <ellipse cx="60" cy="82" rx="22" ry="17" fill="#fff4e4" />
            <path d="M36 55l14 5" stroke="#8a3a12" strokeWidth="3" strokeLinecap="round" />
            <path d="M84 55l-14 5" stroke="#8a3a12" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="45" cy="64" rx="4.5" ry="5.5" fill="#2d1f18" />
            <ellipse cx="75" cy="64" rx="4.5" ry="5.5" fill="#2d1f18" />
            <path d="M50 92q10-7 20 0" fill="none" stroke="#5c2a12" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          <h1
            style={{
              margin: '1rem 0 0.5rem',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#241a14',
            }}
          >
            Something broke
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#715845' }}>
            Speeko hit an unexpected error. You can retry, or head back home.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: 'pointer',
                border: 'none',
                borderRadius: '1rem',
                background: '#1f741d',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '1rem',
                border: '2px solid #f9e7d1',
                background: '#ffffff',
                color: '#5a4535',
                padding: '0.75rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              Back home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

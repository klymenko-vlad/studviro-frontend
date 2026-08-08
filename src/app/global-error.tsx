'use client';

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, where
 * no locale, no providers and no translations are available. It therefore renders
 * its own `<html>`/`<body>` and hard-codes English — anything it depended on
 * could be the very thing that failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: '40ch', opacity: 0.7 }}>
          The application failed to start. Please reload the page.
        </p>
        {error.digest ? (
          <code style={{ fontSize: '0.75rem', opacity: 0.6 }}>{error.digest}</code>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid currentColor',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

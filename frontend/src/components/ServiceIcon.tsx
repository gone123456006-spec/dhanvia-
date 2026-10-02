/**
 * ServiceIcon
 * Renders a contextual SVG icon based on the service `kind` prop.
 */
export function ServiceIcon({ kind }: { kind: string }) {
  if (kind === 'compliance') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M17 8h21l10 10v32H17z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M38 8v11h10M23 28h18M23 35h12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="m39 44 5 5 10-12" fill="none" stroke="#f2a32b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'fund') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M12 50V36h9v14M28 50V27h9v23M44 50V16h9v34" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="m12 29 13-9 10 4 17-14" fill="none" stroke="#f2a32b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M47 10h6v6" fill="none" stroke="#f2a32b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'loan') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="m9 28 23-18 23 18M15 26v27h34V26M26 53V37h12v16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="18" r="10" fill="#f2a32b" />
        <path d="M48 12v12m4-9c-1-3-8-3-8 1 0 4 8 2 8 6 0 3-6 4-9 1" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  // Default: Insurance icon
  return (
    <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
      <path d="M32 7 52 15v14c0 13-8 22-20 29C20 51 12 42 12 29V15z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m22 31 7 7 14-16" fill="none" stroke="#f2a32b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

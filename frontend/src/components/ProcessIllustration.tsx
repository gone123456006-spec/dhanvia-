/**
 * ProcessIllustration
 * Renders a step illustration SVG based on the registration step `kind` prop.
 */
export function ProcessIllustration({ kind }: { kind: string }) {
  if (kind === 'form') {
    return (
      <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
        <circle cx="119" cy="91" r="75" fill="#f3f5f8" />
        <path d="M31 149c4-33 21-49 43-49s38 16 42 49" fill="#ffc400" />
        <circle cx="74" cy="70" r="22" fill="#f4b38e" />
        <path d="M51 68c1-24 38-35 48-5-11-5-25-7-48 5Z" fill="#183858" />
        <rect x="99" y="30" width="112" height="125" rx="13" fill="#fff" stroke="#e4e8ef" strokeWidth="3" />
        <circle cx="122" cy="51" r="10" fill="#ffbf00" />
        <path d="M118 51h8m-4-4v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M140 48h45M112 75h83M112 96h83M112 117h83" stroke="#d6dce5" strokeWidth="7" strokeLinecap="round" />
        <rect x="112" y="133" width="75" height="11" rx="5" fill="#ffbf00" />
      </svg>
    )
  }

  if (kind === 'documents') {
    return (
      <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
        <circle cx="117" cy="92" r="76" fill="#f3f5f8" />
        <path d="M47 151c4-31 18-47 37-47s33 16 37 47" fill="#ffc400" />
        <circle cx="83" cy="70" r="20" fill="#f4b38e" />
        <path d="M63 69c3-22 37-30 43-2-13-7-25-6-43 2Z" fill="#183858" />
        <rect x="122" y="25" width="80" height="128" rx="12" fill="#fff" stroke="#e4e8ef" strokeWidth="3" />
        <path d="M139 51h42M139 84h27M139 117h32" stroke="#cfd6e0" strokeWidth="7" strokeLinecap="round" />
        <circle cx="185" cy="51" r="9" fill="#ffbf00" />
        <path d="m181 51 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="185" cy="84" r="9" fill="#ffbf00" />
        <path d="m181 84 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="185" cy="117" r="9" fill="#ffbf00" />
        <path d="m181 117 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'payment') {
    return (
      <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
        <circle cx="120" cy="92" r="76" fill="#f3f5f8" />
        <rect x="42" y="73" width="156" height="82" rx="18" fill="#f47b16" />
        <path d="M42 91c0-16 12-28 28-28h103c14 0 25 11 25 25v12h-39c-14 0-24 10-24 23s10 23 24 23h39v9H60c-10 0-18-8-18-18Z" fill="#ff9b21" />
        <path d="M165 101h33v41h-33c-12 0-21-9-21-20s9-21 21-21Z" fill="#183858" />
        <circle cx="166" cy="122" r="5" fill="#ffcf38" />
        <circle cx="87" cy="61" r="23" fill="#ffc400" />
        <circle cx="87" cy="61" r="15" fill="#ffdd68" />
        <path d="M87 52v18m6-14c-2-4-12-4-12 1 0 7 13 2 13 9 0 5-10 7-15 2" fill="none" stroke="#a95c00" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="112" cy="61" rx="20" ry="8" fill="#ffbd18" />
        <path d="M92 61v17c0 5 9 8 20 8s20-3 20-8V61" fill="#ffc928" />
        <ellipse cx="112" cy="78" rx="20" ry="8" fill="#ffb20c" />
      </svg>
    )
  }

  // Default: Certificate illustration
  return (
    <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
      <circle cx="120" cy="93" r="76" fill="#f3f5f8" />
      <rect x="80" y="35" width="82" height="105" rx="9" fill="#fff" stroke="#e4e8ef" strokeWidth="3" />
      <path d="M96 58h50M96 70h39" stroke="#cfd6e0" strokeWidth="5" strokeLinecap="round" />
      <path d="m109 101 13 12 23-28" fill="none" stroke="#ffb900" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M87 140h68" stroke="#183858" strokeWidth="5" strokeLinecap="round" />
      <circle cx="59" cy="76" r="17" fill="#f4b38e" />
      <path d="M42 76c1-18 30-27 36-3-9-4-20-4-36 3Z" fill="#183858" />
      <path d="M35 145c3-30 12-46 25-46s23 16 26 46" fill="#183858" />
      <circle cx="184" cy="76" r="17" fill="#f4b38e" />
      <path d="M167 76c1-18 30-27 36-3-9-4-20-4-36 3Z" fill="#ffc400" />
      <path d="M158 145c3-30 12-46 26-46s22 16 25 46" fill="#ffc400" />
      <path d="m78 119 16 8m68-8-13 8" stroke="#f4b38e" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

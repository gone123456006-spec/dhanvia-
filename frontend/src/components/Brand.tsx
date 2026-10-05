/**
 * Brand
 * The Dhanvia logo / wordmark used in the header and footer.
 */
interface BrandProps {
  homeHref?: string
}

export function Brand({ homeHref = '/' }: BrandProps) {
  return (
    <a className="brand" href={homeHref} aria-label="Dhanvia home">
      <span className="brand-stack">
        <span className="brand-wordmark">Dhanvia</span>
        <span className="brand-tagline">Funding your next move.</span>
      </span>
    </a>
  )
}

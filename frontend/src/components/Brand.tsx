/**
 * Brand
 * The Dhanvia logo / wordmark used in the header and footer.
 */
interface BrandProps {
  homeHref?: string
}

export function Brand({ homeHref = '#top' }: BrandProps) {
  return (
    <a className="brand" href={homeHref} aria-label="Dhanvia home">
      <span className="brand-mark" aria-hidden="true">d</span>
      <span>dhanvia</span>
    </a>
  )
}

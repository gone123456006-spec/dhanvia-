import { Brand } from './Brand'

/**
 * SiteFooter
 * Page footer containing brand info, navigation links, and contact details.
 */
interface SiteFooterProps {
  isContactPage?: boolean
}

export function SiteFooter(_props: SiteFooterProps) {
  const homeAnchor = (anchor: string) => `/${anchor}`

  return (
    <footer className="footer" id="contact">
      <div className="footer-main section-wrap">
        <div className="footer-brand">
          <Brand homeHref="/" />
          <p>
            Everyday money,<br />with a little more heart.
          </p>
          <a className="footer-contact-cta" href="mailto:hello@dhanvia.example">
            <span className="footer-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M5 4h4l2 5-2.5 1.5a15 15 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
            </span>
            <span>
              <small>GET IN TOUCH</small>
              <strong>Talk to our team</strong>
            </span>
          </a>
        </div>

        <nav className="footer-company-links" aria-label="Company links">
          <h3>Company</h3>
          <a href={homeAnchor('#registration-process-title')}>Registration Process</a>
          <a href={homeAnchor('#company-services-title')}>Our Services</a>
          <a href="/services">All Service Categories</a>
          <a href={homeAnchor('#faq')}>Help &amp; Support</a>
        </nav>

        <div className="footer-contact-details">
          <h3>Get in Touch</h3>
          <a href="mailto:hello@dhanvia.example">
            <span aria-hidden="true">✉</span>
            hello@dhanvia.example
          </a>
        </div>
      </div>

      <div className="footer-bottom section-wrap">
        <span>© 2026 Dhanvia. All rights reserved.</span>
        <nav aria-label="Legal links">
          <a href={homeAnchor('#faq')}>Privacy Policy</a>
          <a href={homeAnchor('#faq')}>Account Delete Policy</a>
          <a href={homeAnchor('#faq')}>Terms of Service</a>
        </nav>
      </div>
    </footer>
  )
}

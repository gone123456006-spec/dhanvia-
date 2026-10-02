import { Brand } from './Brand'

/**
 * SiteFooter
 * Page footer containing brand info, navigation links, and contact details.
 */
export function SiteFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-main section-wrap">
        <div className="footer-brand">
          <Brand />
          <p>
            Everyday money,<br />with a little more heart.
          </p>
          <a className="footer-contact-cta" href="mailto:hello@dhanvia.example">
            <span aria-hidden="true">↗</span>
            <span>
              <small>GET IN TOUCH</small>
              <strong>Talk to our team</strong>
            </span>
          </a>
        </div>

        <nav className="footer-company-links" aria-label="Company links">
          <h3>Company</h3>
          <a href="#registration-process-title">Registration Process</a>
          <a href="#company-services-title">Our Services</a>
          <a href="#faq">Help &amp; Support</a>
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
          <a href="#faq">Privacy Policy</a>
          <a href="#faq">Account Delete Policy</a>
          <a href="#faq">Terms of Service</a>
        </nav>
      </div>
    </footer>
  )
}

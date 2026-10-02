import { useState } from 'react'
import { Brand } from './Brand'

/**
 * SiteHeader
 * Sticky top navigation bar with responsive hamburger menu and a CTA button.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span /><span />
        </button>

        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <a href="#top" onClick={closeMenu}>Home</a>
          <a href="#registration-process-title" onClick={closeMenu}>About</a>
          <a href="#company-services-title" onClick={closeMenu}>Services</a>
          <a href="#faq" onClick={closeMenu}>FAQs</a>
          <a href="#contact" onClick={closeMenu}>Contact Us</a>
        </nav>

        <div className="header-actions">
          <a className="talk-button" href="#contact">
            <span className="talk-label">Let's Talk</span>
            <span className="talk-accent" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  )
}

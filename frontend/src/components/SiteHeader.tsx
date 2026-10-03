import { useRef, useState } from 'react'
import { serviceMegaMenus } from '../constants/data'
import { Brand } from './Brand'

interface SiteHeaderProps {
  onSelectService: (service: string, menu: string, category: string) => void
  isContactPage: boolean
  isRegistrationPage: boolean
}

/**
 * SiteHeader
 * Sticky top navigation bar with responsive hamburger menu and a CTA button.
 */
export function SiteHeader({ onSelectService, isContactPage, isRegistrationPage }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)
  const registrationMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeCategories, setActiveCategories] = useState<Record<string, string>>(() =>
    Object.fromEntries(serviceMegaMenus.map(({ label, categories, defaultCategory }) => [
      label,
      defaultCategory ?? categories[0].category,
    ])),
  )

  function closeMenu() {
    setMenuOpen(false)
    setActiveMegaMenu(null)
    if (registrationMenuCloseTimer.current) {
      clearTimeout(registrationMenuCloseTimer.current)
      registrationMenuCloseTimer.current = null
    }
  }

  function openMegaMenu(label: string) {
    if (registrationMenuCloseTimer.current) {
      clearTimeout(registrationMenuCloseTimer.current)
      registrationMenuCloseTimer.current = null
    }
    setActiveMegaMenu(label)
  }

  function scheduleMegaMenuClose() {
    if (window.matchMedia('(max-width: 850px)').matches) return
    registrationMenuCloseTimer.current = setTimeout(() => {
      setActiveMegaMenu(null)
      registrationMenuCloseTimer.current = null
    }, 250)
  }

  function handleMegaMenuClick(event: React.MouseEvent<HTMLAnchorElement>, label: string) {
    if (window.matchMedia('(max-width: 850px)').matches) {
      event.preventDefault()
      setActiveMegaMenu(activeMegaMenu === label ? null : label)
      return
    }
    closeMenu()
  }

  function handleServiceSelect(service: string) {
    const category = activeCategories[activeMegaMenu ?? ''] ?? ''
    onSelectService(service, activeMegaMenu ?? '', category)
    closeMenu()
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
          <a href={isContactPage ? '/' : '#top'} onClick={closeMenu}>Home</a>
          {serviceMegaMenus.map(({ label, href, categories }) => {
            const activeCategory = categories.find(
              ({ category }) => category === activeCategories[label],
            ) ?? categories[0]

            return (
              <div
                className={`registration-nav-item${activeMegaMenu === label ? ' is-open' : ''}`}
                key={label}
                onMouseEnter={() => openMegaMenu(label)}
                onMouseLeave={scheduleMegaMenuClose}
              >
                <a
                  href={`${isContactPage || isRegistrationPage ? '/' : ''}${href}`}
                  aria-haspopup="true"
                  onClick={(event) => handleMegaMenuClick(event, label)}
                >
                  {label}
                </a>
                <div className="registration-mega-menu">
                  <div className="registration-mega-menu-inner">
                    <nav className="registration-mega-categories" aria-label={`${label} categories`}>
                      {categories.map(({ category }) => (
                        <button
                          className={activeCategory.category === category ? 'active' : ''}
                          type="button"
                          aria-pressed={activeCategory.category === category}
                          key={category}
                          onClick={() => setActiveCategories((current) => ({ ...current, [label]: category }))}
                        >
                          {category}
                        </button>
                      ))}
                    </nav>
                    <div className="registration-mega-services" aria-label={activeCategory.category}>
                      {activeCategory.services.map((service) => (
                        <button
                          type="button"
                          key={service}
                          onClick={() => handleServiceSelect(service)}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <a href={isContactPage ? '/#company-services-title' : '#company-services-title'} onClick={closeMenu}>Services</a>
          <a href="/contact" onClick={closeMenu}>Contact Us</a>
        </nav>

        <div className="header-actions">
          <a className="talk-button" href="/contact">
            <span className="talk-label">Let's Talk</span>
            <span className="talk-accent" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  )
}

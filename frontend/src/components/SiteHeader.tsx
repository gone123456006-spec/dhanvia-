import { useRef, useState } from 'react'
import { contactPhone, serviceMegaMenus } from '../constants/data'
import { getServiceCategoryPath } from '../constants/serviceCategoryPages'
import { Brand } from './Brand'
type NavigationIconName = 'home' | 'registration' | 'compliance' | 'ipr' | 'taxation' | 'services' | 'contact'

const navigationIconPaths: Record<NavigationIconName, string[]> = {
  home: ['M3 10.5 12 3l9 7.5', 'M5.5 9v11h13V9', 'M9.5 20v-6h5v6'],
  registration: ['M6 3h9l4 4v14H6z', 'M14 3v5h5', 'M9 12h6', 'M9 16h6'],
  compliance: ['M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', 'm9 12 2 2 4-4'],
  ipr: ['M9 18h6', 'M10 21h4', 'M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.2 1.5-1.3 2.5h-4.4c-.1-1-.5-1.9-1.3-2.5Z', 'M12 6v4', 'M10 8h4'],
  taxation: ['M5 3h14v18H5z', 'M8 7h8', 'M8 11h2', 'M14 11h2', 'M8 15h2', 'M14 15h2', 'M8 18h8'],
  services: ['M3 8h18v12H3z', 'M8 8V5h8v3', 'M3 13h18', 'M10 13v2h4v-2'],
  contact: ['M5 4h4l2 5-2.5 1.5a15 15 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z'],
}

function NavigationIcon({ name }: { name: NavigationIconName }) {
  return (
    <svg className="nav-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {navigationIconPaths[name].map((path) => <path d={path} key={path} />)}
    </svg>
  )
}

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
          className={menuOpen ? 'menu-toggle is-open' : 'menu-toggle'}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span /><span />
        </button>

        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <a href="/" onClick={closeMenu}>
            <NavigationIcon name="home" />
            <span>Home</span>
          </a>
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
                  <NavigationIcon name={label === 'Registrations' ? 'registration' : label.toLowerCase() as NavigationIconName} />
                  <span>{label}</span>
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
                      <a
                        className="registration-category-guide-link"
                        href={getServiceCategoryPath(label, activeCategory.category)}
                        onClick={closeMenu}
                      >
                        View {activeCategory.category} guide
                      </a>
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
          <a href="/services" onClick={closeMenu}>
            <NavigationIcon name="services" />
            <span>Services</span>
          </a>
          <a href="/contact" onClick={closeMenu}>
            <NavigationIcon name="contact" />
            <span>Contact Us</span>
          </a>
        </nav>

        <div className="header-actions">
          <a className="talk-button" href={`tel:${contactPhone.tel}`} aria-label={`Let's Talk: call ${contactPhone.display}`} title={`Call ${contactPhone.display}`}>
            Let's Talk
          </a>
        </div>
      </div>
    </header>
  )
}

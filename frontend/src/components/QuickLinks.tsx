import type { ReactNode } from 'react'

interface QuickLink {
  title: string
  description: string
  href: string
  badge?: string
  icon: ReactNode
}

const accent = '#ffd166'

const quickLinks: QuickLink[] = [
  {
    title: 'Loans',
    description: 'Home, personal, business and property loans',
    href: '/services#loans',
    icon: (
      <>
        <circle cx="31" cy="15" r="9" fill={accent} stroke="none" />
        <circle cx="24" cy="17" r="9" />
        <path d="M21 13h6M21 16h6M24 16l-3 5M21 13c3 0 4.5 1.4 4.5 3" />
        <path d="M6 34h7l6 3h8a2 2 0 0 0 0-4h-6M13 31l5-2h4M27 35l9-5a2 2 0 0 1 2.6 3L30 41H13" />
      </>
    ),
  },
  {
    title: 'Insurance',
    description: 'Health, life, car and bike cover for your family',
    href: '/services#insurance',
    icon: (
      <>
        <circle cx="33" cy="32" r="8" fill={accent} stroke="none" />
        <path d="M24 5 9 11v10c0 9.5 6.4 17.6 15 21 8.6-3.4 15-11.5 15-21V11L24 5Z" />
        <path d="m17.5 23.5 4.5 4.5 8.5-9" />
      </>
    ),
  },
  {
    title: 'Mutual Funds',
    description: 'Equity, debt, hybrid funds and monthly SIPs',
    href: '/services#mutual-funds',
    icon: (
      <>
        <circle cx="13" cy="12" r="7" fill={accent} stroke="none" />
        <path d="M10 10h6M10 13h6M13 13l-3 4M10 10c3 0 4 1.2 4 3" />
        <path d="M8 41V31h5v10M17 41V26h5v15M26 41V21h5v20M35 41V12" />
        <path d="m31 16 4-5 4 5" />
        <path d="M5 41h38" />
      </>
    ),
  },
  {
    title: 'Company Registration',
    description: 'Private Limited, LLP, OPC and other business setups',
    href: '/company-registration',
    badge: 'New business?',
    icon: (
      <>
        <circle cx="34" cy="14" r="8" fill={accent} stroke="none" />
        <path d="M8 42V12l16-6v36M24 18h14v24" />
        <path d="M13 16h5M13 22h5M13 28h5M29 24h4M29 30h4M5 42h38M14 42v-6h4v6" />
      </>
    ),
  },
  {
    title: 'GST & Income Tax',
    description: 'GST registration, returns and income tax filing',
    href: '/registration-details?category=GST',
    icon: (
      <>
        <circle cx="14" cy="34" r="8" fill={accent} stroke="none" />
        <path d="M12 5h20l6 6v32H12z" />
        <path d="M32 5v6h6M18 17h14M18 23h14M18 29h8" />
        <circle cx="31" cy="35" r="3" />
        <path d="m17 38 6-7" />
      </>
    ),
  },
  {
    title: 'Trademark & IPR',
    description: 'Protect your brand name, logo, designs and ideas',
    href: '/registration-details?category=Trademark%20Registration',
    icon: (
      <>
        <circle cx="32" cy="14" r="8" fill={accent} stroke="none" />
        <circle cx="22" cy="19" r="12" />
        <path d="M16 15h7M19.5 15v9M25 24v-9l2.5 4 2.5-4v9" />
        <path d="m15 29-4 13 6-3 4 4 2-11M29 29l4 13-6-3-4 4" />
      </>
    ),
  },
  {
    title: 'Compliance',
    description: 'ROC filings and your yearly compliance calendar',
    href: '/registration-details?category=Compliance',
    icon: (
      <>
        <rect x="6" y="9" width="30" height="28" rx="3" />
        <path d="M6 17h30M14 5v8M28 5v8" />
        <circle cx="34" cy="34" r="9" fill={accent} />
        <path d="M34 29v5l3 2" />
      </>
    ),
  },
]

/**
 * QuickLinks
 * Row of icon shortcuts to the main services, shown above the registration offer.
 */
export function QuickLinks() {
  return (
    <nav className="quick-links" aria-label="Popular services">
      <ul className="quick-links-list section-wrap">
        {quickLinks.map(({ title, description, href, badge, icon }) => (
          <li key={title}>
            <a href={href}>
              <svg className="quick-links-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">{icon}</svg>
              <strong>{title}</strong>
              {badge && <span className="quick-links-badge">{badge}</span>}
              <span className="quick-links-text">{description}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

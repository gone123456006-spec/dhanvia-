import { contactEmail, contactPhone, officeAddress } from '../constants/data'
import { callIconPath, whatsappIconPath } from '../constants/socialIcons'
import { Brand } from './Brand'
import { SocialIconLinks } from './SocialIconLinks'

/**
 * SiteFooter
 * Page footer containing brand info, navigation links, and contact details.
 */
interface SiteFooterProps {
  isContactPage?: boolean
}

const registrationHref = (category: string, service?: string) => {
  const path = category === 'Company Registration' ? '/company-registration' : '/registration-details'
  const query = new URLSearchParams({ category })
  if (service) query.set('service', service)
  return `${path}?${query}`
}

const footerColumns: { title: string; links: [label: string, href: string][] }[][] = [
  [
    {
      title: 'Money Services',
      links: [
        ['Loans', '/services#loans'],
        ['Insurance', '/services#insurance'],
        ['Mutual Funds', '/services#mutual-funds'],
        ['All Services', '/services'],
      ],
    },
  ],
  [
    {
      title: 'Business Services',
      links: [
        ['Company Registration', registrationHref('Company Registration')],
        ['GST Registration and Returns', registrationHref('GST')],
        ['Income Tax Filing', registrationHref('Income Tax')],
        ['Trademark Registration', registrationHref('Trademark Registration')],
        ['Compliance and ROC Filings', registrationHref('Compliance')],
        ['FSSAI Registration', registrationHref('FSSAI Registration')],
      ],
    },
    {
      title: 'For Startups',
      links: [
        ['Private Limited Company', registrationHref('Company Registration', 'Private Limited Company')],
        ['LLP Registration', registrationHref('Company Registration', 'LLP registration')],
        ['One Person Company', registrationHref('Company Registration', 'One Person Company')],
      ],
    },
  ],
  [
    {
      title: 'Dhanvia',
      links: [
        ['Home', '/'],
        ['Registration Process', '/#registration-process-title'],
        ['Our Services', '/services'],
        ['FAQs', '/#faq'],
        ['Contact Us', '/contact'],
      ],
    },
  ],
]

export function SiteFooter(_props: SiteFooterProps) {
  return (
    <footer className="footer" id="contact">
      <div className="footer-main section-wrap">
        <div className="footer-brand">
          <Brand homeHref="/" />
          <address className="footer-contact-list">
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 11 12 4l9 7M5 9.5V20h5v-6h4v6h5V9.5" /></svg>
              <p>{officeAddress.map((line) => <span key={line}>{line}</span>)}</p>
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4h4l2 5-2.5 1.5a15 15 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
              <div>
                <strong>Customer Queries</strong>
                <a href={`tel:${contactPhone.tel}`}>Ph. {contactPhone.display}</a>
                <a href={`https://wa.me/${contactPhone.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              </div>
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-2v-6h4M4 12v4a2 2 0 0 0 2 2h2v-6H4M16 18v1a2 2 0 0 1-2 2h-2" /></svg>
              <div>
                <strong>General Enquiries</strong>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                <a href="/contact">Send us a message</a>
              </div>
            </div>
          </address>
        </div>

        {footerColumns.map((groups) => (
          <div className="footer-column" key={groups[0].title}>
            {groups.map(({ title, links }) => (
              <nav className="footer-link-group" aria-label={title} key={title}>
                <h3>{title}</h3>
                {links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
              </nav>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom section-wrap">
        <span>Copyright © {new Date().getFullYear()} Dhanvia. All rights reserved.</span>
        <nav className="footer-social" aria-label="Contact Dhanvia and follow us">
          <SocialIconLinks />
          <a
            href={`https://wa.me/${contactPhone.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp ${contactPhone.display}`}
            title="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={whatsappIconPath} /></svg>
          </a>
          <a href={`tel:${contactPhone.tel}`} aria-label={`Call ${contactPhone.display}`} title={`Call ${contactPhone.display}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={callIconPath} /></svg>
          </a>
        </nav>
      </div>
    </footer>
  )
}

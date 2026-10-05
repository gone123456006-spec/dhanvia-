import { useState } from 'react'
import { registrationServiceCategories, selectableRegistrationServices } from '../constants/data'
import { useLeadSubmission } from '../hooks/useLeadSubmission'
import { HoneypotField } from './HoneypotField'

interface RegistrationOfferProps {
  /** Allows the ServiceCatalog to pre-select a service in this form. */
  selectedService: string
  onServiceChange: (service: string) => void
}

/**
 * RegistrationOffer
 * Displays the company registration pricing pitch alongside a consultation
 * sign-up form. Supports an externally controlled service selection so the
 * ServiceCatalog "Apply" buttons can pre-fill the form.
 */
export function RegistrationOffer({ selectedService, onServiceChange }: RegistrationOfferProps) {
  const { state, message, handleSubmit } = useLeadSubmission('home-offer')

  return (
    <section className="registration-offer" aria-labelledby="registration-offer-pitch">
      <div className="registration-offer-inner">
        <div className="registration-offer-content">
          <div className="registration-offer-copy">
            <p className="registration-offer-pitch" id="registration-offer-pitch">
              Get your Private Limited Company Registration in just <strong>7 days</strong> at{' '}
              <em>Rs.1,999/-</em> only.
            </p>
            <ul className="registration-benefits">
              <li><span aria-hidden="true" />2 DIN and DSC for two Directors</li>
              <li><span aria-hidden="true" />Registration fees and stamp duty</li>
              <li><span aria-hidden="true" />Company PAN and TAN</li>
              <li><span aria-hidden="true" />Drafting of MoA &amp; AoA</li>
              <li><span aria-hidden="true" />Company Incorporation Certificate</li>
              <li><span aria-hidden="true" />Company name approval and reservation</li>
              <li><span aria-hidden="true" />MCA SPICe+ incorporation filing</li>
              <li><span aria-hidden="true" />Corporate Identification Number (CIN) allotment</li>
              <li><span aria-hidden="true" />Post-incorporation compliance guidance</li>
            </ul>
          </div>

          <form
            id="registration-consultation-form"
            className="registration-consultation-form"
            onSubmit={handleSubmit}
          >
            <HoneypotField />
            <h3>Choose your business structure and get started with your company registration</h3>

            <label htmlFor="consultation-name">Full Name*</label>
            <input
              id="consultation-name"
              name="name"
              type="text"
              placeholder="Enter Your Name"
              autoComplete="name"
              required
            />

            <label htmlFor="consultation-phone">Phone Number*</label>
            <div className="consultation-phone-field">
              <select aria-label="Country calling code" name="callingCode" defaultValue="+91">
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
              </select>
              <input
                id="consultation-phone"
                name="phone"
                type="tel"
                placeholder="Enter your PhoneNo."
                autoComplete="tel-national"
                inputMode="tel"
                required
              />
            </div>

            <label htmlFor="consultation-service">Service*</label>
            <select
              className="consultation-service-select"
              id="consultation-service"
              name="service"
              value={selectedService}
              onChange={(event) => onServiceChange(event.target.value)}
              required
            >
              <option value="" disabled>-Select-</option>
              {selectableRegistrationServices.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>

            <label htmlFor="consultation-email">Enter Your Email*</label>
            <input
              id="consultation-email"
              name="email"
              type="email"
              placeholder="Enter your Email"
              autoComplete="email"
              required
            />

            <button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? 'Submitting…' : 'Claim your Free Consultation'}
            </button>
            {message && (
              <p className={`consultation-submit-status ${state}`} role={state === 'error' ? 'alert' : 'status'}>
                {message}
              </p>
            )}
            <p className="consultation-consent">
              By clicking, you consent to receiving updates about our services as outlined in our{' '}
              <span>Privacy Statement.</span>
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

// ─── ServiceCatalog ───────────────────────────────────────────────────────────

interface ServiceCatalogProps {
  onApply: (service: string) => void
}

/**
 * ServiceCatalog
 * Tabbed catalog of all registration services. Clicking "Apply" pre-fills
 * the consultation form and smoothly scrolls to it.
 */
export function ServiceCatalog({ onApply }: ServiceCatalogProps) {
  const [activeCategory, setActiveCategory] = useState(registrationServiceCategories[0].category)
  const activeList = registrationServiceCategories.find(({ category }) => category === activeCategory)
    ?? registrationServiceCategories[0]

  function handleApply(service: string) {
    onApply(service)
    document.getElementById('registration-consultation-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <section className="service-catalog" id="service-catalog" aria-label="Browse business services">
      <div className="service-catalog-shell">
        <nav className="service-category-list" role="tablist" aria-label="Service categories">
          {registrationServiceCategories.map(({ category }) => (
            <button
              className={activeCategory === category ? 'service-category active' : 'service-category'}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              aria-controls="service-catalog-panel"
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>
        <div
          className="service-catalog-content"
          id="service-catalog-panel"
          role="tabpanel"
          aria-label={activeList.category}
        >
          <div className="service-catalog-grid">
            {activeList.services.map((service) => (
              <article className="service-catalog-item" key={service}>
                <span>{service}</span>
                <button type="button" onClick={() => handleApply(service)}>
                  Apply
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'

const officeLocation = {
  city: 'Patna',
  address: 'Boring Road, Patna, Bihar, India',
  query: 'Boring Road, Patna, Bihar, India',
}

export function ConsultationPage() {
  const [messageLength, setMessageLength] = useState(0)
  const [submissionMessage, setSubmissionMessage] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmissionMessage('Support request submission is not connected yet.')
  }

  return (
    <section className="consultation-page" id="consultation-page" aria-label="Contact Us">
      <div className="consultation-support-hero">
        <div className="consultation-support-inner">
          <div className="consultation-support-copy">
            <p className="consultation-trust-badge">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 3 19 6v5c0 4.4-2.9 8-7 10-4.1-2-7-5.6-7-10V6l7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Trusted by 2 Lakh+ clients
            </p>
            <h1>Get Instant Support from Our Experts</h1>
            <p className="consultation-support-description">
              Chat with our team on WhatsApp or send us a quick message. We&apos;re here to help.
            </p>
          </div>

          <form className="support-request-form" onSubmit={handleSubmit}>
            <h2>Something Didn’t Go as Planned? Let’s Fix It Together.</h2>

            <label htmlFor="support-name">Name *</label>
            <input id="support-name" name="name" type="text" placeholder="Enter your full name" autoComplete="name" required />

            <div className="support-contact-fields">
              <div>
                <label htmlFor="support-email">Email *</label>
                <input id="support-email" name="email" type="email" placeholder="your.email@example.com" autoComplete="email" required />
              </div>
              <div>
                <label htmlFor="support-phone">Phone Number *</label>
                <input id="support-phone" name="phone" type="tel" placeholder="+91 9876543210" autoComplete="tel" inputMode="tel" required />
              </div>
            </div>

            <label htmlFor="support-message">Message *</label>
            <textarea
              id="support-message"
              name="message"
              placeholder="Message"
              minLength={30}
              maxLength={2000}
              required
              onChange={(event) => {
                setMessageLength(event.target.value.length)
                setSubmissionMessage('')
              }}
            />
            <div className="support-message-meta">
              <span>Minimum 30 characters are required.</span>
              <span>{messageLength}/2000</span>
            </div>

            <label className="support-sales-option">
              <input type="checkbox" name="salesConsultation" />
              <span>Request A Sales Consultation</span>
            </label>
            <p className="support-sales-description">
              Select this if you would like our sales team to reach out with more details on a service.
            </p>

            <button type="submit">Submit Support Request</button>
            {submissionMessage && <p className="support-submit-message" role="status">{submissionMessage}</p>}
            <p className="support-form-disclaimer">
              By submitting this form, you will be redirected to log in or create an account to track your support ticket.
            </p>
          </form>
        </div>
      </div>

      <section className="consultation-locations" aria-labelledby="consultation-locations-title">
        <div className="consultation-locations-inner">
          <h2 id="consultation-locations-title">Our Locations</h2>
          <div className="consultation-location-grid">
            <article className="consultation-location active">
                <h3>
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  Dhanvia - {officeLocation.city}
                </h3>
                <p>{officeLocation.address}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeLocation.query)}`} target="_blank" rel="noreferrer">
                  Open in Google Maps <span aria-hidden="true">→</span>
                </a>
            </article>
          </div>
          <div className="consultation-map-frame">
            <iframe
              title="Dhanvia Patna Boring Road map"
              src="https://maps.google.com/maps?q=Boring%20Road%2C%20Patna%2C%20Bihar%2C%20India&z=14&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </section>
  )
}

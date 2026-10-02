import { useEffect, useState } from 'react'
import './App.css'

const questions = [
  ['What are the rules for picking a name for a private limited company?', 'Choose a name that is distinct, available for registration, and does not conflict with existing company names or trademarks. The name must follow MCA guidelines and should not include restricted or misleading words.'],
  ['How much time is needed to set up a private limited company in India?', 'Registration often takes around 7 to 10 working days after the required documents are submitted. The timeline can vary depending on name approval and government processing.'],
  ['Do I need to be physically present during this process?', 'No. The registration process can be completed online. Directors can sign documents digitally and share the required information remotely.'],
  ['What documents are required to complete the process?', 'Directors generally need PAN, identity and address proof, photographs, and proof of the company’s registered office. Additional documents may be needed based on your application.'],
  ['Does a private limited company have continuous existence?', 'Yes. A private limited company is a separate legal entity with perpetual succession, so it continues to exist despite changes in its directors or shareholders.'],
]

const bannerSlides = [
  { src: '/IMG_0945.PNG', alt: 'Invest in mutual funds for a better tomorrow' },
  { src: '/IMG_0936.PNG', alt: 'Business compliance services' },
  { src: '/IMG_0947.PNG', alt: 'Home, personal, and business loan solutions' },
  { src: '/IMG_0953.PNG', alt: 'Insurance plans for a safer tomorrow' },
]

const registrationSteps = [
  { number: '01', title: 'Fill up the forms', kind: 'form' },
  { number: '02', title: 'Submit the Documents', kind: 'documents' },
  { number: '03', title: 'Pay Fees', kind: 'payment' },
  { number: '04', title: 'Get your Company Registered', kind: 'certificate' },
]

const companyServices = [
  { title: 'Compliance', kind: 'compliance' },
  { title: 'Mutual Fund', kind: 'fund' },
  { title: 'Loans', kind: 'loan' },
  { title: 'Insurance', kind: 'insurance' },
]

const registrationServiceCategories: { category: string; services: string[] }[] = [
  {
    category: 'Company Registration',
    services: [
      'Company Registration',
      'Private Limited Company',
      'LLP registration',
      'Public Limited Company',
      'Partnership Firm',
      'Sole Proprietorship',
      'One Person Company',
      'Startup India',
      'Startup',
      'Nidhi Company',
      'Microfinance Company',
      'Producer Company',
      'Indian Subsidiary',
      'Foreign Subsidiary Company',
      'Foreign Company',
    ],
  },
  { category: 'NGO', services: ['NGO Registration', 'Section 8 Company', 'Trust Registration', 'Society Registration'] },
  { category: 'Licenses & Certifications', services: ['Trademark Registration', 'MSME / Udyam Registration', 'Import Export Code', 'ISO Certification'] },
  { category: 'FSSAI Registration', services: ['Basic FSSAI Registration', 'State FSSAI License', 'Central FSSAI License', 'FSSAI Renewal'] },
  { category: 'Trade License', services: ['Trade License', 'Shop & Establishment License', 'Trade License Renewal'] },
  { category: 'BIS Registration', services: ['BIS / ISI Certification', 'CRS Registration', 'Hallmark Registration'] },
  { category: 'International Business Setup', services: ['Indian Subsidiary', 'Foreign Subsidiary Company', 'Branch Office', 'Liaison Office', 'Foreign Company'] },
  { category: 'Other Services', services: ['GST Registration', 'GST Return Filing', 'Accounting & Bookkeeping', 'Tax Filing'] },
]

const selectableRegistrationServices = Array.from(new Set(registrationServiceCategories.flatMap(({ services }) => services)))

function ServiceIcon({ kind }: { kind: string }) {
  if (kind === 'compliance') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M17 8h21l10 10v32H17z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M38 8v11h10M23 28h18M23 35h12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="m39 44 5 5 10-12" fill="none" stroke="#f2a32b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'fund') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M12 50V36h9v14M28 50V27h9v23M44 50V16h9v34" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="m12 29 13-9 10 4 17-14" fill="none" stroke="#f2a32b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M47 10h6v6" fill="none" stroke="#f2a32b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'loan') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="m9 28 23-18 23 18M15 26v27h34V26M26 53V37h12v16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="18" r="10" fill="#f2a32b" />
        <path d="M48 12v12m4-9c-1-3-8-3-8 1 0 4 8 2 8 6 0 3-6 4-9 1" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
      <path d="M32 7 52 15v14c0 13-8 22-20 29C20 51 12 42 12 29V15z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m22 31 7 7 14-16" fill="none" stroke="#f2a32b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProcessIllustration({ kind }: { kind: string }) {
  if (kind === 'form') {
    return (
      <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
        <circle cx="119" cy="91" r="75" fill="#f3f5f8" />
        <path d="M31 149c4-33 21-49 43-49s38 16 42 49" fill="#ffc400" />
        <circle cx="74" cy="70" r="22" fill="#f4b38e" />
        <path d="M51 68c1-24 38-35 48-5-11-5-25-7-48 5Z" fill="#183858" />
        <rect x="99" y="30" width="112" height="125" rx="13" fill="#fff" stroke="#e4e8ef" strokeWidth="3" />
        <circle cx="122" cy="51" r="10" fill="#ffbf00" />
        <path d="M118 51h8m-4-4v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M140 48h45M112 75h83M112 96h83M112 117h83" stroke="#d6dce5" strokeWidth="7" strokeLinecap="round" />
        <rect x="112" y="133" width="75" height="11" rx="5" fill="#ffbf00" />
      </svg>
    )
  }

  if (kind === 'documents') {
    return (
      <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
        <circle cx="117" cy="92" r="76" fill="#f3f5f8" />
        <path d="M47 151c4-31 18-47 37-47s33 16 37 47" fill="#ffc400" />
        <circle cx="83" cy="70" r="20" fill="#f4b38e" />
        <path d="M63 69c3-22 37-30 43-2-13-7-25-6-43 2Z" fill="#183858" />
        <rect x="122" y="25" width="80" height="128" rx="12" fill="#fff" stroke="#e4e8ef" strokeWidth="3" />
        <path d="M139 51h42M139 84h27M139 117h32" stroke="#cfd6e0" strokeWidth="7" strokeLinecap="round" />
        <circle cx="185" cy="51" r="9" fill="#ffbf00" />
        <path d="m181 51 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="185" cy="84" r="9" fill="#ffbf00" />
        <path d="m181 84 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="185" cy="117" r="9" fill="#ffbf00" />
        <path d="m181 117 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'payment') {
    return (
      <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
        <circle cx="120" cy="92" r="76" fill="#f3f5f8" />
        <rect x="42" y="73" width="156" height="82" rx="18" fill="#f47b16" />
        <path d="M42 91c0-16 12-28 28-28h103c14 0 25 11 25 25v12h-39c-14 0-24 10-24 23s10 23 24 23h39v9H60c-10 0-18-8-18-18Z" fill="#ff9b21" />
        <path d="M165 101h33v41h-33c-12 0-21-9-21-20s9-21 21-21Z" fill="#183858" />
        <circle cx="166" cy="122" r="5" fill="#ffcf38" />
        <circle cx="87" cy="61" r="23" fill="#ffc400" />
        <circle cx="87" cy="61" r="15" fill="#ffdd68" />
        <path d="M87 52v18m6-14c-2-4-12-4-12 1 0 7 13 2 13 9 0 5-10 7-15 2" fill="none" stroke="#a95c00" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="112" cy="61" rx="20" ry="8" fill="#ffbd18" />
        <path d="M92 61v17c0 5 9 8 20 8s20-3 20-8V61" fill="#ffc928" />
        <ellipse cx="112" cy="78" rx="20" ry="8" fill="#ffb20c" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 240 180" focusable="false" aria-hidden="true">
      <circle cx="120" cy="93" r="76" fill="#f3f5f8" />
      <rect x="80" y="35" width="82" height="105" rx="9" fill="#fff" stroke="#e4e8ef" strokeWidth="3" />
      <path d="M96 58h50M96 70h39" stroke="#cfd6e0" strokeWidth="5" strokeLinecap="round" />
      <path d="m109 101 13 12 23-28" fill="none" stroke="#ffb900" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M87 140h68" stroke="#183858" strokeWidth="5" strokeLinecap="round" />
      <circle cx="59" cy="76" r="17" fill="#f4b38e" />
      <path d="M42 76c1-18 30-27 36-3-9-4-20-4-36 3Z" fill="#183858" />
      <path d="M35 145c3-30 12-46 25-46s23 16 26 46" fill="#183858" />
      <circle cx="184" cy="76" r="17" fill="#f4b38e" />
      <path d="M167 76c1-18 30-27 36-3-9-4-20-4-36 3Z" fill="#ffc400" />
      <path d="M158 145c3-30 12-46 26-46s22 16 25 46" fill="#ffc400" />
      <path d="m78 119 16 8m68-8-13 8" stroke="#f4b38e" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

function RegistrationProcess() {
  return (
    <section className="registration-process" aria-labelledby="registration-process-title">
      <div className="registration-process-inner">
        <h2 id="registration-process-title">Registration</h2>
        <h3 className="registration-process-subheading">In 4 Easy Steps</h3>
        <p className="registration-process-description">From completing forms to receiving your certificate, our guided process keeps company registration clear, simple, and efficient.</p>
        <ol className="registration-process-steps" aria-label="Company registration steps" tabIndex={0}>
          {registrationSteps.map((step, index) => (
            <li className="registration-process-step" key={step.number}>
              <span className="registration-step-number">{step.number}</span>
              {index < registrationSteps.length - 1 && <span className="registration-step-arrow" aria-hidden="true">→</span>}
              <div className="registration-step-art"><ProcessIllustration kind={step.kind} /></div>
              <h3>{step.title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Brand() {
  return <a className="brand" href="#top" aria-label="Dhanvia home"><span className="brand-mark" aria-hidden="true">d</span><span>dhanvia</span></a>
}

function HeroBanner() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % bannerSlides.length)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section className="hero-carousel hero-carousel--static" aria-label="Featured banners" aria-roledescription="carousel">
      <div
        className="hero-carousel-track"
        style={{ translate: `${-activeSlide * (100 / bannerSlides.length)}% 0` }}
      >
        {bannerSlides.map((slide) => (
          <img
            className="hero-banner-image"
            src={slide.src}
            alt={slide.alt}
            width={2103}
            height={748}
            fetchPriority={slide === bannerSlides[0] ? 'high' : undefined}
            loading="eager"
            decoding="async"
            key={slide.src}
          />
        ))}
      </div>
    </section>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeServiceCategory, setActiveServiceCategory] = useState(registrationServiceCategories[0].category)
  const [selectedRegistrationService, setSelectedRegistrationService] = useState('')
  const activeServiceList = registrationServiceCategories.find(({ category }) => category === activeServiceCategory) ?? registrationServiceCategories[0]

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
          <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
            <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#registration-process-title" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#company-services-title" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQs</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact Us</a>
          </nav>
          <div className="header-actions">
            <a className="talk-button" href="#contact"><span className="talk-label">Let's Talk</span><span className="talk-accent" aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <main>
        <HeroBanner />
        <RegistrationProcess />

        <section className="registration-offer" aria-labelledby="registration-offer-pitch">
          <div className="registration-offer-inner">
            <div className="registration-offer-content">
              <div className="registration-offer-copy">
              <p className="registration-offer-pitch" id="registration-offer-pitch">
                Get your Private Limited Company Registration in just <strong>7 days</strong> at <em>Rs.1,999/-</em> only.
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
              </ul>
              </div>
              <form id="registration-consultation-form" className="registration-consultation-form" onSubmit={(event) => event.preventDefault()}>
                <h3>Choose your business structure and get started with your company registration</h3>
                <label htmlFor="consultation-name">Full Name*</label>
                <input id="consultation-name" name="name" type="text" placeholder="Enter Your Name" autoComplete="name" required />
                <label htmlFor="consultation-phone">Phone Number*</label>
                <div className="consultation-phone-field">
                  <select aria-label="Country calling code" name="callingCode" defaultValue="+91">
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+61">+61</option>
                  </select>
                  <input id="consultation-phone" name="phone" type="tel" placeholder="Enter your PhoneNo." autoComplete="tel-national" inputMode="tel" required />
                </div>
                <label htmlFor="consultation-service">Service*</label>
                <select className="consultation-service-select" id="consultation-service" name="service" value={selectedRegistrationService} onChange={(event) => setSelectedRegistrationService(event.target.value)} required>
                  <option value="" disabled>-Select-</option>
                  {selectableRegistrationServices.map((service) => <option key={service}>{service}</option>)}
                </select>
                <label htmlFor="consultation-email">Enter Your Email*</label>
                <input id="consultation-email" name="email" type="email" placeholder="Enter your Email" autoComplete="email" required />
                <button type="submit">Claim your Free Consultation</button>
                <p className="consultation-consent">By clicking, you consent to receiving updates about our services as outlined in our <span>Privacy Statement.</span></p>
              </form>
            </div>
          </div>
        </section>

        <section className="company-services" aria-labelledby="company-services-title">
          <div className="company-services-inner">
            <h2 id="company-services-title">Our Services</h2>
            <p className="company-services-intro">Practical support for every stage of running your business.</p>
            <div className="company-services-grid">
              {companyServices.map(({ title, kind }) => (
                <article className="company-service-item" key={title}>
                  <div className="company-service-icon"><ServiceIcon kind={kind} /></div>
                  <h3>{title}</h3>
                </article>
              ))}
            </div>
          </div>
          <section className="service-catalog" aria-label="Browse business services">
            <div className="service-catalog-shell">
              <nav className="service-category-list" role="tablist" aria-label="Service categories">
                {registrationServiceCategories.map(({ category }) => (
                  <button
                    className={activeServiceCategory === category ? 'service-category active' : 'service-category'}
                    type="button"
                    role="tab"
                    aria-selected={activeServiceCategory === category}
                    aria-controls="service-catalog-panel"
                    key={category}
                    onClick={() => setActiveServiceCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </nav>
              <div className="service-catalog-content" id="service-catalog-panel" role="tabpanel" aria-label={activeServiceList.category}>
                <div className="service-catalog-grid">
                  {activeServiceList.services.map((service) => (
                    <article className="service-catalog-item" key={service}>
                      <span>{service}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegistrationService(service)
                          document.getElementById('registration-consultation-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        Apply
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="faq" id="faq" aria-labelledby="faq-title">
          <div className="faq-inner section-wrap">
            <h2 className="faq-title" id="faq-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              {questions.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}<span aria-hidden="true" /></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="footer-main section-wrap">
          <div className="footer-brand">
            <Brand />
            <p>Everyday money,<br />with a little more heart.</p>
            <a className="footer-contact-cta" href="mailto:hello@dhanvia.example">
              <span aria-hidden="true">↗</span>
              <span><small>GET IN TOUCH</small><strong>Talk to our team</strong></span>
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
            <a href="mailto:hello@dhanvia.example"><span aria-hidden="true">✉</span>hello@dhanvia.example</a>
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
    </div>
  )
}

export default App

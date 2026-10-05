import { useState } from 'react'
import { selectableRegistrationServices } from '../constants/data'
import { companyRegistrationTypes, defaultRegistrationGuide, registrationGuides } from '../constants/registrationGuides'
import { registrationCategoryGuides } from '../constants/registrationCategoryGuides'
import { complianceCategoryGuides } from '../constants/complianceGuides'
import { iprTaxCategoryGuides } from '../constants/iprTaxGuides'
import { useLeadSubmission } from '../hooks/useLeadSubmission'
import { HoneypotField } from './HoneypotField'

interface RegistrationDetailPageProps {
  selectedService: string
  onServiceChange: (service: string) => void
  registrationCategory?: string
  pageTitleOverride?: string
}

const baseDetailTabs = ['Overview', 'Eligibility', 'Documents Required']
const comparisonTabCategories = new Set(['Company Registration', 'NGO', 'International Business Setup'])
const companyRegistrationHighlights = [
  'Company name search and reservation support',
  'Preparation and filing of incorporation forms',
  'MoA, AoA, PAN and TAN documentation',
  'Digital filing with the Ministry of Corporate Affairs',
  'Guidance through registration and CIN allotment',
]

function RegistrationLeadForm({
  selectedService,
  onServiceChange,
  formId,
  compact = false,
}: RegistrationDetailPageProps & { formId: string; compact?: boolean }) {
  const { state, message, handleSubmit } = useLeadSubmission(compact ? 'service-detail' : 'service-detail-hero')

  return (
    <form
      className={compact ? 'registration-detail-form compact' : 'registration-detail-form'}
      id={formId}
      onSubmit={handleSubmit}
    >
      <HoneypotField />
      <h2>{compact ? "Talk To Our Experts We're Here To Help You" : 'Choose your business structure and get started with your company registration'}</h2>
      <label htmlFor={`${formId}-name`}>Full Name*</label>
      <input id={`${formId}-name`} name="name" type="text" placeholder="Enter Your Name" autoComplete="name" required />

      <label htmlFor={`${formId}-phone`}>Phone Number*</label>
      <input id={`${formId}-phone`} name="phone" type="tel" placeholder="+91 9876543210" autoComplete="tel" inputMode="tel" required />

      <label htmlFor={`${formId}-service`}>Service*</label>
      <select
        id={`${formId}-service`}
        name="service"
        value={selectedService}
        onChange={(event) => onServiceChange(event.target.value)}
        required
      >
        <option value="" disabled>-Select-</option>
        {selectableRegistrationServices.map((service) => <option key={service}>{service}</option>)}
      </select>

      <label htmlFor={`${formId}-email`}>Email*</label>
      <input id={`${formId}-email`} name="email" type="email" placeholder="Enter your Email" autoComplete="email" required />
      <button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Submitting…' : 'Claim your Free Consultation'}
      </button>
      {message && (
        <p className={`registration-detail-submit-status ${state}`} role={state === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
      <p className="registration-detail-consent">
        By clicking, you consent to receiving updates about our services as outlined in our Privacy Statement.
      </p>
    </form>
  )
}

const categoryServiceAliases: Record<string, Record<string, string>> = {
  NGO: {
    'Section 8 Company': 'Section 8 Company',
    'Trust Registration': 'Public Charitable Trust',
    'Society Registration': 'Society',
  },
  'Compliance Calendar': {
    'Company Compliance Calendar': 'Company Compliance Calendar',
    'LLP Compliance Calendar': 'LLP Compliance Calendar',
    'Annual Filing Calendar': 'Annual Filing Calendar',
  },
  Compliance: {
    'LLP Annual Compliance': 'LLP Annual Compliance',
    'Annual Compliance for Private Limited Company': 'Private Limited Company Compliance',
    'Sole Proprietorship Compliance': 'Sole Proprietorship Compliance',
    'Outsource Bookkeeping Services': 'Bookkeeping and Accounting',
    'Book Keeping and Accounting Services': 'Bookkeeping and Accounting',
    'Nidhi Company Compliance': 'Nidhi Company Compliance',
    'NGO Compliance': 'NGO, Trust, and Society Compliance',
    'Annual Compliance for Society': 'NGO, Trust, and Society Compliance',
    'Trust Annual Compliance': 'NGO, Trust, and Society Compliance',
    'Annual Compliance for Partnership Firm': 'Partnership Firm Annual Compliance',
    'Partnership Firm Tax Return Filing': 'Partnership Firm Tax Return Filing',
    'Form INC-20A': 'Form INC-20A',
  },
  'MCA Services': {
    'Company Name Approval': 'Company Name Approval',
    'Director KYC': 'Director KYC',
    'DIN Services': 'DIN Services',
    'MCA Filing': 'MCA Filing',
  },
  'Event Based Compliance': {
    'Change in Directors': 'Change in Directors',
    'Change of Registered Office': 'Change of Registered Office',
    'Share Allotment': 'Share Allotment',
    'Increase in Authorized Capital': 'Increase in Authorized Capital',
  },
  'Convert Your Business': {
    'Proprietorship to Private Limited': 'Proprietorship to Private Limited',
    'Partnership to LLP': 'Partnership to LLP',
    'Private Limited to LLP': 'Private Limited to LLP',
    'LLP to Private Limited': 'LLP to Private Limited',
  },
  'Licenses & Certifications': {
    'MSME / Udyam Registration': 'MSME / Udyam Registration',
    'Import Export Code': 'Import Export Code',
    'ISO Certification': 'ISO Certification',
    'Trademark Registration': 'Trademark Registration',
  },
  'FSSAI Registration': {
    'Basic FSSAI Registration': 'Basic FSSAI Registration',
    'State FSSAI License': 'State FSSAI Licence',
    'Central FSSAI License': 'Central FSSAI Licence',
  },
  'Trade License': {
    'Trade License': 'Municipal Trade Licence',
    'Shop & Establishment License': 'Shops and Establishments',
  },
  'BIS Registration': {
    'BIS / ISI Certification': 'ISI Mark / Scheme I',
    'CRS Registration': 'Compulsory Registration Scheme (CRS)',
    'Hallmark Registration': 'Hallmarking',
  },
  'International Business Setup': {
    'Indian Subsidiary': 'Wholly Owned Subsidiary',
    'Foreign Subsidiary Company': 'Wholly Owned Subsidiary',
    'Foreign Company': 'Branch Office',
    'Branch Office': 'Branch Office',
    'Liaison Office': 'Liaison Office',
  },
  'Other Services': {
    'GST Registration': 'GST Registration',
    'GST Return Filing': 'GST Return Filing',
    'Accounting & Bookkeeping': 'Bookkeeping and Accounting',
    'Tax Filing': 'Income Tax Return Filing',
  },
  'Trademark Registration': {
    'Trademark Registration': 'Trademark Registration',
    'Trademark Renewal': 'Trademark Renewal',
    'Trademark Objection': 'Trademark Objection',
    'Trademark Opposition': 'Trademark Opposition',
    'International Trademark Registration': 'International Trademark Registration',
    'Trademark Rectification': 'Trademark Rectification',
    'Trademark Hearing': 'Trademark Hearing / Objection Response',
    'Response to Trademark Objection': 'Trademark Hearing / Objection Response',
    'Trademark Infringement': 'Trademark Infringement',
    'Trademark Assignment': 'Trademark Assignment / Wordmark',
    'Wordmark Registration': 'Trademark Assignment / Wordmark',
  },
  'Copyright Registration': {
    'Copyright Registration': 'Copyright Registration',
    'Copyright Renewal': 'Copyright Renewal',
    'Copyright Objection': 'Copyright Objection',
    'Copyright Assignment': 'Copyright Assignment',
  },
  'Patent Registration': {
    'Patent Registration': 'Complete Patent Application',
    'Patent Search': 'Patent Search',
    'Patent Application Filing': 'Complete Patent Application',
    'Patent Renewal': 'Patent Renewal',
  },
  'Design Registration': {
    'Design Registration': 'Design Registration',
    'Design Renewal': 'Design Renewal',
    'Design Objection': 'Design Objection',
  },
  'Intellectual Property Dispute': {
    'Trademark Infringement': 'Trademark Infringement',
    'IPR Legal Notice': 'IPR Legal Notice',
    'IP Opposition': 'IP Opposition',
    'IP Dispute Resolution': 'IP Dispute Resolution',
  },
  'Income Tax': {
    'Income Tax Return Filing': 'Income Tax Return Filing',
    'TDS Return Filing': 'TDS Return Filing',
    'PF Return': 'PF Return',
    'ITR 1 Form Filing': 'ITR 1 Form Filing',
    'ITR 2 Form Filing': 'ITR 2 Form Filing',
    'ITR 7 Form Filing': 'ITR 7 Form Filing',
    '80-IAC Tax Exemption for Startups': '80-IAC Tax Exemption for Startups',
  },
  GST: {
    'GST Registration': 'GST Registration',
    'GST Return Filing': 'GST Return Filing',
    'GST Annual Return Filing': 'GST Annual Return Filing',
    'GST Notice Reply': 'GST Notice Reply',
    'GST Refund Filing': 'GST Refund Filing',
  },
}

function renderCategoryTabContent(tab: string, service: string, category: string) {
  const guide = registrationCategoryGuides[category]
    ?? complianceCategoryGuides[category]
    ?? iprTaxCategoryGuides[category]
  if (!guide) return null
  const guideTypeName = categoryServiceAliases[category]?.[service] ?? service
  const selectedTypeGuide = guide.types.find(({ name }) => name === guideTypeName)

  if (tab === 'Company Types') {
    return (
      <>
        <h2>Types of {category}</h2>
        <p>Compare the available routes before choosing one. Each option has a different legal scope, approval path, and document set.</p>
        <div className="registration-type-list">
          {guide.types.map(({ name, summary }) => (
            <article key={name}>
              <h3>{name}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </>
    )
  }

  if (tab === 'Business Structure') {
    return (
      <>
        <h2>How {category} options differ</h2>
        <p>Compare how each route is governed and what it is commonly used for.</p>
        <div className="registration-structure-table-wrap" role="region" aria-label={`${category} option comparison`} tabIndex={0}>
          <table className="registration-structure-table">
            <thead><tr><th>Option</th><th>How it works</th><th>Typical fit</th></tr></thead>
            <tbody>
              {guide.types.map(({ name, structure, fit, summary }) => (
                <tr key={name}><th scope="row">{name}</th><td>{structure}</td><td>{fit ?? summary}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  if (tab === 'Eligibility') {
    return (
      <>
        <h2>Eligibility for {service}</h2>
        {selectedTypeGuide && <p>{selectedTypeGuide.eligibility}</p>}
        <p>Check these category-wide conditions before preparing your application:</p>
        <ul>{guide.eligibility.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
        <p className="registration-guide-note">Eligibility can depend on current thresholds, state rules, activity, and the applicant’s facts. Verify the live requirements with the relevant authority before filing.</p>
      </>
    )
  }

  if (tab === 'Documents Required') {
    return (
      <>
        <h2>Documents for {service}</h2>
        {selectedTypeGuide && <p>{selectedTypeGuide.documents}</p>}
        <p>Common records for this category include:</p>
        <ul>{guide.documents.map((document) => <li key={document}>{document}</li>)}</ul>
        <p className="registration-guide-note">The final checklist may change by authority, state, applicant type, and service scope. Foreign-issued documents may require certification, apostille, or translation.</p>
      </>
    )
  }

  return (
    <>
      <h2>What is {service}?</h2>
      <p>{guide.overview}</p>
      {selectedTypeGuide && <><h3>How {selectedTypeGuide.name} works</h3><p>{selectedTypeGuide.structure}</p></>}
      <h3>What to prepare</h3>
      <ul>{guide.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
      <p className="registration-guide-note">This guide is original general information informed by public guidance; it is not legal, tax, or regulatory advice.</p>
    </>
  )
}

function renderTabContent(tab: string, service: string, category: string) {
  if (category !== 'Company Registration') {
    return renderCategoryTabContent(tab, service, category)
  }

  const guide = registrationGuides[service] ?? defaultRegistrationGuide

  if (tab === 'Company Types') {
    return (
      <>
        <h2>Company and business registration types</h2>
        <p>These options do not all create the same kind of legal entity. Compare the basic distinction before choosing a route.</p>
        <div className="registration-type-list">
          {companyRegistrationTypes.map(({ name, summary }) => (
            <article key={name}>
              <h3>{name}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </>
    )
  }

  if (tab === 'Business Structure') {
    return (
      <>
        <h2>How the business structures differ</h2>
        <p>Ownership, personal exposure to business debts, and statutory filings vary by structure.</p>
        <div className="registration-structure-table-wrap" role="region" aria-label="Business structure comparison" tabIndex={0}>
          <table className="registration-structure-table">
            <thead><tr><th>Type</th><th>Ownership and control</th><th>Liability</th><th>Often considered for</th></tr></thead>
            <tbody>
              {companyRegistrationTypes.map(({ name, ownership, liability, fit }) => (
                <tr key={name}><th scope="row">{name}</th><td>{ownership}</td><td>{liability}</td><td>{fit}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  if (tab === 'Eligibility') {
    return (
      <>
        <h2>Who can apply for {service}?</h2>
        <p>Eligibility depends on the chosen entity, the founders, the business activity, and any foreign ownership. For {service}, check these common conditions before preparing a filing:</p>
        <ul>{guide.eligibility.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
        <p className="registration-guide-note">Some structures also have post-incorporation conditions. Confirm current rules with the relevant authority or a qualified professional before applying.</p>
      </>
    )
  }

  if (tab === 'Documents Required') {
    return (
      <>
        <h2>Documents for {service}</h2>
        <p>Prepare clear, current copies. The filing professional or authority may request additional evidence based on nationality, ownership, address, activity, or the application route.</p>
        <ul>{guide.documents.map((document) => <li key={document}>{document}</li>)}</ul>
        <p className="registration-guide-note">Foreign-issued records may need notarisation, apostille or consularisation, and an English translation. Check the applicable filing instructions before submission.</p>
      </>
    )
  }

  return (
    <>
      <h2>What is {service} in India?</h2>
      <p>{guide.overview}</p>
      <h3>How the structure works</h3>
      <p>{guide.structure}</p>
      <h3>Typical steps</h3>
      <ol>
        <li>Confirm that the structure and name fit the owners, activity, and current filing rules.</li>
        <li>Collect identity, address, ownership, and office evidence for the applicants.</li>
        <li>Prepare the structure-specific agreement, constitutional documents, or declarations.</li>
        <li>Submit the required application to the relevant MCA or state authority and respond to any resubmission request.</li>
        <li>After approval, complete applicable tax, licence, and ongoing compliance registrations.</li>
      </ol>
      <p className="registration-guide-note">This guide is general information, not legal or tax advice. Forms, thresholds, and documents can change; verify current requirements for your case before filing.</p>
    </>
  )
}

interface RegistrationDetailFaq {
  question: string
  answer: string
}

function buildRegistrationDetailFaqs(service: string, category: string): RegistrationDetailFaq[] {
  if (category === 'Company Registration') {
    const guide = registrationGuides[service] ?? defaultRegistrationGuide
    return [
      { question: `What is ${service}?`, answer: guide.overview },
      { question: `How is ${service} structured?`, answer: guide.structure },
      { question: `Who may be eligible for ${service}?`, answer: guide.eligibility.slice(0, 3).join(' ') },
      { question: 'Which documents are commonly requested?', answer: guide.documents.slice(0, 3).join(' ') },
      { question: 'Does registration include every tax and operating licence?', answer: 'No. Tax registrations, local permissions, sector licences, and post-registration filings are separate unless specifically included and applicable. Requirements depend on the entity and its activities.' },
    ]
  }

  const guide = registrationCategoryGuides[category]
    ?? complianceCategoryGuides[category]
    ?? iprTaxCategoryGuides[category]
  if (!guide) return []
  const guideTypeName = categoryServiceAliases[category]?.[service] ?? service
  const serviceGuide = guide.types.find(({ name }) => name === guideTypeName)
  const serviceOverview = serviceGuide
    ? `${serviceGuide.summary} ${serviceGuide.structure}`
    : guide.overview
  const eligibility = serviceGuide?.eligibility ?? guide.eligibility.slice(0, 3).join(' ')
  const documents = serviceGuide?.documents ?? guide.documents.slice(0, 3).join(' ')

  return [
    { question: `What does ${service} cover?`, answer: serviceOverview },
    { question: `Who may be eligible for ${service}?`, answer: eligibility },
    { question: `Which documents are commonly needed for ${service}?`, answer: documents },
    { question: `What should I check before applying for ${service}?`, answer: `${guide.eligibility.slice(0, 3).join(' ')} The exact checklist depends on the applicant, activity, location, and current authority instructions.` },
    { question: 'Does this service include other registrations or filings?', answer: 'Not automatically. Related registrations, renewals, tax filings, permissions, or post-approval steps may be separate. Confirm the required scope for your activity and jurisdiction before applying.' },
  ]
}

export function RegistrationDetailPage({ selectedService, onServiceChange, registrationCategory = 'Company Registration', pageTitleOverride }: RegistrationDetailPageProps) {
  const [activeTab, setActiveTab] = useState(baseDetailTabs[0])
  const hasComparisonTabs = comparisonTabCategories.has(registrationCategory)
    || (registrationCategory === 'Compliance Calendar' || registrationCategory === 'Compliance' || registrationCategory === 'Convert Your Business')
  const detailTabs = hasComparisonTabs
    ? ['Overview', 'Company Types', 'Business Structure', 'Eligibility', 'Documents Required']
    : baseDetailTabs
  const selectedType = selectedService || 'Company Registration'
  const categoryGuide = registrationCategoryGuides[registrationCategory]
    ?? complianceCategoryGuides[registrationCategory]
    ?? iprTaxCategoryGuides[registrationCategory]
  const registrationName = registrationCategory === 'Company Registration' && /\bregistration\b/i.test(selectedType)
    ? selectedType.replace(/\bregistration\b/gi, 'Registration')
    : registrationCategory === 'Company Registration' ? `${selectedType} Registration` : selectedType
  const pageTitle = pageTitleOverride ?? `${registrationName} Online in India`
  const highlights = categoryGuide?.highlights ?? companyRegistrationHighlights
  const faqs = buildRegistrationDetailFaqs(selectedType, registrationCategory)

  return (
    <div className="registration-detail-page">
      <nav className="registration-detail-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">›</span>
          <a href="/services">Services</a>
          <span aria-hidden="true">›</span>
        <span>{selectedType}</span>
      </nav>

      <section className="registration-detail-hero" aria-labelledby="registration-detail-title">
        <div className="registration-detail-hero-inner">
          <div className="registration-detail-intro">
            <h1 id="registration-detail-title">{pageTitle}</h1>
            <p>
              {categoryGuide?.overview ?? 'Get clear guidance for your company setup, from choosing a business structure through incorporation filing.'}
            </p>
            <ul>
              {highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
            </ul>
            <div className="registration-detail-ratings" aria-label="Customer ratings">
              <span><strong>Company setup</strong><small>Guidance for every step</small></span>
              <span><strong>Online process</strong><small>Apply from anywhere in India</small></span>
            </div>
          </div>
          <RegistrationLeadForm
            selectedService={selectedService}
            onServiceChange={onServiceChange}
            formId="registration-detail-hero-form"
          />
        </div>
      </section>

      <section className="registration-detail-body" aria-label={`${registrationCategory} guide`}>
        <div className="registration-detail-main-column">
          <nav className="registration-detail-tabs" aria-label={`${registrationCategory} topics`}>
            {detailTabs.map((tab) => (
              <button
                className={activeTab === tab ? 'active' : ''}
                type="button"
                key={tab}
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="registration-detail-article" aria-live="polite">
            <p className="registration-detail-review">{registrationCategory} <span>General guide · Verify current requirements</span></p>
            {renderTabContent(activeTab, selectedType, registrationCategory)}
          </div>
        </div>
      </section>

      <section className="registration-detail-faq" aria-labelledby="registration-detail-faq-title">
        <div className="registration-detail-faq-inner">
          <h2 id="registration-detail-faq-title">Frequently Asked Questions</h2>
          <div className="registration-detail-faq-list">
            {faqs.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

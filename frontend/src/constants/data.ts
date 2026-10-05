// ─── FAQ ────────────────────────────────────────────────────────────────────

export const questions: [string, string][] = [
  [
    'What are the rules for picking a name for a private limited company?',
    'Choose a name that is distinct, available for registration, and does not conflict with existing company names or trademarks. The name must follow MCA guidelines and should not include restricted or misleading words.',
  ],
  [
    'How much time is needed to set up a private limited company in India?',
    'Registration often takes around 7 to 10 working days after the required documents are submitted. The timeline can vary depending on name approval and government processing.',
  ],
  [
    'Do I need to be physically present during this process?',
    'No. The registration process can be completed online. Directors can sign documents digitally and share the required information remotely.',
  ],
  [
    'What documents are required to complete the process?',
    "Directors generally need PAN, identity and address proof, photographs, and proof of the company's registered office. Additional documents may be needed based on your application.",
  ],
  [
    'Does a private limited company have continuous existence?',
    'Yes. A private limited company is a separate legal entity with perpetual succession, so it continues to exist despite changes in its directors or shareholders.',
  ],
  [
    'What is included in the Rs.1,999/- company registration package?',
    'The package covers DIN and DSC for two directors, name approval, drafting of MoA and AoA, MCA SPICe+ filing, registration fees and stamp duty, the Certificate of Incorporation with CIN, company PAN and TAN, and post-incorporation compliance guidance.',
  ],
  [
    'How many people are needed to start a private limited company?',
    'You need a minimum of two directors and two shareholders, and the same people can hold both roles. At least one director must be a resident of India. There is no minimum paid-up capital requirement.',
  ],
  [
    'What compliances does a company need to follow after registration?',
    'After incorporation, a company must open a bank account, file the commencement of business declaration, appoint an auditor, hold board meetings, and file annual returns and financial statements with the MCA along with income tax returns. Our team can manage these filings for you.',
  ],
  [
    'Apart from company registration, what other services does Dhanvia offer?',
    'Dhanvia also helps with GST, trademark and other business registrations, tax and compliance filings, mutual fund investments, home, personal and business loans, and insurance plans, so you can manage your business and personal finances in one place.',
  ],
]

// ─── Hero Banner ─────────────────────────────────────────────────────────────

export interface BannerSlide {
  src: string
  alt: string
}

export const bannerSlides: BannerSlide[] = [
  { src: '/IMG_0945.webp', alt: 'Invest in mutual funds for a better tomorrow' },
  { src: '/IMG_0936.webp', alt: 'Business compliance services' },
  { src: '/IMG_0947.webp', alt: 'Home, personal, and business loan solutions' },
  { src: '/IMG_0953.webp', alt: 'Insurance plans for a safer tomorrow' },
]

// ─── Registration Steps ───────────────────────────────────────────────────────

export interface RegistrationStep {
  number: string
  title: string
  kind: string
}

export const registrationSteps: RegistrationStep[] = [
  { number: '01', title: 'Fill up the forms', kind: 'form' },
  { number: '02', title: 'Submit the Documents', kind: 'documents' },
  { number: '03', title: 'Pay Fees', kind: 'payment' },
  { number: '04', title: 'Get your Company Registered', kind: 'certificate' },
]

// ─── Company Services ─────────────────────────────────────────────────────────

export interface CompanyService {
  title: string
  kind: string
}

export const companyServices: CompanyService[] = [
  { title: 'Compliance', kind: 'compliance' },
  { title: 'Mutual Fund', kind: 'fund' },
  { title: 'Loans', kind: 'loan' },
  { title: 'Insurance', kind: 'insurance' },
]

// ─── Service Catalog ──────────────────────────────────────────────────────────

export interface ServiceCategory {
  category: string
  services: string[]
}

export const registrationServiceCategories: ServiceCategory[] = [
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
  {
    category: 'NGO',
    services: ['NGO Registration', 'Section 8 Company', 'Trust Registration', 'Society Registration'],
  },
  {
    category: 'Licenses & Certifications',
    services: ['Trademark Registration', 'MSME / Udyam Registration', 'Import Export Code', 'ISO Certification'],
  },
  {
    category: 'FSSAI Registration',
    services: ['Basic FSSAI Registration', 'State FSSAI License', 'Central FSSAI License', 'FSSAI Renewal'],
  },
  {
    category: 'Trade License',
    services: ['Trade License', 'Shop & Establishment License', 'Trade License Renewal'],
  },
  {
    category: 'BIS Registration',
    services: ['BIS / ISI Certification', 'CRS Registration', 'Hallmark Registration'],
  },
  {
    category: 'International Business Setup',
    services: ['Indian Subsidiary', 'Foreign Subsidiary Company', 'Branch Office', 'Liaison Office', 'Foreign Company'],
  },
  {
    category: 'Other Services',
    services: ['GST Registration', 'GST Return Filing', 'Accounting & Bookkeeping', 'Tax Filing'],
  },
]

export const complianceServiceCategories: ServiceCategory[] = [
  {
    category: 'Compliance Calendar',
    services: ['Company Compliance Calendar', 'LLP Compliance Calendar', 'Annual Filing Calendar'],
  },
  {
    category: 'Compliance',
    services: [
      'LLP Annual Compliance',
      'Annual Compliance for Private Limited Company',
      'Sole Proprietorship Compliance',
      'Outsource Bookkeeping Services',
      'Book Keeping and Accounting Services',
      'Nidhi Company Compliance',
      'NGO Compliance',
      'Annual Compliance for Society',
      'Annual Compliance for Partnership Firm',
      'Form INC-20A',
      'Trust Annual Compliance',
      'Partnership Firm Tax Return Filing',
    ],
  },
  {
    category: 'MCA Services',
    services: ['Company Name Approval', 'Director KYC', 'DIN Services', 'MCA Filing'],
  },
  {
    category: 'Event Based Compliance',
    services: ['Change in Directors', 'Change of Registered Office', 'Share Allotment', 'Increase in Authorized Capital'],
  },
  {
    category: 'Convert Your Business',
    services: ['Proprietorship to Private Limited', 'Partnership to LLP', 'Private Limited to LLP', 'LLP to Private Limited'],
  },
]

export const iprServiceCategories: ServiceCategory[] = [
  {
    category: 'Trademark Registration',
    services: [
      'Trademark Registration',
      'Trademark Renewal',
      'Trademark Objection',
      'Trademark Opposition',
      'International Trademark Registration',
      'Trademark Rectification',
      'Trademark Hearing',
      'Response to Trademark Objection',
      'Trademark Infringement',
      'Trademark Assignment',
      'Wordmark Registration',
    ],
  },
  {
    category: 'Copyright Registration',
    services: ['Copyright Registration', 'Copyright Renewal', 'Copyright Objection', 'Copyright Assignment'],
  },
  {
    category: 'Patent Registration',
    services: ['Patent Registration', 'Patent Search', 'Patent Application Filing', 'Patent Renewal'],
  },
  {
    category: 'Design Registration',
    services: ['Design Registration', 'Design Renewal', 'Design Objection'],
  },
  {
    category: 'Intellectual Property Dispute',
    services: ['Trademark Infringement', 'IPR Legal Notice', 'IP Opposition', 'IP Dispute Resolution'],
  },
]

export const taxationServiceCategories: ServiceCategory[] = [
  {
    category: 'Income Tax',
    services: [
      'Income Tax Return Filing',
      'TDS Return Filing',
      'PF Return',
      'ITR 2 Form Filing',
      'ITR 7 Form Filing',
      'ITR 1 Form Filing',
      '80-IAC Tax Exemption for Startups',
    ],
  },
  {
    category: 'GST',
    services: ['GST Registration', 'GST Return Filing', 'GST Annual Return Filing', 'GST Notice Reply', 'GST Refund Filing'],
  },
]

export const serviceMegaMenus = [
  { label: 'Registrations', href: '#registration-process-title', categories: registrationServiceCategories },
  { label: 'Compliance', href: '#company-services-title', categories: complianceServiceCategories, defaultCategory: 'Compliance' },
  { label: 'IPR', href: '#service-catalog', categories: iprServiceCategories },
  { label: 'Taxation', href: '#service-catalog', categories: taxationServiceCategories },
]

export const selectableRegistrationServices = Array.from(
  new Set(serviceMegaMenus.flatMap(({ categories }) => categories.flatMap(({ services }) => services))),
)

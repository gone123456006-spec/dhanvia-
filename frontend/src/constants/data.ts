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
]

// ─── Hero Banner ─────────────────────────────────────────────────────────────

export interface BannerSlide {
  src: string
  alt: string
}

export const bannerSlides: BannerSlide[] = [
  { src: '/IMG_0945.PNG', alt: 'Invest in mutual funds for a better tomorrow' },
  { src: '/IMG_0936.PNG', alt: 'Business compliance services' },
  { src: '/IMG_0947.PNG', alt: 'Home, personal, and business loan solutions' },
  { src: '/IMG_0953.PNG', alt: 'Insurance plans for a safer tomorrow' },
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

export const selectableRegistrationServices = Array.from(
  new Set(registrationServiceCategories.flatMap(({ services }) => services)),
)

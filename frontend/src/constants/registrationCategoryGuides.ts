export interface RegistrationOptionGuide {
  name: string
  summary: string
  structure: string
  fit?: string
  eligibility: string
  documents: string
}

export interface RegistrationCategoryGuide {
  overview: string
  structure: string
  eligibility: string[]
  documents: string[]
  highlights: string[]
  types: RegistrationOptionGuide[]
}

export const registrationCategoryGuides: Record<string, RegistrationCategoryGuide> = {
  NGO: {
    overview: 'An NGO is a purpose-led organisation, not one single legal form. In India, a non-profit may be established as a public charitable trust, a society, or a Section 8 company. The right route depends on the mission, governance, locations of operation, and funding plans.',
    structure: 'A trust is governed by its trust deed and trustees; a society follows its memorandum, rules, and governing body; a Section 8 company is incorporated under company law and must apply its income toward its permitted objects rather than distributing dividends. Tax, donor, CSR, and foreign-contribution approvals are separate from formation.',
    eligibility: [
      'Define charitable, educational, social, scientific, cultural, or other permitted non-profit objects.',
      'Choose founders and governing persons who can provide the required identity and consent records.',
      'Meet the minimum founder or member composition and filing rules for the selected trust, society, or company route.',
      'Use the relevant state or central filing authority based on structure and place of registration.',
      'Apply separately for tax exemptions, donor approvals, CSR-1, NGO Darpan, or FCRA permissions where relevant; formation alone does not grant them.',
    ],
    documents: [
      'Founder, trustee, member, or director identity, address, and PAN records.',
      'Proposed name, mission statement, objects, and office address proof.',
      'Trust deed; or society memorandum and rules; or Section 8 MoA/AoA and incorporation declarations.',
      'Office-owner consent or occupancy proof and recent utility evidence.',
      'Additional resolutions, activity plan, financial details, and separate approval records where a later tax, grant, CSR, or foreign-funding application requires them.',
    ],
    highlights: ['Select the right non-profit structure', 'Draft governing documents around your objects', 'Separate formation from tax and funding approvals'],
    types: [
      { name: 'Section 8 Company', summary: 'A company form for qualifying non-profit objects under the Companies Act.', structure: 'Governed by MoA/AoA and directors; surplus must be applied to the objects and cannot be distributed as dividends.', eligibility: 'Founders must set qualifying non-profit objects and meet current MCA incorporation and licensing conditions.', documents: 'Subscriber/director proofs, office evidence, proposed MoA/AoA, declarations, and any required Section 8 application records.' },
      { name: 'Public Charitable Trust', summary: 'A trust formed by a settlor to hold or apply property for stated public-benefit purposes.', structure: 'Trustees administer assets under the trust deed and the state law that applies.', eligibility: 'A clear lawful charitable purpose, settlor, trustees, and a valid deed are required; registration processes vary by state.', documents: 'Trust deed, settlor/trustee identity and address proofs, registered-office details, property particulars where relevant, and state forms.' },
      { name: 'Society', summary: 'A membership organisation formed for eligible literary, scientific, charitable, or other permitted purposes.', structure: 'Members govern the society through its memorandum, rules, and elected or appointed committee.', eligibility: 'The required minimum number of members and governing-body details depend on the applicable state law.', documents: 'Memorandum, rules and regulations, member and office-bearer proofs, address evidence, and member declarations.' },
    ],
  },
  'Licenses & Certifications': {
    overview: 'Business licences and certifications address different needs: government registrations identify a business, while standards certifications assess a defined product or management system. The right application depends on the activity, product, turnover, destination market, and customer or regulatory requirements.',
    structure: 'MSME/Udyam and IEC are registrations for eligible businesses and trade activity. ISO certification concerns a management system and is issued after an independent audit by a certification body. A trademark is an intellectual-property filing, not an operating licence.',
    eligibility: [
      'Identify the business entity, activity, product, and locations covered by the application.',
      'Check whether the registration is optional, threshold-based, or required for the intended activity or transaction.',
      'For certification, define the scope and select the applicable standard, product scheme, or export code.',
      'Keep entity, ownership, address, and authorised signatory details consistent across filings.',
    ],
    documents: [
      'Entity constitution or business proof, PAN, and authorised-person identity details.',
      'Business and premises address evidence, contact information, and bank details when requested.',
      'Product, service, turnover, or export information appropriate to the application.',
      'For ISO audits, process records and scope details; for trademarks, mark artwork and goods/services classes.',
    ],
    highlights: ['Match the application to the activity', 'Confirm mandatory scope before applying', 'Keep renewal and evidence requirements visible'],
    types: [
      { name: 'MSME / Udyam Registration', summary: 'A government enterprise registration based on qualifying business classification.', structure: 'The business keeps its existing legal form; Udyam records enterprise details and applicable classification.', eligibility: 'Classification depends on current investment and turnover criteria and the business’s PAN-linked data.', documents: 'Aadhaar and PAN details of the proprietor or authorised signatory, entity PAN, and linked business information; validate details on the official portal.' },
      { name: 'Import Export Code', summary: 'An IEC is used for covered import and export activity under India’s foreign-trade framework.', structure: 'The IEC is associated with the applicant entity or proprietor and its PAN.', eligibility: 'An applicant planning covered cross-border trade must check current DGFT rules and any product-specific restrictions.', documents: 'PAN, applicant/entity details, address proof, bank details, and authorised signatory information requested by DGFT.' },
      { name: 'ISO Certification', summary: 'Independent certification that a defined management system meets a selected ISO standard.', structure: 'A certification body audits the management system within the agreed organisational and site scope; ISO itself does not issue the certificate.', eligibility: 'Any organisation can assess readiness against a relevant standard; certification depends on audit conformity and competent certification-body selection.', documents: 'Scope and process map, policies, procedures, records, site details, internal audit and management-review evidence as applicable.' },
      { name: 'Trademark Registration', summary: 'A trademark application seeks protection for a distinctive brand sign in selected goods or services.', structure: 'The application is filed by an individual or legal entity in relevant trademark classes.', eligibility: 'The applicant must claim ownership or a valid basis to apply; the mark must meet distinctiveness and legal restrictions.', documents: 'Applicant identity and address, mark representation, goods/services list, use claim evidence if applicable, and authorisation for an agent.' },
    ],
  },
  'FSSAI Registration': {
    overview: 'Food businesses need the FSSAI registration or licence applicable to their activity before operating. The category depends on the kind of business, scale, turnover, and location—not turnover alone. Applications and changes are handled through the FoSCoS system.',
    structure: 'The main tiers are Basic Registration, State Licence, and Central Licence. From 1 April 2026, published turnover bands generally use up to ₹1.5 crore for Basic, above ₹1.5 crore up to ₹50 crore for State, and above ₹50 crore for Central; specific kinds of business can require a higher tier regardless of these bands.',
    eligibility: [
      'Identify every food activity: manufacturing, processing, storage, transport, retail, food service, import, or e-commerce.',
      'Select the correct kind of business and premises for each application.',
      'Check the current turnover band and activity-specific criteria; some activities require a State or Central licence regardless of turnover.',
      'Maintain suitable premises and comply with food-safety and hygiene requirements applicable to the operation.',
    ],
    documents: [
      'Applicant or entity identity, PAN, and authorised-signatory details.',
      'Premises address proof and evidence of lawful occupancy.',
      'Food activity, product category, capacity, equipment, and premises particulars requested for the kind of business.',
      'For manufacturing or processing, product and process details, layout, and water/test records where applicable.',
      'NOCs, declarations, and supporting records required for the selected licence tier and business activity.',
    ],
    highlights: ['Choose the FoSCoS kind of business carefully', 'Assess licence tier by activity and scale', 'Keep food-safety records for the licensed premises'],
    types: [
      { name: 'Basic FSSAI Registration', summary: 'A registration tier for eligible small food businesses meeting the current activity and turnover conditions.', structure: 'A premises-and-activity approval recorded in FoSCoS; it is not a company structure.', eligibility: 'The general revised turnover band is up to ₹1.5 crore from 1 April 2026, subject to kind-of-business rules and exceptions.', documents: 'Applicant proof, business/premises address, activity details, and supporting records requested for the selected kind of business.' },
      { name: 'State FSSAI Licence', summary: 'A State-level food licence for businesses that meet the relevant activity and scale criteria.', structure: 'Issued for the applicant’s food activity and licensed premises through FoSCoS.', eligibility: 'The general revised turnover band is above ₹1.5 crore up to ₹50 crore from 1 April 2026; activity-specific rules may require this tier independently.', documents: 'Entity and authorised-person records, premises evidence, business activity/capacity details, and technical or food-safety records applicable to the activity.' },
      { name: 'Central FSSAI Licence', summary: 'A Central licence for specified food activities and larger operations under the applicable rules.', structure: 'A Central-level FoSCoS licence tied to the applicant, activity, and premises.', eligibility: 'The general revised turnover band is above ₹50 crore from 1 April 2026; certain businesses need Central licensing regardless of turnover.', documents: 'Entity, premises, activity, import/export or multi-state particulars as applicable, plus the supporting technical and food-safety records requested.' },
    ],
  },
  'Trade License': {
    overview: 'A trade licence is permission from the relevant local authority to conduct a specified business at a specified premises. Requirements, forms, fees, inspection rules, and renewal schedules vary by municipality and activity.',
    structure: 'This is a premises- and activity-specific local approval, not an entity incorporation. Other permissions—such as Shops and Establishments, FSSAI, fire, pollution, or factory approvals—may also apply independently.',
    eligibility: [
      'Operate a business activity for which the local authority requires a licence.',
      'Use premises permitted for the proposed activity under local zoning and safety rules.',
      'Meet applicable health, fire, building, sanitation, and environmental conditions.',
      'Apply to the municipal body or other local authority with jurisdiction over the premises.',
    ],
    documents: [
      'Applicant/entity identity, PAN, and proof of business constitution.',
      'Premises ownership or occupancy evidence, latest utility bill, and owner consent where relevant.',
      'Business activity description, floor/site details, and establishment information.',
      'NOCs or safety clearances such as fire or health approvals when required by the activity or local authority.',
    ],
    highlights: ['Confirm rules with the local authority', 'Use the correct premises and activity category', 'Track renewal dates and separate sector approvals'],
    types: [
      { name: 'Municipal Trade Licence', summary: 'Local permission for a listed business activity at a stated premises.', structure: 'Issued by the municipal body or other competent local authority.', eligibility: 'The activity and premises must satisfy that authority’s local rules and land-use conditions.', documents: 'Applicant, premises, activity, occupancy, and activity-specific NOC records.' },
      { name: 'Shops and Establishments', summary: 'A state/UT registration or licence for shops and commercial establishments where applicable.', structure: 'A labour and establishment registration separate from company incorporation.', eligibility: 'Applies according to the state/UT law, establishment type, workforce, and local filing timelines.', documents: 'Employer/entity proof, establishment address, commencement and employee particulars, and prescribed state forms.' },
      { name: 'Health or Industrial Trade Licence', summary: 'Activity-specific local approval for businesses with public-health, manufacturing, or safety impacts.', structure: 'A local approval that may sit alongside fire, factory, pollution, or sector licences.', eligibility: 'Depends on activity classification, premises, equipment, public-health risk, and local rules.', documents: 'Premises plan, activity/equipment particulars, safety and sanitation details, and requested department NOCs.' },
    ],
  },
  'BIS Registration': {
    overview: 'BIS certification demonstrates conformity with an applicable Indian Standard under a relevant scheme. It is mandatory only when a product falls within a notified requirement or Quality Control Order. The product, standard, factory, and scheme determine the application route.',
    structure: 'Scheme I commonly uses a licence and ISI mark; the Compulsory Registration Scheme (CRS) covers notified product categories and uses a registration number; hallmarking applies to specified precious-metal articles. These routes have different testing and surveillance steps.',
    eligibility: [
      'Identify the exact product, model, factory, manufacturer, and applicable Indian Standard.',
      'Check the latest mandatory certification/QCO list before manufacture, import, sale, or distribution.',
      'The applicant may be a manufacturer; foreign manufacturers can have additional representative and factory requirements.',
      'Complete testing and factory assessment steps specified for the selected scheme before using a mark or registration number.',
    ],
    documents: [
      'Manufacturer/entity identity, factory address, and authorised signatory proof.',
      'Product name, model/brand, technical specifications, and applicable Indian Standard.',
      'Factory process, quality-control, equipment, and test-laboratory records as the scheme requires.',
      'For foreign manufacturers, authorised Indian representative and notarised/apostilled records where required.',
    ],
    highlights: ['Confirm the product is covered by a current QCO', 'Match the product to the correct Indian Standard', 'Complete scheme-specific testing before marking'],
    types: [
      { name: 'ISI Mark / Scheme I', summary: 'Product certification for goods covered by the relevant BIS standard and certification scheme.', structure: 'Factory assessment and product testing support a BIS licence to use the applicable Standard Mark.', eligibility: 'Manufacturers of covered products must meet the standard and scheme-specific quality-control requirements.', documents: 'Factory and process details, product specifications, test samples/results, quality records, and authorised signatory documents.' },
      { name: 'Compulsory Registration Scheme (CRS)', summary: 'Registration for notified electronic and IT products under their applicable Indian Standards.', structure: 'Product/model registration follows testing at a recognised laboratory and BIS application review.', eligibility: 'Manufacturers of products in the current CRS list; each covered product/model family must meet applicable conditions.', documents: 'Product technical details, test report, factory information, brand/trademark evidence, and applicant/authorised-representative records.' },
      { name: 'Hallmarking', summary: 'Purity and identification marking for covered precious-metal articles under the applicable BIS framework.', structure: 'Jewellers or registered entities submit eligible articles through the applicable Assaying and Hallmarking Centre process.', eligibility: 'Businesses dealing in covered articles must confirm current registration, article, and location requirements.', documents: 'Business registration, identity/address proof, premises details, and article or inventory particulars requested for registration.' },
    ],
  },
  'International Business Setup': {
    overview: 'An overseas business entering India can consider a locally incorporated subsidiary or a permitted foreign-company presence such as a branch, liaison, or project office. These routes differ in legal identity, permitted activity, ownership, and approvals.',
    structure: 'An Indian subsidiary is a separate Indian company owned wholly or partly by the foreign parent. A branch or project office is an extension of the foreign entity with activity limits; a liaison office is generally restricted to representative and communication functions. FEMA, FDI policy, sector rules, and MCA filings may all apply.',
    eligibility: [
      'Choose a presence type that allows the intended Indian activities.',
      'Check sectoral foreign-investment limits and automatic or government approval routes.',
      'Confirm RBI/FEMA eligibility and profitability or track-record conditions where the selected office route requires them.',
      'Provide parent-company authority, ownership, beneficial-owner, and authorised-representative details.',
      'Plan annual company, tax, foreign-exchange, and transaction reporting before operations begin.',
    ],
    documents: [
      'Foreign parent incorporation certificate and constitutional documents, appropriately certified or apostilled where required.',
      'Board resolution approving the Indian presence, activities, investment, and authorised signatories.',
      'Parent financial statements, bank details, ownership chart, and beneficial-owner particulars.',
      'Passport and address records for proposed foreign directors or representatives, with required translation/certification.',
      'Indian office proof, business plan, proposed activity, and RBI/MCA/FEMA application evidence as applicable.',
    ],
    highlights: ['Compare subsidiary and foreign-office routes', 'Review sectoral FDI and FEMA conditions', 'Prepare certified parent-company records early'],
    types: [
      { name: 'Wholly Owned Subsidiary', summary: 'An Indian company wholly owned by its foreign parent where permitted by sectoral FDI rules.', structure: 'Separate Indian company with local directors and company-law filings; investment reporting may apply.', eligibility: '100% foreign ownership is permitted only where the sector and investment route allow it.', documents: 'Parent incorporation records, board approval, ownership/beneficial-owner chart, Indian office records, and incorporation/FEMA forms.' },
      { name: 'Joint Venture Subsidiary', summary: 'An Indian company with foreign and Indian ownership sharing investment and governance.', structure: 'Shareholder rights and reserved decisions are set by law, constitutional documents, and investment agreements.', eligibility: 'Ownership split must comply with sector caps and approval conditions.', documents: 'Records from all investors, board approvals, investment and share terms, beneficial-owner details, and Indian incorporation papers.' },
      { name: 'Branch Office', summary: 'A permitted Indian place of business of a foreign entity for specifically allowed activities.', structure: 'The foreign entity remains the legal entity; the Indian office acts within its approved scope.', eligibility: 'RBI/FEMA conditions and permitted activity restrictions apply; approval requirements depend on the case.', documents: 'Parent records and financials, board resolution, bank details, activity plan, Indian address, and regulatory application forms.' },
      { name: 'Liaison Office', summary: 'A representative office for permitted communication and coordination, not general commercial operations.', structure: 'An Indian presence of the foreign entity with a narrowly defined non-revenue activity scope.', eligibility: 'Must satisfy RBI/FEMA conditions and may not undertake activities that generate income in India.', documents: 'Parent incorporation and financial records, board resolution, banker certificate, activity scope, and proposed office details.' },
      { name: 'Project Office', summary: 'A temporary Indian office linked to carrying out a specific qualifying project.', structure: 'The foreign entity operates a project-specific place of business for the approved period and scope.', eligibility: 'The project and funding/contract conditions must satisfy applicable RBI/FEMA rules.', documents: 'Project contract/award, parent records, funding details, board resolution, Indian office address, and approval/notification forms.' },
    ],
  },
  'Other Services': {
    overview: 'Other business services include indirect-tax registration and returns, bookkeeping, and income-tax filings. They are not company structures: the correct service depends on the entity, turnover, transactions, business locations, and statutory deadlines.',
    structure: 'GST registration provides a GSTIN for a taxpayer and its registrations; bookkeeping maintains financial records; income-tax return filing reports taxable income to the tax authority. Each is a separate tax or accounting obligation with its own eligibility and filing cycle.',
    eligibility: [
      'Check GST registration thresholds and mandatory-registration cases based on supply type, location, and business model.',
      'Identify the correct GST taxpayer type, state registrations, and authorised signatory.',
      'Determine the applicable income-tax return form from the taxpayer type, income sources, and statutory rules.',
      'Keep books and source documents in a form appropriate to the entity and applicable accounting/tax requirements.',
    ],
    documents: [
      'PAN, entity constitution, authorised signatory identity, and business address proof.',
      'Sales/purchase invoices, bank statements, expense proofs, and tax-payment records.',
      'GSTIN, prior returns, e-way bills, and reconciliation details for return filing where applicable.',
      'Income statements, balance sheet, tax deduction certificates, investment or deduction proofs, and prior return details as applicable.',
    ],
    highlights: ['Separate tax registration from entity incorporation', 'Maintain source documents throughout the year', 'Match filings to the entity and reporting period'],
    types: [
      { name: 'GST Registration', summary: 'Taxpayer registration under GST for businesses required or choosing to register under current rules.', structure: 'GSTIN is issued to a legal person for relevant state/UT and business locations.', eligibility: 'Thresholds and mandatory cases depend on goods/services, state, e-commerce, inter-state supply, and other conditions.', documents: 'PAN, constitution proof, place-of-business evidence, bank information, and authorised signatory records.' },
      { name: 'GST Return Filing', summary: 'Periodic reporting of outward supplies, input tax credit, and tax liability under the applicable return type.', structure: 'Return type and frequency depend on taxpayer category and current GST rules.', eligibility: 'Registered taxpayers must file required returns, including nil returns where applicable.', documents: 'Sales/purchase data, credit/debit notes, tax invoices, input-credit evidence, payment records, and prior-period reconciliations.' },
      { name: 'Bookkeeping and Accounting', summary: 'Organised recording and reconciliation of business transactions and financial records.', structure: 'Records should reflect the entity’s chart of accounts, accounting basis, and reporting needs.', eligibility: 'Useful for businesses of any size; statutory record formats and audit requirements vary by entity and law.', documents: 'Invoices, receipts, bank and payment-gateway statements, payroll, loan records, asset purchases, and tax filings.' },
      { name: 'Income Tax Return Filing', summary: 'Annual reporting of a taxpayer’s income, deductions, taxes, and related disclosures.', structure: 'Return form depends on whether the taxpayer is an individual, firm, LLP, company, or another person.', eligibility: 'Filing obligation depends on income, entity type, transactions, and other statutory triggers.', documents: 'PAN, income statements, bank details, tax-credit statements, deduction proofs, financial statements, and prior-year return where applicable.' },
    ],
  },
}

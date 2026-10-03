export interface RegistrationGuide {
  overview: string
  structure: string
  eligibility: string[]
  documents: string[]
}

export const companyRegistrationTypes = [
  {
    name: 'Private Limited Company',
    summary: 'A share-based company with a separate legal identity and limited liability for its members.',
    ownership: 'Shareholders own shares; a board manages the company.',
    liability: 'Generally limited to unpaid share amounts, subject to law.',
    fit: 'Teams seeking a scalable company form or share-based investment.',
  },
  {
    name: 'LLP registration',
    summary: 'A separate legal entity where partners define contributions and management through an LLP agreement.',
    ownership: 'Partners share management and economics under an LLP agreement.',
    liability: 'Generally limited for each partner, subject to their own conduct and statutory duties.',
    fit: 'Professional or partner-led firms wanting flexible internal arrangements.',
  },
  {
    name: 'Public Limited Company',
    summary: 'A company designed for a wider shareholder base, subject to additional governance and securities rules.',
    ownership: 'Shareholders own shares; a board and statutory governance rules apply.',
    liability: 'Generally limited to unpaid share amounts, subject to law.',
    fit: 'Businesses planning a broader shareholder base; public offers need separate compliance.',
  },
  {
    name: 'One Person Company',
    summary: 'A private company structure for a single member, with a nominee requirement.',
    ownership: 'One member owns the company; a nominee is identified under the applicable rules.',
    liability: 'Generally limited to unpaid share amounts, subject to law.',
    fit: 'A solo founder seeking a corporate entity and single-member ownership.',
  },
  {
    name: 'Partnership Firm',
    summary: 'A business owned by two or more partners under a partnership deed.',
    ownership: 'Partners share control and profits as set out in their deed.',
    liability: 'Partners generally have personal liability for firm obligations.',
    fit: 'A small co-owned business wanting contractual flexibility.',
  },
  {
    name: 'Sole Proprietorship',
    summary: 'A business owned and operated by one individual, using registrations applicable to its activity.',
    ownership: 'One individual owns and controls the business.',
    liability: 'The proprietor is generally personally responsible for business obligations.',
    fit: 'A single-owner activity with straightforward operations and applicable local registrations.',
  },
  {
    name: 'Startup India',
    summary: 'DPIIT recognition for qualifying eligible entities; it is not a separate legal structure.',
    ownership: 'Follows the underlying company, LLP, or other accepted entity.',
    liability: 'Follows the underlying entity’s legal form.',
    fit: 'Qualifying innovation-led entities seeking DPIIT recognition.',
  },
  {
    name: 'Startup',
    summary: 'A business stage or model; founders select a separate legal structure for the entity.',
    ownership: 'Depends on the company, LLP, partnership, or other chosen entity.',
    liability: 'Depends on the chosen legal form.',
    fit: 'New ventures choosing a form aligned with their team, risk, and funding plans.',
  },
  {
    name: 'Producer Company',
    summary: 'A company formed by primary producers or producer institutions for activities connected to their produce.',
    ownership: 'Qualifying producers or producer institutions are members.',
    liability: 'Company form; member liability is generally limited as provided by law.',
    fit: 'Producer groups organizing production, procurement, processing, or marketing.',
  },
  {
    name: 'Nidhi Company',
    summary: 'A public company formed for mutual benefit among members under the Nidhi framework.',
    ownership: 'Members participate in a mutual-benefit public company.',
    liability: 'Company form; member liability is generally limited as provided by law.',
    fit: 'Member-focused mutual-benefit activity that meets Nidhi rules.',
  },
  {
    name: 'Microfinance Company',
    summary: 'A lending model whose legal structure and approvals depend on the activity and applicable RBI framework.',
    ownership: 'Depends on the permitted company or not-for-profit model selected.',
    liability: 'Depends on the underlying legal form and regulatory model.',
    fit: 'Promoters planning a regulated micro-lending operation after assessing RBI requirements.',
  },
  {
    name: 'Indian Subsidiary',
    summary: 'An Indian-incorporated company owned or controlled by a foreign parent.',
    ownership: 'Indian company shares are held by a foreign parent and any permitted co-investors.',
    liability: 'Separate Indian company; liability is generally limited as provided by law.',
    fit: 'An overseas business establishing a separate Indian operating entity.',
  },
  {
    name: 'Foreign Subsidiary Company',
    summary: 'An Indian company formed as a subsidiary of a foreign parent, subject to foreign-investment rules.',
    ownership: 'A foreign parent owns all or part of the Indian company, subject to sector rules.',
    liability: 'Separate Indian company; liability is generally limited as provided by law.',
    fit: 'Foreign groups seeking a locally incorporated Indian presence.',
  },
  {
    name: 'Foreign Company',
    summary: 'A company incorporated abroad that may need Indian registration when it establishes a place of business here.',
    ownership: 'The overseas entity remains the legal entity behind the Indian presence.',
    liability: 'The foreign entity’s liability and Indian obligations depend on the presence structure.',
    fit: 'An overseas entity assessing a permitted branch, liaison, project, or other presence.',
  },
]

export const registrationGuides: Record<string, RegistrationGuide> = {
  'Company Registration': {
    overview: 'Company registration creates a formal business entity under the law that governs the chosen structure. The route, forms, ownership rules, and ongoing filings differ between a company, LLP, partnership, and proprietorship.',
    structure: 'Start by comparing ownership, liability, fundraising plans, control, and compliance effort. A company or LLP is a separate legal entity; a traditional partnership or proprietorship has a different legal and liability profile.',
    eligibility: [
      'Select a structure that permits the proposed owners and business activity.',
      'Provide valid identity details for founders, directors, partners, or nominees as applicable.',
      'Choose an available name where name reservation is part of the chosen route.',
      'Arrange a registered-office or principal-place-of-business address and supporting proof.',
    ],
    documents: [
      'Founder, director, or partner identity and address proofs.',
      'PAN or other tax identification documents required for the applicant.',
      'Registered-office proof, such as a recent utility bill, plus ownership or occupancy evidence.',
      'Structure-specific declarations, consent forms, agreements, and digital signatures.',
    ],
  },
  'Private Limited Company': {
    overview: 'A private limited company is incorporated under the Companies Act, 2013 and exists separately from its shareholders. It can hold assets and enter contracts in its own name, while members generally have liability limited to their shareholding, subject to law and their conduct.',
    structure: 'Ownership is divided into shares. The company is managed by its board of directors and must maintain statutory records and complete applicable MCA filings. Share transfers and fundraising are governed by the Act and the company’s constitutional documents.',
    eligibility: [
      'At least two members and at least two directors are generally required at incorporation.',
      'At least one director must satisfy the statutory resident-director requirement.',
      'Members may be individuals or eligible body corporates; foreign investment can bring additional FEMA and sector conditions.',
      'The proposed name, objects, and registered office must meet applicable MCA requirements.',
    ],
    documents: [
      'PAN and identity proof for Indian individual subscribers and directors; passport and additional certified documents for foreign applicants, as applicable.',
      'Recent address proof and photographs or other identity particulars requested for each proposed office-holder.',
      'Registered-office proof, occupancy or ownership evidence, and owner’s no-objection consent where relevant.',
      'Digital Signature Certificates, subscriber/director consents, declarations, and proposed MoA/AoA information.',
    ],
  },
  'LLP registration': {
    overview: 'An LLP is a body corporate and separate legal entity under the Limited Liability Partnership Act, 2008. It combines a formal entity with flexibility for partners to agree how the business is managed and how contributions and profits are shared.',
    structure: 'Partners’ rights, duties, contributions, and decision-making are set out in an LLP agreement. Designated partners handle specified statutory responsibilities. An LLP does not issue shares like a company.',
    eligibility: [
      'At least two partners are required; at least two designated partners must be individuals.',
      'At least one designated partner must meet the statutory resident-in-India requirement.',
      'A body corporate may participate through an authorised nominee, subject to filing requirements.',
      'The LLP needs a registered office in India and a proposed name that meets MCA rules.',
    ],
    documents: [
      'PAN, identity, and address proofs for partners and designated partners; passport and certified records for foreign partners, where applicable.',
      'Registered-office proof and owner consent or lease/occupancy evidence.',
      'Consent and appointment details for designated partners and authorised nominees.',
      'Digital signatures, contribution details, business objects, and the proposed LLP agreement.',
    ],
  },
  'Public Limited Company': {
    overview: 'A public limited company is incorporated under the Companies Act, 2013 and can have a broader shareholder base than a private company. Public offers and securities activity are subject to separate legal and regulatory requirements.',
    structure: 'The company is owned through shares and managed by a board. It carries the governance, disclosure, audit, and filing duties that apply to public companies; becoming public does not by itself mean the company is listed on a stock exchange.',
    eligibility: [
      'At least seven subscribers and at least three directors are generally required at incorporation.',
      'At least one director must satisfy the statutory resident-director requirement.',
      'The company name and objects must be acceptable under MCA rules.',
      'Any proposed public issue or listing requires separate securities-law analysis and approvals.',
    ],
    documents: [
      'Identity, address, and tax proofs for all subscribers and proposed directors.',
      'Registered-office address evidence and owner consent or occupancy documents.',
      'Digital signatures, director consents, declarations, and subscriber particulars.',
      'Proposed memorandum and articles, capital details, and any additional regulatory approvals relevant to the activity.',
    ],
  },
  'One Person Company': {
    overview: 'An OPC is a private company with one member. It gives a sole founder a corporate entity while preserving single-member ownership, and the incorporation process includes identifying a nominee as required by the Companies Act and rules.',
    structure: 'The member holds the company’s shares and appoints at least one director. A nominee is named to take the member’s place in specified circumstances; the nominee’s consent and particulars form part of the incorporation process.',
    eligibility: [
      'One eligible individual forms the company as its sole member.',
      'A nominee must be identified and provide the required consent.',
      'The proposed company must use the OPC name format and satisfy current MCA conditions.',
      'Conversion or eligibility restrictions can depend on current rules and the company’s financial position.',
    ],
    documents: [
      'Member and director PAN, identity proof, address proof, and contact details.',
      'Nominee identity and address proofs and signed nominee consent.',
      'Registered-office proof and owner consent or occupancy documents.',
      'Digital signature, declarations, and proposed MoA/AoA information.',
    ],
  },
  'Partnership Firm': {
    overview: 'A partnership firm is created when two or more persons agree to carry on a business and share its profits. A written deed records the arrangement. Registration with the state Registrar of Firms is available and is commonly recommended because non-registration can restrict enforcement of certain contractual rights.',
    structure: 'Partners share management and profits according to their deed. Unlike a company or LLP, partners generally have personal, joint liability for firm obligations. The firm’s name and registration process are handled under the applicable state rules.',
    eligibility: [
      'At least two partners are required, subject to the applicable law and business activity.',
      'Partners must be legally capable of entering into the partnership agreement.',
      'The firm name and proposed activity must comply with applicable restrictions.',
      'State-level filing, stamp duty, and licensing requirements may differ.',
    ],
    documents: [
      'Signed partnership deed setting out the firm name, business, contributions, profit share, and partner roles.',
      'PAN and identity/address proofs for all partners.',
      'Proof of the firm’s principal place of business and owner consent where needed.',
      'Application details, photographs or signatures, and state-specific registration declarations.',
    ],
  },
  'Sole Proprietorship': {
    overview: 'A sole proprietorship is a business owned by one individual; it is not incorporated as a separate company. The proprietor and business are legally closely connected, so the proprietor generally bears the business’s liabilities personally.',
    structure: 'There is one owner, who controls operations and reports business income as required. There is no single central incorporation certificate for every proprietorship: registrations depend on the activity, location, employees, and turnover.',
    eligibility: [
      'One individual owns and operates the business.',
      'The proprietor must meet the requirements for the selected activity and local licences.',
      'GST, Shops and Establishments, professional tax, or sector licences may apply depending on facts and state.',
    ],
    documents: [
      'Proprietor PAN and identity/address proof.',
      'Proof of business address, such as a utility bill and ownership, rent, or owner-consent document.',
      'Bank account evidence and business-name proof where requested by the bank or authority.',
      'Activity-specific registrations or licences, such as GST or local establishment registration where applicable.',
    ],
  },
  'Startup India': {
    overview: 'Startup India recognition is a government recognition route, not a separate legal form. An eligible business first exists as an accepted entity type, then applies for DPIIT recognition using its own business and incorporation details.',
    structure: 'The underlying entity may be a private limited company, LLP, registered partnership, or another entity type permitted by the current DPIIT rules. Recognition does not replace incorporation, tax registrations, or sector licences.',
    eligibility: [
      'The entity must use a legal form accepted under the current DPIIT recognition guidelines.',
      'The current Startup India guidance sets age and turnover limits, with specific treatment for DeepTech startups.',
      'The business should work toward innovation, improvement, scalability, employment, or wealth creation.',
      'An entity formed by splitting up or reconstructing an existing business is generally excluded.',
    ],
    documents: [
      'Certificate or proof of incorporation/registration and entity PAN.',
      'Authorised representative details and the entity’s active email and mobile number.',
      'A concise description of the product, service, innovation, or improvement and its market use.',
      'Supporting evidence requested by the live DPIIT application; criteria and accepted evidence can change.',
    ],
  },
  Startup: {
    overview: '“Startup” describes a stage or business model, not one legal structure. Founders normally select a company, LLP, partnership, or proprietorship first; DPIIT recognition is a separate application for eligible entities.',
    structure: 'The best structure depends on founder count, liability preference, investment plans, governance, and ongoing compliance. A private company is often considered for share-based investment; an LLP may suit partner-led operations.',
    eligibility: [
      'Choose an underlying legal form that matches the founders and business activity.',
      'Check separate DPIIT recognition conditions if government startup recognition is sought.',
      'Confirm sector licences and state registrations before beginning regulated activity.',
    ],
    documents: [
      'Identity and tax details for founders or partners.',
      'Formation documents for the selected entity, such as incorporation proof, partnership deed, or LLP agreement.',
      'Registered-office or business-address evidence.',
      'A short product/service description and ownership details for any recognition application.',
    ],
  },
  'Nidhi Company': {
    overview: 'A Nidhi company is a public company formed for mutual benefit among its members and operates under the Companies Act and Nidhi rules. Its activities and member-facing deposit/loan practices are restricted by the applicable framework.',
    structure: 'The entity is a public company with members and directors. It is not a general-purpose lending licence; promoters should check current MCA conditions, permitted activities, thresholds, and filing timelines before incorporation and commencement.',
    eligibility: [
      'The proposed entity must satisfy public-company incorporation requirements.',
      'Its objects and operations must fit the Nidhi mutual-benefit framework.',
      'Membership, capital, and post-incorporation conditions are governed by current rules and should be confirmed before launch.',
    ],
    documents: [
      'Subscriber and director identity, address, and tax records.',
      'Registered-office proof and owner consent or occupancy evidence.',
      'Proposed MoA/AoA with objects consistent with the intended Nidhi activity.',
      'Member, capital, and declaration records required by the applicable MCA filing and subsequent compliance.',
    ],
  },
  'Microfinance Company': {
    overview: '“Microfinance company” can refer to different legal and regulatory models. A lending institution may need to comply with RBI requirements, while a not-for-profit model has a different framework; the right route depends on the planned activities and funding.',
    structure: 'Do not treat a standard company incorporation as permission to lend. Promoters should determine whether the business falls under the RBI’s NBFC-MFI framework or another permitted model, then assess capital, governance, pricing, and reporting requirements with qualified advice.',
    eligibility: [
      'The promoters and proposed activity must meet the requirements of the chosen entity and regulatory route.',
      'RBI registration or other approvals may be required before carrying on regulated lending.',
      'Capital, ownership, management, and customer-protection conditions depend on the selected model and current rules.',
    ],
    documents: [
      'Promoter, director, and beneficial-owner identity and financial background details.',
      'Business plan, proposed lending model, target customers, and source-of-funds details.',
      'Entity incorporation papers, office proof, board/owner resolutions, and capital evidence.',
      'RBI or other regulator forms and supporting documents if the selected activity requires approval.',
    ],
  },
  'Producer Company': {
    overview: 'A Producer Company is a company form for primary producers and producer institutions, with objects connected to production, harvesting, procurement, pooling, marketing, or related member services.',
    structure: 'Members are producers or qualifying producer institutions. The company is governed by its articles and a board; the Companies Act contains special provisions for producer companies in addition to general company requirements.',
    eligibility: [
      'The proposed members must qualify as primary producers or producer institutions under the Act.',
      'The statutory minimum member composition and director requirements must be met.',
      'The objects should remain connected to permitted producer-company activities.',
    ],
    documents: [
      'Identity, address, and tax proofs for proposed members and directors.',
      'Evidence supporting producer status or institutional eligibility.',
      'Registered-office evidence and owner consent or occupancy documents.',
      'Member and share details, proposed MoA/AoA, declarations, and digital signatures.',
    ],
  },
  'Indian Subsidiary': {
    overview: 'An Indian subsidiary is an Indian-incorporated company whose ownership is held or controlled by a parent entity. It is legally distinct from its parent and must follow Indian company law and any applicable foreign-investment rules.',
    structure: 'The subsidiary may be wholly owned or have other shareholders, depending on sector rules and business goals. Foreign investment can fall under the automatic or government route, and FEMA reporting may apply after investment.',
    eligibility: [
      'Meet the member, director, and resident-director requirements for the selected Indian company type.',
      'Confirm whether the business sector permits the proposed foreign ownership and whether approval is required.',
      'Provide parent-company authority for the investment and appointment of its representatives.',
    ],
    documents: [
      'Parent entity incorporation certificate, constitutional documents, and current registered-office evidence.',
      'Board resolution approving the investment and naming authorised representatives.',
      'Certified identity/address proofs and passport details for foreign nominees or directors, where relevant.',
      'Indian registered-office proof, proposed MoA/AoA, and foreign-investment/beneficial-owner details.',
    ],
  },
  'Foreign Subsidiary Company': {
    overview: 'This route is commonly used when a foreign parent wants a separately incorporated Indian subsidiary. The Indian entity receives its own incorporation record, while ownership and funding links it to the parent.',
    structure: 'The company follows the Indian structure selected by the founders, usually a private company for a closely held subsidiary. Parent ownership, board appointments, funding, and inter-company arrangements should be documented and reviewed for company-law and FEMA compliance.',
    eligibility: [
      'The parent and proposed Indian entity must be eligible to invest in the relevant sector.',
      'The Indian company must meet the member/director and resident-director conditions for its chosen form.',
      'Government approval may be needed for restricted activities or ownership patterns.',
    ],
    documents: [
      'Foreign parent incorporation and constitutional records, appropriately certified or apostilled as applicable.',
      'Parent board resolution, authorised signatory details, and ownership chart up to the ultimate beneficial owners.',
      'Passport and address proof for foreign directors or nominees, with required translations/certifications.',
      'Indian office proof, proposed incorporation documents, and foreign-investment declarations.',
    ],
  },
  'Foreign Company': {
    overview: 'A foreign company is incorporated outside India. If it establishes a place of business in India, it may have registration, filing, and reporting duties under Indian company law, in addition to RBI/FEMA rules that may apply to the chosen presence.',
    structure: 'A foreign company presence is different from an Indian subsidiary: the overseas entity remains the legal parent, while a subsidiary is a new Indian company. Branch, liaison, or project-office routes have distinct permitted activities and approval conditions.',
    eligibility: [
      'The overseas entity must be validly incorporated and authorised to establish the proposed Indian presence.',
      'The selected presence and activities must be permitted under company law, FEMA, and sector-specific rules.',
      'Prior RBI or government approval may apply depending on the office type and activity.',
    ],
    documents: [
      'Certificate of incorporation and constitutional documents of the foreign entity.',
      'Current director and registered-office details, plus authorised representative information.',
      'Board resolution describing the Indian presence, activities, and authorised signatories.',
      'Indian office address proof and certified/apostilled documents with translations where required.',
    ],
  },
}

export const defaultRegistrationGuide = registrationGuides['Company Registration']

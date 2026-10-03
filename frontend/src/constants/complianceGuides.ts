import type { RegistrationCategoryGuide } from './registrationCategoryGuides'

export const complianceCategoryGuides: Record<string, RegistrationCategoryGuide> = {
  'Compliance Calendar': {
    overview: 'A compliance calendar maps recurring statutory, tax, and governance obligations to the entity and financial period. Deadlines differ for companies, LLPs, firms, and regulated activities; a calendar should be tailored to the entity rather than treated as a one-size-fits-all list.',
    structure: 'Company calendars commonly include board and member meetings, annual accounts and returns, and applicable tax filings. LLP calendars include annual return and statement-of-account filings. GST, TDS, payroll, licence renewals, and event-based filings are added only when they apply.',
    eligibility: [
      'Identify the legal form, financial year, state registrations, tax registrations, and regulated activities.',
      'Confirm whether the entity is active, newly incorporated, dormant, or has a filing default.',
      'Check applicable due dates against current MCA, tax, labour, and local-authority rules.',
    ],
    documents: [
      'Entity incorporation/registration documents, PAN, TAN, and current master data.',
      'Previous financial statements, annual returns, tax returns, and filing acknowledgements.',
      'GST, TDS, payroll, licence, and state registration details relevant to the business.',
      'Board/member records, accounting close dates, and responsible contact details.',
    ],
    highlights: ['Build deadlines around entity and activity', 'Track recurring and event-triggered filings', 'Review statutory changes each filing period'],
    types: [
      { name: 'Company Compliance Calendar', summary: 'A tailored schedule for board, shareholder, ROC, and applicable tax filings.', structure: 'Combines corporate governance dates with annual company and tax filings.', eligibility: 'Relevant to companies registered under the Companies Act; applicable filings vary by company type and status.', documents: 'Company master data, prior filings, financial year details, tax registrations, and meeting records.' },
      { name: 'LLP Compliance Calendar', summary: 'A recurring due-date schedule for LLP accounts, annual returns, tax, and partner events.', structure: 'Includes LLP annual forms and adds tax or event-based obligations where applicable.', eligibility: 'Relevant to registered LLPs, including those with no business activity unless formally closed or exempted.', documents: 'LLPIN, partner/designated-partner records, prior Form 8/11 and tax filings, accounts, and event records.' },
      { name: 'Annual Filing Calendar', summary: 'A cross-entity schedule of statutory and tax deadlines for the selected reporting period.', structure: 'Separates annual, periodic, and event-triggered deadlines by authority and responsible person.', eligibility: 'Designed around the entity’s registrations, transactions, workforce, and financial year.', documents: 'Entity profile, registration numbers, previous filing history, payroll/tax details, and accounting calendar.' },
    ],
  },
  Compliance: {
    overview: 'Ongoing compliance keeps an organisation’s statutory, financial, and tax records current after formation. A company, LLP, trust, society, partnership, or sole proprietorship follows a different set of duties; some filings apply even when activity or revenue is low.',
    structure: 'Company compliance includes governance, accounts, annual returns, and event-triggered MCA filings. LLPs file annual statements and returns and report changes. Trusts, societies, firms, and proprietorships follow their governing documents plus tax, state, and activity-specific obligations.',
    eligibility: [
      'Identify the registered legal form and all active registrations before preparing a checklist.',
      'Review current filing status, financial year, business activity, and any past defaults.',
      'Determine which MCA, income-tax, GST, TDS, payroll, state, and sector filings actually apply.',
      'Assign authorised signatories and keep financial statements and governance records ready.',
    ],
    documents: [
      'Incorporation or registration certificate, PAN/TAN, and current entity master data.',
      'Books of account, bank statements, invoices, financial statements, and tax-credit records.',
      'Board, partner, trustee, or member resolutions; minutes; registers; and changes during the year.',
      'Previous ROC, income-tax, GST, TDS, payroll, and licence filings with payment acknowledgements.',
    ],
    highlights: ['Separate recurring filings from event-based filings', 'Reconcile accounting and tax records before filing', 'Check each entity’s own statutory timetable'],
    types: [
      { name: 'Private Limited Company Compliance', summary: 'Annual governance, financial statements, annual returns, and applicable tax filings.', structure: 'Typically includes board/member processes, statutory books, ROC annual forms, and activity-based returns.', eligibility: 'Applies to incorporated companies; specific filings depend on company class, activity, and exemptions.', documents: 'Audited financials where applicable, board/AGM records, registers, director details, and prior filings.' },
      { name: 'LLP Annual Compliance', summary: 'Annual accounts and return filings plus tax and partner-change reporting where applicable.', structure: 'Includes annual LLP forms and an LLP agreement that should reflect partner or contribution changes.', eligibility: 'Applies to registered LLPs; required filing obligations can continue even when the LLP has no revenue.', documents: 'Books, financial statements, partner/designated-partner details, LLP agreement, and prior annual filings.' },
      { name: 'Sole Proprietorship / Partnership Compliance', summary: 'Tax, accounting, employee, local establishment, and sector filings that apply to the owner or firm.', structure: 'There is no universal ROC annual return for a proprietorship; partnership requirements depend on its deed and registrations.', eligibility: 'Depends on income, turnover, employees, state, business activity, and registrations held.', documents: 'Books, invoices, bank statements, deed or owner details, tax records, payroll, and local licence evidence.' },
      { name: 'NGO, Trust, and Society Compliance', summary: 'Governance, accounts, audit, tax, donor, and grant reporting under the selected non-profit form.', structure: 'Trust deeds, society rules, or Section 8 constitutional documents set governance alongside applicable statutory law.', eligibility: 'Obligations depend on legal form, state, tax approvals, grants, donations, and foreign contributions.', documents: 'Governing-body minutes, audited accounts, donor records, approval certificates, activity reports, and prior filings.' },
      { name: 'Nidhi Company Compliance', summary: 'Company filings plus additional reporting and member-related obligations under Nidhi rules.', structure: 'A public-company structure with mutual-benefit membership and Nidhi-specific conditions.', eligibility: 'Only entities within the Nidhi framework; current member, deposit, and filing requirements must be checked.', documents: 'Company annual records, member/deposit ledgers, financial statements, board records, and applicable Nidhi returns.' },
      { name: 'Bookkeeping and Accounting', summary: 'Ongoing recording, categorisation, and reconciliation of an organisation’s transactions.', structure: 'Records are organised around the entity’s accounting basis, reporting period, and tax registrations.', eligibility: 'Useful for any operating entity; statutory books, audit, and retention requirements vary by legal form and activity.', documents: 'Sales and purchase invoices, bank statements, expense proofs, payroll, loan records, and prior financial statements.' },
      { name: 'Form INC-20A', summary: 'A commencement-of-business declaration for companies to which the statutory requirement applies.', structure: 'The company files the prescribed MCA declaration after subscribers pay their agreed share value and before commencing business or borrowing, where required.', eligibility: 'Applies to qualifying companies with share capital under current Companies Act requirements; applicability and deadline depend on the case.', documents: 'Subscriber payment evidence, bank statement, board authorisation, company identifiers, and current MCA form attachments.' },
      { name: 'Partnership Firm Annual Compliance', summary: 'Recurring tax, accounting, employee, local establishment, and deed-related duties for a partnership.', structure: 'Obligations follow the partnership deed, tax rules, registrations held, workforce, and state-level requirements.', eligibility: 'Depends on income, turnover, employees, location, activity, and registrations held by the firm.', documents: 'Partnership deed, books, bank statements, partner details, tax records, payroll, and local licence proofs.' },
      { name: 'Partnership Firm Tax Return Filing', summary: 'Annual tax reporting for a partnership firm and partner allocations where applicable.', structure: 'The return reflects firm accounts, income, deductions, and partner remuneration or profit shares under the deed and tax rules.', eligibility: 'Return type, due date, and audit requirement depend on the firm’s income, turnover, and current tax provisions.', documents: 'Partnership deed, PAN, books, financial statements, bank records, TDS certificates, and partner details.' },
    ],
  },
  'MCA Services': {
    overview: 'MCA services are electronic applications and filings used to reserve names, maintain director records, obtain or update identification, and report company or LLP information. The correct form depends on the entity, event, and current MCA portal instructions.',
    structure: 'Some filings are transactional, such as name reservation or director changes; others are periodic or identity-related. Digital signatures and verified business-user accounts are commonly needed for signed filings.',
    eligibility: [
      'Use the correct company/LLP identity and authorised business-user profile.',
      'Confirm the applicant or signatory is authorised by the entity for the requested service.',
      'Check name availability and naming rules before submitting a reservation request.',
      'Meet current identity, digital-signature, and supporting-document requirements for the selected form.',
    ],
    documents: [
      'CIN/LLPIN, entity PAN, and current registered-office details.',
      'Director/partner identity, DIN/DPIN, email, mobile, and digital-signature information as applicable.',
      'Board or partner resolution authorising the filing where required.',
      'Event-specific attachments, declarations, and proof documents required by the live MCA form.',
    ],
    highlights: ['Choose the filing based on the requested MCA service', 'Keep signatory and entity data consistent', 'Use current MCA V3 instructions and form versions'],
    types: [
      { name: 'Company Name Approval', summary: 'Reservation or approval of a proposed company name before or during incorporation.', structure: 'Name applications are filed through the applicable MCA service and remain subject to availability and naming rules.', eligibility: 'The applicant must be authorised and the proposed name must satisfy distinctiveness and restricted-word conditions.', documents: 'Proposed names, business objects, applicant/entity details, and NOCs or trademark consent where required.' },
      { name: 'Director KYC', summary: 'Periodic or event-driven verification and updating of director identity and contact details.', structure: 'A director’s KYC is linked to their DIN and MCA profile; applicable filing method depends on the current rules.', eligibility: 'Directors holding DINs must comply when the applicable KYC requirement is triggered.', documents: 'PAN, identity and address proof, verified email/mobile, photograph, and digital-signature details.' },
      { name: 'DIN Services', summary: 'Applications or changes relating to a Director Identification Number.', structure: 'DIN is a unique identifier for an individual appointed or proposed as a company director.', eligibility: 'Applicant must meet director eligibility rules and provide accurate identity information.', documents: 'Identity/address proofs, declarations, photograph, contact details, and company/appointment records as applicable.' },
      { name: 'MCA Filing', summary: 'Electronic filing of statutory company or LLP forms, returns, notices, and event updates.', structure: 'The form and attachments depend on the entity type, filing event, and applicable law.', eligibility: 'An authorised signatory or professional submits the required form through the relevant MCA service.', documents: 'Entity identifiers, approved digital signatures, resolutions, accounts, event evidence, and form-specific attachments.' },
    ],
  },
  'Event Based Compliance': {
    overview: 'Event-based compliance is triggered by a change or transaction, rather than a recurring calendar date. Examples include a director appointment, office relocation, share allotment, capital change, or LLP partner update.',
    structure: 'The entity first approves the action under its governing law and documents. It then files the applicable notice or form with the MCA or other authority within the prescribed period and updates internal records and related registrations.',
    eligibility: [
      'Confirm the proposed event is permitted by the entity’s law, constitutional documents, and approvals.',
      'Obtain board, shareholder, partner, or member approval where required before filing.',
      'File within the deadline applicable to the specific event and authority.',
      'Update affected tax, bank, licence, and beneficial-owner records after approval.',
    ],
    documents: [
      'Board/member/partner resolutions and meeting minutes approving the event.',
      'Current entity records, CIN/LLPIN, and authorised signatory details.',
      'Event proof such as appointment consent, resignation letter, lease/address proof, valuation, or allotment records.',
      'Updated registers, agreement, constitutional documents, and authority-specific e-form attachments.',
    ],
    highlights: ['Identify filing deadlines when an event is planned', 'Record approvals before implementation', 'Update MCA and related registrations consistently'],
    types: [
      { name: 'Change in Directors', summary: 'Appointment, resignation, or change in director particulars reported to the MCA.', structure: 'The company approves the change and files the relevant director/event forms; internal registers are updated.', eligibility: 'Appointment must meet director requirements and be approved under the company’s governance documents.', documents: 'Board/shareholder resolution as applicable, consent, resignation letter, DIN/KYC records, and appointment particulars.' },
      { name: 'Change of Registered Office', summary: 'A company or LLP reports a change in its registered office address.', structure: 'Approval and filing steps depend on whether the move stays within local limits, crosses jurisdiction, or changes the state.', eligibility: 'The entity must have lawful occupancy at the new address and follow the approval route for the distance/jurisdiction of the move.', documents: 'Resolution/consent, lease or ownership proof, recent utility bill, owner NOC, and prescribed filings.' },
      { name: 'Share Allotment', summary: 'Issue of new shares after corporate approvals and applicable securities-law steps.', structure: 'Board/shareholder approvals, offer and allotment records, payment evidence, and return filing update the company’s share capital.', eligibility: 'The company must have authority under its MoA/AoA and comply with applicable private-placement, rights, or other issue rules.', documents: 'Approvals, offer letters, subscriber details, valuation where required, payment proof, allotment resolution, and updated register.' },
      { name: 'Increase in Authorised Capital', summary: 'Increase of the maximum share capital permitted by the company’s constitutional documents.', structure: 'Members approve the alteration and the company files the required resolution and capital-change form.', eligibility: 'The company must follow its articles, obtain required member approval, and pay the prescribed filing/stamp fees.', documents: 'Altered MoA clause, shareholder resolution, meeting notice/minutes, current capital details, and e-form attachments.' },
    ],
  },
  'Convert Your Business': {
    overview: 'Converting a business changes its legal form so its ownership, liability, or operating framework can match new plans. Conversion is not just a name change: approvals, asset and contract continuity, tax, licences, and existing liabilities must be reviewed.',
    structure: 'The available route depends on the starting and destination forms. Some conversions require statutory eligibility and continuity of owners; others involve incorporating a new entity and transferring business assets, contracts, employees, and registrations.',
    eligibility: [
      'Confirm the source entity is eligible for the chosen conversion route and has current filings up to date.',
      'Obtain approvals from owners, partners, shareholders, creditors, or regulators where required.',
      'Check tax, stamp-duty, lender, contract, licence, and employee consequences before transferring operations.',
      'Meet the destination structure’s member, director, capital, and registered-office requirements.',
    ],
    documents: [
      'Source-entity formation records, constitutional documents, and current MCA/state filings.',
      'Owner/partner/shareholder approvals, resolutions, and consent records.',
      'Audited or current financial statements, asset/liability schedules, and creditor/lender details.',
      'Destination entity incorporation or conversion documents, updated agreements, and transfer/novation records.',
      'Tax, GST, bank, licence, employee, and contract records that need amendment or migration.',
    ],
    highlights: ['Choose a route after checking legal and tax consequences', 'Bring source filings up to date first', 'Plan transfers and licence updates before the effective date'],
    types: [
      { name: 'Proprietorship to Private Limited', summary: 'Move a sole-owner business into a company with shares, directors, and a separate legal identity.', structure: 'Usually involves incorporating a company and transferring the business, assets, contracts, and registrations; it is not simply a name conversion.', eligibility: 'Founders must satisfy private-company requirements and obtain consents for any transferred assets, contracts, and licences.', documents: 'Proprietor PAN/financials, company incorporation records, asset/liability list, transfer agreements, customer/vendor consents, and updated tax/licence records.' },
      { name: 'Partnership to LLP', summary: 'Convert an eligible partnership into an LLP with designated partners and an LLP agreement.', structure: 'A statutory conversion route may preserve business continuity when conditions are met; partner composition and filings must be checked.', eligibility: 'The partnership and partners must meet LLP Act conversion requirements and file the prescribed statements and consents.', documents: 'Partnership deed, partner consents, firm registration details, financial statements, creditor details, proposed LLP agreement, and registered-office proof.' },
      { name: 'Private Limited to LLP', summary: 'Move an eligible company into an LLP, subject to statutory and ownership conditions.', structure: 'Requires company and member approvals, creditor/authority processes, and prescribed conversion filings; consequences for assets and contracts should be reviewed.', eligibility: 'The company must meet current statutory conversion conditions, including member/creditor and security-interest requirements where applicable.', documents: 'Company incorporation records, audited accounts, member/creditor approvals, secured-creditor evidence, asset/liability schedule, and proposed LLP agreement.' },
      { name: 'LLP to Private Limited', summary: 'Move an LLP’s business into a company structure for share ownership or fundraising plans.', structure: 'The route may involve statutory conversion when available or incorporation of a company followed by business transfer; continuity and tax effects differ.', eligibility: 'Partners must approve the plan and the destination company must satisfy member, director, and capital rules.', documents: 'LLP agreement, partner approvals, LLP accounts, asset/liability schedule, company incorporation papers, transfer instruments, and updated registrations.' },
    ],
  },
}

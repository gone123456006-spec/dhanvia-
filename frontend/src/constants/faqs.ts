// ─── Page FAQs ──────────────────────────────────────────────────────────────
// Five questions per page. Registration and service detail pages build theirs from the service guide.

export type FaqItem = [question: string, answer: string]

export const homeFaqs: FaqItem[] = [
  [
    'What services does Dhanvia offer?',
    'Dhanvia helps with company and business registrations, GST, trademark and other IPR filings, tax and compliance work, plus loans, insurance, and mutual fund investments, so you can manage your business and personal finances in one place.',
  ],
  [
    'What is included in the Rs.1,999/- company registration package?',
    'The package covers DIN and DSC for two directors, name approval, drafting of MoA and AoA, MCA SPICe+ filing, registration fees and stamp duty, the Certificate of Incorporation with CIN, company PAN and TAN, and post-incorporation compliance guidance.',
  ],
  [
    'How much time is needed to set up a private limited company in India?',
    'Registration often takes around 7 to 10 working days after the required documents are submitted. The timeline can vary depending on name approval and government processing.',
  ],
  [
    'Do I need to visit an office or be physically present?',
    'No. Most registrations and filings can be completed online. You can share documents digitally, sign with a digital signature where needed, and speak to our team by phone or WhatsApp.',
  ],
  [
    'How do I get started?',
    'Fill in the consultation form or tap Let\'s Talk to call us. An expert will understand your requirement, share the documents needed and the fees involved, and then take care of the filing for you.',
  ],
]

export const contactFaqs: FaqItem[] = [
  [
    'How soon will Dhanvia respond to my request?',
    'Our team usually replies within a few hours on working days. Requests received late in the evening or on holidays are answered on the next working day.',
  ],
  [
    'What details should I include in my message?',
    'Mention the service you need, your business type or current registration status, your city, and any deadline you are working to. This helps us share the right document list and pricing in the first reply.',
  ],
  [
    'Can I speak to someone on call or WhatsApp instead?',
    'Yes. Tap Let\'s Talk to call +91 96819 22021, or message the same number on WhatsApp. You can also submit the form and ask us to call you back.',
  ],
  [
    'Is there a charge for the first consultation?',
    'No. Understanding your requirement and suggesting the right registration, compliance, loan, insurance, or investment option is free. Fees are confirmed with you before any paid work starts.',
  ],
  [
    'How is the information I share used?',
    'Your details are used to respond to your request and provide the service you ask for. Documents are shared only where a filing, lender, or insurer needs them for your application.',
  ],
]

export const servicesFaqs: FaqItem[] = [
  [
    'How do I choose the right loan for my need?',
    'It depends on the purpose, amount, and what you can offer as security. Home loans and loans against property or shares usually carry lower rates, while personal and business loans are quicker but cost more. Our team compares options from partner lenders for you.',
  ],
  [
    'Does Dhanvia decide loan approval or the interest rate?',
    'No. Approval, eligibility, interest rate, and fees are decided by the lender based on your income, credit score, and documents. We help you prepare the application and choose a suitable lender.',
  ],
  [
    'Which insurance should I buy first?',
    'For most families, term life insurance and health insurance come first, as they protect against the biggest financial risks. Car and bike insurance are needed by law for your vehicles. We help compare cover, premiums, and claim terms.',
  ],
  [
    'Are mutual fund returns guaranteed?',
    'No. Mutual fund investments are subject to market risks and returns can go up or down. Read all scheme-related documents carefully, and choose funds that match your goal, time horizon, and risk comfort.',
  ],
  [
    'How do I start a registration, compliance, IPR, or tax service?',
    'Pick the service from the tables above and open View details to see what it covers, who it suits, and the documents usually needed. Then send an enquiry and our expert will confirm the checklist and fees.',
  ],
]

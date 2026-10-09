export interface MoneyProduct {
  name: string
  summary: string
  /** Short facts shown as the "Key details" column. */
  details: string[]
  bestFor: string
}

export interface MoneyProductGroup {
  id: string
  label: string
  intro: string
  /** Column heading for `bestFor`. */
  bestForLabel: string
  products: MoneyProduct[]
  note: string
}

export const moneyProductGroups: MoneyProductGroup[] = [
  {
    id: 'loans',
    label: 'Loans',
    intro: 'Secured and unsecured loans for homes, personal needs, and business growth. We help you compare lenders and prepare a complete application.',
    bestForLabel: 'Best for',
    products: [
      {
        name: 'Loan Against Shares',
        summary: 'Borrow against listed shares held in your demat account while you keep ownership of them.',
        details: ['Shares are pledged, not sold', 'Limit is a share of the pledged value, as set by the lender', 'Interest is usually charged only on the amount used'],
        bestFor: 'Short-term needs without selling investments',
      },
      {
        name: 'Home Loan',
        summary: 'Finance to buy, build, or extend a home, repaid in monthly instalments (EMIs).',
        details: ['Long tenures, often up to 30 years', 'Fixed or floating interest rates', 'Interest and principal may qualify for tax deductions'],
        bestFor: 'Buying or building a home',
      },
      {
        name: 'Loan Against Property',
        summary: 'A secured loan against residential or commercial property you own.',
        details: ['Usually larger amounts than a personal loan', 'Longer repayment periods', 'Property stays with you while it is mortgaged'],
        bestFor: 'Large expenses or business funding',
      },
      {
        name: 'Home Loan Balance Transfer',
        summary: 'Move your existing home loan to another lender offering better terms.',
        details: ['Can lower your interest rate or EMI', 'Top-up loan may be available', 'Check processing and foreclosure charges first'],
        bestFor: 'Existing borrowers paying a high rate',
      },
      {
        name: 'Loan Against Mutual Funds',
        summary: 'Borrow by pledging your mutual fund units, so your investments keep growing.',
        details: ['Units are pledged, not redeemed', 'Limit depends on fund type (equity or debt)', 'Quick, largely digital process'],
        bestFor: 'Liquidity without breaking your SIPs',
      },
      {
        name: 'Personal Loan',
        summary: 'An unsecured loan for any personal purpose, with no collateral required.',
        details: ['No security or guarantor needed', 'Shorter tenures, typically 1 to 5 years', 'Approval depends on income and credit score'],
        bestFor: 'Weddings, travel, medical or other expenses',
      },
      {
        name: 'Business Loan',
        summary: 'Working capital or term funding for proprietors, firms, and companies.',
        details: ['Secured and unsecured options', 'Based on business vintage, turnover and filings', 'GST and ITR records strengthen the application'],
        bestFor: 'Growing or running your business',
      },
    ],
    note: 'Loan amount, interest rate, and approval are decided by the lender based on your eligibility and credit profile.',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    intro: 'Protect your family, health, and vehicles. We help you compare cover, premiums, and claim terms before you buy.',
    bestForLabel: 'Best for',
    products: [
      {
        name: 'Car Insurance',
        summary: 'Covers your car and your liability to others after an accident, theft, or damage.',
        details: ['Third-party cover is mandatory by law', 'Comprehensive plans also cover own damage', 'Add-ons such as zero depreciation and roadside assistance'],
        bestFor: 'Every car owner',
      },
      {
        name: 'Bike Insurance',
        summary: 'Protection for two-wheelers against accidents, theft, and third-party liability.',
        details: ['Third-party cover is mandatory by law', 'Comprehensive plans cover own damage too', 'No-claim bonus lowers renewal premiums'],
        bestFor: 'Every two-wheeler owner',
      },
      {
        name: 'Health Insurance',
        summary: 'Pays hospital and medical bills for you or your family, up to the sum insured.',
        details: ['Cashless treatment at network hospitals', 'Individual and family floater plans', 'Check waiting periods for existing illnesses'],
        bestFor: 'Families and individuals of all ages',
      },
      {
        name: 'Life Insurance',
        summary: 'Financial protection for your family if something happens to you.',
        details: ['Term plans give high cover at low premiums', 'Savings plans combine cover with returns', 'Premiums may qualify for tax benefits'],
        bestFor: 'Earning members with dependants',
      },
    ],
    note: 'Cover, exclusions, and claim decisions follow the insurer’s policy wording. Read it carefully before you buy.',
  },
  {
    id: 'mutual-funds',
    label: 'Mutual Funds',
    intro: 'Invest through SIPs or lump sums in funds matched to your goals, time horizon, and comfort with risk.',
    bestForLabel: 'Suitable for',
    products: [
      {
        name: 'Equity Funds',
        summary: 'Invest mainly in company shares, aiming for long-term growth.',
        details: ['Large, mid, small and flexi-cap options', 'Higher risk with higher growth potential', 'Ideal for 5+ year goals'],
        bestFor: 'Long-term wealth creation',
      },
      {
        name: 'Debt Funds',
        summary: 'Invest in bonds, government securities, and money-market instruments.',
        details: ['Steadier than equity funds', 'Liquid and short-duration options', 'Affected by interest-rate and credit risk'],
        bestFor: 'Stable returns and short-term goals',
      },
      {
        name: 'Hybrid Funds',
        summary: 'Mix equity and debt in one fund to balance growth and stability.',
        details: ['Built-in diversification', 'Balanced advantage and aggressive options', 'Moderate risk'],
        bestFor: 'First-time investors',
      },
      {
        name: 'Index Funds & ETFs',
        summary: 'Track a market index such as the Nifty 50 or Sensex at a low cost.',
        details: ['Low expense ratios', 'Returns follow the index', 'No fund-manager selection risk'],
        bestFor: 'Low-cost, hands-off investing',
      },
      {
        name: 'ELSS (Tax Saver) Funds',
        summary: 'Equity funds that offer a tax deduction under the old tax regime.',
        details: ['Shortest lock-in among tax-saving options: 3 years', 'Equity-linked, so returns vary', 'Can be started with a SIP'],
        bestFor: 'Saving tax while investing',
      },
      {
        name: 'SIP (Systematic Investment Plan)',
        summary: 'Invest a fixed amount every month in any of the funds above.',
        details: ['Start with a small monthly amount', 'Averages your purchase cost over time', 'Pause, increase, or stop anytime'],
        bestFor: 'Disciplined, regular investing',
      },
    ],
    note: 'Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing.',
  },
]

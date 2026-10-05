const featuredServices = [
  {
    title: 'Mutual Funds',
    image: '/IMG_0945-card.webp',
    imageAlt: 'Mutual fund investing and long-term wealth building',
    description: 'Mutual funds pool investor money to buy shares, bonds, or a mix of assets. Explore equity, debt, hybrid, and index funds based on your goals and time horizon. Compare each fund’s objective, risks, and fees before deciding. Systematic plans can spread contributions over time, but do not guarantee returns. Market values can fall, and you may receive less than you invested. Read scheme documents and assess your risk comfort.',
  },
  {
    title: 'Loans',
    image: '/IMG_0947-card.webp',
    imageAlt: 'Home, personal, and business loan solutions',
    description: 'Explore home, personal, and business loans for planned purchases or working capital. Compare interest rates, total borrowing cost, processing fees, repayment period, and monthly instalments. Lenders may assess income, existing debts, credit history, loan purpose, and collateral. Check whether rates can change, how late payments are handled, and whether prepayment fees apply. Borrow only what fits your budget. Approval and final terms depend on lender assessment.',
  },
  {
    title: 'Insurance',
    image: '/IMG_0953-card.webp',
    imageAlt: 'Insurance options for health, life, home, and vehicles',
    description: 'Compare health, life, motor, and home insurance based on the risks you want to cover. Review the benefit or sum insured, premium, policy term, deductibles, waiting periods, exclusions, claim steps, and renewal conditions. For health plans, check pre-existing condition rules and network hospitals. Share accurate details when applying, and read the policy wording before purchase. Coverage and claim decisions follow the insurer’s terms; no policy covers every event or expense.',
  },
]

export function FeaturedMoneyServices() {
  return (
    <section className="featured-money-services" aria-labelledby="featured-money-services-title">
      <div className="featured-money-services-inner">
        <div className="featured-money-services-heading">
          <h2 id="featured-money-services-title">Grow, borrow, and protect with confidence</h2>
        </div>
        <div className="featured-money-services-grid">
          {featuredServices.map(({ title, image, imageAlt, description }) => (
            <article className="featured-money-service" key={title}>
              <img src={image} alt={imageAlt} width={1000} height={356} loading="lazy" decoding="async" />
              <div className="featured-money-service-content">
                <h3>{title}</h3>
                <p>{description}</p>
                <a href="/contact">Talk to our team</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

import { companyServices } from '../constants/data'
import { ServiceIcon } from './ServiceIcon'

/**
 * CompanyServices
 * Grid of the four main service categories (Compliance, Mutual Fund, Loans,
 * Insurance) with illustrated icons.
 */
export function CompanyServices() {
  return (
    <div className="company-services-inner">
      <h2 id="company-services-title">Our Services</h2>
      <p className="company-services-intro">Practical support for every stage of running your business.</p>
      <div className="company-services-grid">
        {companyServices.map(({ title, kind }) => (
          <article className="company-service-item" key={title}>
            <div className="company-service-icon">
              <ServiceIcon kind={kind} />
            </div>
            <h3>{title}</h3>
          </article>
        ))}
      </div>
    </div>
  )
}

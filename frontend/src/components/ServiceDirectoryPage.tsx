import { useState } from 'react'
import { serviceMegaMenus } from '../constants/data'
import { moneyProductGroups } from '../constants/moneyProducts'
import { EnquiryModal } from './EnquiryModal'

function categoryHref(category: string, service?: string) {
  const path = category === 'Company Registration' ? '/company-registration' : '/registration-details'
  const query = new URLSearchParams({ category })
  if (service) query.set('service', service)
  return `${path}?${query}`
}

const businessGroupIds = Object.fromEntries(serviceMegaMenus.map(({ label }) => [label, label.toLowerCase()]))

/**
 * ServiceDirectoryPage
 * /services: loans, insurance and mutual funds, then every business service by group and category.
 */
export function ServiceDirectoryPage() {
  const [enquiry, setEnquiry] = useState<{ service: string; group: string } | null>(null)
  const jumpLinks = [
    ...moneyProductGroups.map(({ id, label }) => ({ id, label })),
    ...serviceMegaMenus.map(({ label }) => ({ id: businessGroupIds[label], label })),
  ]

  return (
    <div className="service-directory">
      <header className="service-directory-intro">
        <p className="service-directory-eyebrow">Our services</p>
        <h1>Everything your money and business need, in one place</h1>
        <p>Loans, insurance, and mutual funds for you and your family, plus registrations, compliance, intellectual property, and taxation for your business.</p>
        <nav className="service-directory-jump" aria-label="Jump to a service group">
          {jumpLinks.map(({ id, label }) => <a href={`#${id}`} key={id}>{label}</a>)}
        </nav>
      </header>

      {moneyProductGroups.map(({ id, label, intro, bestForLabel, products, note }) => (
        <section className="service-directory-group service-directory-group--money" id={id} aria-labelledby={`${id}-title`} key={id}>
          <div className="service-directory-group-heading">
            <h2 id={`${id}-title`}>{label}</h2>
            <p>{intro}</p>
          </div>
          <div className="service-table-wrap">
            <table className="service-table service-table--money">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Key details</th>
                  <th scope="col">{bestForLabel}</th>
                  <th scope="col"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map(({ name, summary, details, bestFor }) => (
                  <tr key={name}>
                    <th scope="row" data-label="Type">
                      <strong>{name}</strong>
                      <span>{summary}</span>
                    </th>
                    <td data-label="Key details">
                      <ul className="service-table-points">
                        {details.map((detail) => <li key={detail}>{detail}</li>)}
                      </ul>
                    </td>
                    <td data-label={bestForLabel}>{bestFor}</td>
                    <td className="service-table-action">
                      <button
                        className="service-table-button"
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => setEnquiry({ service: name, group: label })}
                      >
                        Enquire
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="service-directory-note">{note}</p>
        </section>
      ))}

      {serviceMegaMenus.map(({ label, categories }) => {
        const id = businessGroupIds[label]
        return (
          <section className="service-directory-group" id={id} aria-labelledby={`${id}-title`} key={label}>
            <div className="service-directory-group-heading">
              <h2 id={`${id}-title`}>{label}</h2>
              <p>{categories.length} categories · {categories.reduce((total, { services }) => total + services.length, 0)} services</p>
            </div>
            <div className="service-table-wrap">
              <table className="service-table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Services</th>
                    <th scope="col"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(({ category, services }) => (
                    <tr key={category}>
                      <th scope="row" data-label="Category">{category}</th>
                      <td data-label="Services">
                        <ul className="service-table-chips">
                          {services.map((service) => (
                            <li key={service}><a href={categoryHref(category, service)}>{service}</a></li>
                          ))}
                        </ul>
                      </td>
                      <td className="service-table-action">
                        <a className="service-table-button" href={categoryHref(category)}>View details</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      {enquiry && <EnquiryModal service={enquiry.service} group={enquiry.group} onClose={() => setEnquiry(null)} />}
    </div>
  )
}

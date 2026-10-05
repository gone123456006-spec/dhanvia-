import { serviceMegaMenus } from '../constants/data'
import { serviceCategoryPages } from '../constants/serviceCategoryPages'

export function ServiceDirectoryPage() {
  return (
    <div className="service-directory">
      <header className="service-directory-intro">
        <p className="service-directory-eyebrow">Dhanvia service directory</p>
        <h1>Business Registration and Services in India</h1>
        <p>Browse practical guides for registrations, compliance, intellectual property, and taxation. Each category page outlines common services, eligibility, documents, and next steps.</p>
      </header>

      {serviceMegaMenus.map(({ label }) => (
        <section className="service-directory-group" aria-labelledby={`service-group-${label}`} key={label}>
          <h2 id={`service-group-${label}`}>{label}</h2>
          <ul>
            {serviceCategoryPages.filter(({ group }) => group === label).map((page) => (
              <li key={page.path}>
                <div>
                  <h3><a href={page.path}>{page.category}</a></h3>
                  <p>{page.description}</p>
                  <p className="service-directory-list-label">Services in this category</p>
                  <ul className="service-directory-services">
                    {page.services.map((service) => <li key={service}>{service}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

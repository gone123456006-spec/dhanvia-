import { useState } from 'react'
import {
  CompanyServices,
  FAQ,
  HeroBanner,
  RegistrationOffer,
  RegistrationProcess,
  ServiceCatalog,
  SiteFooter,
  SiteHeader,
} from './components'

/**
 * App
 * Root component — composes the full page layout from individual sections.
 * State that is shared across sections (selected registration service) lives here.
 */
function App() {
  const [selectedRegistrationService, setSelectedRegistrationService] = useState('')

  return (
    <div className="site-shell" id="top">
      <SiteHeader />

      <main>
        <HeroBanner />
        <RegistrationProcess />

        <RegistrationOffer
          selectedService={selectedRegistrationService}
          onServiceChange={setSelectedRegistrationService}
        />

        <section className="company-services" aria-labelledby="company-services-title">
          <CompanyServices />
          <ServiceCatalog onApply={setSelectedRegistrationService} />
        </section>

        <FAQ />
      </main>

      <SiteFooter />
    </div>
  )
}

export default App

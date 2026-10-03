import { useState } from 'react'
import {
  CompanyServices,
  ConsultationPage,
  FAQ,
  HeroBanner,
  RegistrationDetailPage,
  RegistrationOffer,
  RegistrationProcess,
  ServiceCatalog,
  SiteFooter,
  SiteHeader,
} from './components'
import { registrationServiceCategories } from './constants/data'

/**
 * App
 * Root component — composes the full page layout from individual sections.
 * State that is shared across sections (selected registration service) lives here.
 */
function App() {
  const [selectedRegistrationService, setSelectedRegistrationService] = useState(() => {
    const selectedService = new URLSearchParams(window.location.search).get('service')
      ?? sessionStorage.getItem('selectedRegistrationService')
      ?? ''
    sessionStorage.removeItem('selectedRegistrationService')
    return selectedService
  })
  const currentPath = window.location.pathname.replace(/\/$/, '')
  const isContactPage = currentPath === '/contact'
  const isRegistrationPage = currentPath === '/company-registration' || currentPath === '/registration-details'
  const registrationCategory = new URLSearchParams(window.location.search).get('category')
    ?? 'Company Registration'

  function handleRegistrationServiceSelect(service: string, menu: string, category: string) {
    setSelectedRegistrationService(service)
    if (menu === 'Registrations' || menu === 'Compliance' || menu === 'IPR' || menu === 'Taxation') {
      const path = category === 'Company Registration' ? '/company-registration' : '/registration-details'
      window.location.href = `${path}?category=${encodeURIComponent(category)}&service=${encodeURIComponent(service)}`
      return
    }
    if (isContactPage || isRegistrationPage) {
      sessionStorage.setItem('selectedRegistrationService', service)
      window.location.href = '/#registration-consultation-form'
      return
    }
    document.getElementById('registration-consultation-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  function handleServiceCatalogApply(service: string) {
    if (registrationServiceCategories[0].services.includes(service)) {
      window.location.href = `/company-registration?service=${encodeURIComponent(service)}`
      return
    }
    setSelectedRegistrationService(service)
    document.getElementById('registration-consultation-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <div className="site-shell" id="top">
      <SiteHeader
        onSelectService={handleRegistrationServiceSelect}
        isContactPage={isContactPage}
        isRegistrationPage={isRegistrationPage}
      />

      <main>
        {isContactPage ? (
          <ConsultationPage />
        ) : isRegistrationPage ? (
          <RegistrationDetailPage
            selectedService={selectedRegistrationService}
            onServiceChange={setSelectedRegistrationService}
            registrationCategory={registrationCategory}
          />
        ) : (
          <>
            <HeroBanner />
            <RegistrationProcess />

            <RegistrationOffer
              selectedService={selectedRegistrationService}
              onServiceChange={setSelectedRegistrationService}
            />

            <section className="company-services" aria-labelledby="company-services-title">
              <CompanyServices />
              <ServiceCatalog onApply={handleServiceCatalogApply} />
            </section>

            <FAQ />
          </>
        )}
      </main>

      <SiteFooter isContactPage={isContactPage || isRegistrationPage} />
    </div>
  )
}

export default App

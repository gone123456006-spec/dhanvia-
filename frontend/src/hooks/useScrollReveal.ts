import { useEffect } from 'react'

type RevealVariant = 'up' | 'left' | 'right' | 'zoom'

interface RevealTarget {
  selector: string
  variant: RevealVariant
  /** Elements revealed together cascade one after another. */
  stagger?: boolean
}

const revealTargets: RevealTarget[] = [
  // Home
  { selector: '.registration-process-description', variant: 'up' },
  { selector: '.registration-process-step', variant: 'up', stagger: true },
  { selector: '.registration-offer-copy', variant: 'left' },
  { selector: '.registration-benefits li', variant: 'up', stagger: true },
  { selector: '.registration-consultation-form', variant: 'right' },
  { selector: '.company-services-intro', variant: 'up' },
  { selector: '.company-service-item', variant: 'zoom', stagger: true },
  { selector: '.service-category-list', variant: 'left' },
  { selector: '.service-catalog-item', variant: 'up', stagger: true },
  { selector: '.featured-money-services-heading', variant: 'up' },
  { selector: '.featured-money-service', variant: 'up', stagger: true },
  { selector: '.client-testimonials-header', variant: 'up' },
  { selector: '.client-testimonial-card:not(.is-off-page)', variant: 'up', stagger: true },
  { selector: '.faq-title', variant: 'up' },
  { selector: '.faq-list > details', variant: 'up', stagger: true },

  // Contact
  { selector: '.consultation-support-copy', variant: 'left' },
  { selector: '.support-request-form', variant: 'right' },
  { selector: '.consultation-location', variant: 'up', stagger: true },
  { selector: '.consultation-map-frame', variant: 'zoom' },

  // Service detail
  { selector: '.registration-detail-hero-inner > *', variant: 'up', stagger: true },
  { selector: '.registration-detail-article > *', variant: 'up', stagger: true },
  { selector: '.registration-detail-faq-list > *', variant: 'up', stagger: true },

  // Footer
  { selector: '.footer-main > *', variant: 'up', stagger: true },
  { selector: '.footer-bottom', variant: 'up' },
]

const STAGGER_MS = 60
const MAX_STAGGER_STEPS = 4
const REVEAL_DURATION_MS = 700

/**
 * Fades and slides page sections into view as they scroll into the viewport.
 * Elements are only hidden once JS has tagged them, and the tags are removed
 * after the reveal so component hover transforms keep working.
 */
export function useScrollReveal(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    const timers = new Set<number>()
    const tagged: HTMLElement[] = []

    function finish(element: HTMLElement) {
      element.removeAttribute('data-reveal')
      element.removeAttribute('data-reveal-stagger')
      element.classList.remove('is-revealed')
      element.style.removeProperty('--reveal-delay')
    }

    const observer = new IntersectionObserver((entries) => {
      let step = 0
      entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((element) => {
          observer.unobserve(element)
          const delay = element.hasAttribute('data-reveal-stagger')
            ? Math.min(step++, MAX_STAGGER_STEPS) * STAGGER_MS
            : 0
          element.style.setProperty('--reveal-delay', `${delay}ms`)
          element.classList.add('is-revealed')
          const timer = window.setTimeout(() => {
            timers.delete(timer)
            finish(element)
          }, delay + REVEAL_DURATION_MS)
          timers.add(timer)
        })
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' })

    for (const { selector, variant, stagger } of revealTargets) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element.hasAttribute('data-reveal')) return
        element.setAttribute('data-reveal', variant)
        if (stagger) element.setAttribute('data-reveal-stagger', '')
        tagged.push(element)
        observer.observe(element)
      })
    }

    return () => {
      observer.disconnect()
      timers.forEach((timer) => window.clearTimeout(timer))
      tagged.forEach(finish)
    }
  }, [enabled])
}

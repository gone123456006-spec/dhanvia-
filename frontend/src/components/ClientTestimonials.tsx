import { useEffect, useRef, useState } from 'react'

const testimonials = [
  {
    initial: 'R',
    avatarColor: '#0d8fcb',
    name: 'Rishabh Bajpai',
    text: 'Recently got my DARPAN registration done through RegisterKaro, and the overall experience was really good. The process was smooth, and whenever I had... ',
    service: 'ngo registration',
    date: '2026-07-09',
  },
  {
    initial: 'G',
    avatarColor: '#ea5f86',
    name: 'Gaurav Kumar',
    text: 'Starting a business can be overwhelming, but RegisterKaro simplified everything for me. Ayush Jain ensured all my queries were resolved quickly and clearly.',
    service: 'Others',
    date: '2026-02-28',
  },
  {
    initial: 'M',
    avatarColor: '#11a7a8',
    name: 'Madhushri Calindi',
    text: 'Bhavesh is truly a one-stop solution for any challenge. Whether it is a compliance issue, which he leads with expertise, or any other concern, he and... ',
    service: 'Others',
    date: '2026-07-31',
  },
  {
    initial: 'P',
    avatarColor: '#7a5af5',
    name: 'Priya Sharma',
    text: 'Dhanvia made my private limited company registration completely hassle-free. The team explained every document clearly and I received my incorporation certificate within a week.',
    service: 'company registration',
    date: '2026-08-14',
  },
  {
    initial: 'A',
    avatarColor: '#f08a24',
    name: 'Amit Verma',
    text: 'I got my GST registration and monthly return filing sorted with Dhanvia. Quick responses, transparent pricing and no last-minute surprises. Highly recommended for small businesses.',
    service: 'gst registration',
    date: '2026-08-29',
  },
  {
    initial: 'S',
    avatarColor: '#164c3b',
    name: 'Sneha Iyer',
    text: 'Filed my trademark application through Dhanvia and they handled the objection reply as well. Professional, patient and always available on call whenever I needed an update.',
    service: 'trademark registration',
    date: '2026-09-12',
  },
  {
    initial: 'K',
    avatarColor: '#d6336c',
    name: 'Karan Mehta',
    text: 'Converted my partnership firm into an LLP with Dhanvia. They took care of every filing and kept me informed at each stage. The whole process felt simple and stress-free.',
    service: 'llp registration',
    date: '2026-09-18',
  },
  {
    initial: 'N',
    avatarColor: '#1c7ed6',
    name: 'Neha Gupta',
    text: 'Their annual compliance service is excellent. ROC filings, board resolutions and income tax returns were all completed on time, so I never have to worry about penalties.',
    service: 'annual compliance',
    date: '2026-09-24',
  },
  {
    initial: 'V',
    avatarColor: '#2b8a3e',
    name: 'Vikram Singh',
    text: 'Got my FSSAI license for my food business without any running around. The Dhanvia team guided me on documents and followed up with the department until it was approved.',
    service: 'fssai registration',
    date: '2026-10-01',
  },
]

const AUTO_SLIDE_MS = 5000
const PAGE_SIZE = 3
const pageCount = Math.ceil(testimonials.length / PAGE_SIZE)
/** Must match the breakpoint where testimonials.css switches to a swipeable row. */
const MOBILE_QUERY = '(max-width: 900px)'

function scrollToNextCard(grid: HTMLElement) {
  const card = grid.querySelector<HTMLElement>('.client-testimonial-card')
  if (!card) return
  const atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4
  if (atEnd) {
    grid.scrollTo({ left: 0, behavior: 'smooth' })
  } else {
    grid.scrollBy({ left: card.offsetWidth + parseFloat(getComputedStyle(grid).columnGap || '0'), behavior: 'smooth' })
  }
}

function StarRating() {
  return (
    <div className="client-testimonial-rating" aria-label="Five out of five stars">
      <span className="client-testimonial-score">5/5</span>
      <span className="client-testimonial-stars" aria-hidden="true">
        {'★★★★★'}
      </span>
    </div>
  )
}

function VerifiedBadge() {
  return (
    <span className="client-testimonial-verified" aria-label="Verified customer">
      <span className="client-testimonial-check" aria-hidden="true">✓</span>
      Verified
    </span>
  )
}

export function ClientTestimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)

  function showPage(offset: number) {
    setPage((current) => (current + offset + pageCount) % pageCount)
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (paused || !inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      const grid = gridRef.current
      if (grid && window.matchMedia(MOBILE_QUERY).matches) {
        scrollToNextCard(grid)
      } else {
        setPage((current) => (current + 1) % pageCount)
      }
    }, AUTO_SLIDE_MS)
    return () => window.clearInterval(timer)
  }, [page, paused, inView])

  return (
    <section ref={sectionRef} className="client-testimonials" aria-labelledby="client-testimonials-title">
      <div className="client-testimonials-inner">
        <div className="client-testimonials-header">
          <h2 id="client-testimonials-title">What Our Clients Say</h2>
        </div>

        <div
          className="client-testimonials-track"
          aria-live={paused ? 'polite' : 'off'}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <button
            type="button"
            className="client-testimonials-nav client-testimonials-nav--prev"
            aria-label="Previous testimonials"
            onClick={() => showPage(-1)}
          >
            ‹
          </button>

          <div className="client-testimonials-grid" ref={gridRef}>
            {testimonials.map(({ initial, avatarColor, name, text, service, date }, index) => (
              <article
                className={`client-testimonial-card${Math.floor(index / PAGE_SIZE) === page ? '' : ' is-off-page'}`}
                key={name}
              >
                <div className="client-testimonial-top">
                  <div className="client-testimonial-avatar" style={{ background: avatarColor }} aria-hidden="true">
                    {initial}
                  </div>
                  <div className="client-testimonial-name-wrap">
                    <h3>{name}</h3>
                    <VerifiedBadge />
                  </div>
                </div>

                <StarRating />

                <div className="client-testimonial-service-tag">{service}</div>

                <p className="client-testimonial-copy">
                  {text}
                </p>

                <div className="client-testimonial-footer">
                  <span>Date Posted-</span>
                  <span>{date}</span>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="client-testimonials-nav client-testimonials-nav--next"
            aria-label="Next testimonials"
            onClick={() => showPage(1)}
          >
            ›
          </button>
        </div>

        <div className="client-testimonials-dots" role="group" aria-label="Choose testimonials">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={index === page ? 'is-active' : undefined}
              aria-label={`Show testimonials ${index * PAGE_SIZE + 1} to ${Math.min((index + 1) * PAGE_SIZE, testimonials.length)}`}
              aria-pressed={index === page}
              onClick={() => setPage(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

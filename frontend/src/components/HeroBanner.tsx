import { useEffect, useState } from 'react'
import { bannerSlides } from '../constants/data'

/**
 * HeroBanner
 * Auto-advancing image carousel shown at the top of the page.
 */
export function HeroBanner() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % bannerSlides.length)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section
      className="hero-carousel hero-carousel--static"
      aria-label="Featured banners"
      aria-roledescription="carousel"
    >
      <div
        className="hero-carousel-track"
        style={{ translate: `${-activeSlide * (100 / bannerSlides.length)}% 0` }}
      >
        {bannerSlides.map((slide) => (
          <img
            className="hero-banner-image"
            src={slide.src}
            alt={slide.alt}
            width={2103}
            height={748}
            fetchPriority={slide === bannerSlides[0] ? 'high' : undefined}
            loading="eager"
            decoding="async"
            key={slide.src}
          />
        ))}
      </div>
    </section>
  )
}

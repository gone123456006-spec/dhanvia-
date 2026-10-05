import { useEffect, useRef, useState } from 'react'
import { bannerSlides } from '../constants/data'

const SWIPE_THRESHOLD_PX = 40

/**
 * HeroBanner
 * Auto-advancing image carousel shown at the top of the page.
 */
export function HeroBanner() {
  const [activeSlide, setActiveSlide] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % bannerSlides.length)
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [activeSlide])

  const showSlide = (offset: number) => setActiveSlide((activeSlide + offset + bannerSlides.length) % bannerSlides.length)

  return (
    <section
      className="hero-carousel hero-carousel--static"
      aria-label="Featured banners"
      aria-roledescription="carousel"
    >
      <div
        className="hero-carousel-stage"
        onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return
          const distance = event.changedTouches[0].clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) showSlide(distance < 0 ? 1 : -1)
        }}
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
        <button
          className="hero-carousel-arrow hero-carousel-arrow--previous"
          type="button"
          aria-label="Previous banner"
          onClick={() => showSlide(-1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          className="hero-carousel-arrow hero-carousel-arrow--next"
          type="button"
          aria-label="Next banner"
          onClick={() => showSlide(1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
      <nav className="hero-carousel-pagination" aria-label="Choose a featured banner">
        {bannerSlides.map((slide, index) => (
          <button
            className={index === activeSlide ? 'is-active' : ''}
            type="button"
            aria-label={`Show banner ${index + 1}: ${slide.alt}`}
            aria-pressed={index === activeSlide}
            onClick={() => setActiveSlide(index)}
            key={slide.src}
          />
        ))}
      </nav>
    </section>
  )
}

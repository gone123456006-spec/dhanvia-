import { useEffect, useState } from 'react'

const WORDMARK = 'Dhanvia'
const EXIT_AT_MS = 1700
const EXIT_DURATION_MS = 900

interface IntroSplashProps {
  /** Called when the curtain starts lifting, so the page can play its entrance. */
  onReveal: () => void
  /** Called once the splash is fully gone and can be unmounted. */
  onDone: () => void
}

/**
 * IntroSplash
 * Full-screen brand curtain shown on the first visit of a session. The
 * wordmark rises letter by letter, then the curtain lifts with a curved edge.
 */
export function IntroSplash({ onReveal, onDone }: IntroSplashProps) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const exitTimer = window.setTimeout(() => {
      setLeaving(true)
      onReveal()
    }, EXIT_AT_MS)
    const doneTimer = window.setTimeout(onDone, EXIT_AT_MS + EXIT_DURATION_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [onReveal, onDone])

  function skip() {
    if (leaving) return
    setLeaving(true)
    onReveal()
    window.setTimeout(onDone, EXIT_DURATION_MS)
  }

  return (
    <div
      className={`intro-splash${leaving ? ' is-leaving' : ''}`}
      role="presentation"
      onClick={skip}
    >
      <span className="intro-splash-glow intro-splash-glow--one" aria-hidden="true" />
      <span className="intro-splash-glow intro-splash-glow--two" aria-hidden="true" />

      <div className="intro-splash-content">
        <p className="intro-splash-wordmark" aria-label={WORDMARK}>
          {WORDMARK.split('').map((letter, index) => (
            <span key={index} className="intro-splash-letter" aria-hidden="true">
              <span style={{ animationDelay: `${120 + index * 70}ms` }}>{letter}</span>
            </span>
          ))}
        </p>
        <p className="intro-splash-tagline">Funding your next move.</p>
        <span className="intro-splash-line" aria-hidden="true" />
      </div>
    </div>
  )
}

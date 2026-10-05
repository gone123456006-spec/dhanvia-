import { useEffect, useRef } from 'react'

/**
 * ScrollProgress
 * Thin bar pinned to the top of the viewport that fills as the page scrolls.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0
    let scrollable = 0

    // Reading scrollHeight forces layout, so it is measured only when the page size changes.
    function measure() {
      scrollable = document.documentElement.scrollHeight - window.innerHeight
      onScroll()
    }

    function update() {
      frame = 0
      const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0
      barRef.current?.style.setProperty('transform', `scaleX(${progress})`)
    }

    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(document.body)
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span ref={barRef} />
    </div>
  )
}

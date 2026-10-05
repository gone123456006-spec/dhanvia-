import { useSyncExternalStore } from 'react'

const NAVIGATE_EVENT = 'crm:navigate'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener(NAVIGATE_EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(NAVIGATE_EVENT, callback)
  }
}

const getLocation = () => window.location.pathname + window.location.search

export function useLocation() {
  const href = useSyncExternalStore(subscribe, getLocation)
  const url = new URL(href, window.location.origin)
  return { pathname: url.pathname.replace(/\/$/, '') || '/', search: url.searchParams }
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (to === getLocation()) return
  if (options.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  if (!options.replace) window.scrollTo({ top: 0 })
}

export function setSearchParams(params: Record<string, string | number | undefined | null>) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') url.searchParams.delete(key)
    else url.searchParams.set(key, String(value))
  }
  navigate(url.pathname + url.search, { replace: true })
}

export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index]
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(pathParts[index])
    else if (part !== pathParts[index]) return null
  }
  return params
}


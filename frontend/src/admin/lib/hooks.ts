import { useCallback, useEffect, useRef, useState } from 'react'

export interface QueryState<T> {
  data: T | null
  error: unknown
  loading: boolean
  reload: (options?: { silent?: boolean }) => Promise<void>
}

/** Fetches data whenever `key` changes, with optional background polling while the tab is visible. */
export function useQuery<T>(key: string, fetcher: () => Promise<T>, options: { pollMs?: number; enabled?: boolean } = {}): QueryState<T> {
  const { pollMs, enabled = true } = options
  const [state, setState] = useState<{ data: T | null; error: unknown; loading: boolean; key: string | null }>({
    data: null,
    error: null,
    loading: enabled,
    key: null,
  })
  const fetcherRef = useRef(fetcher)
  const requestId = useRef(0)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const reload = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const id = ++requestId.current
    if (!silent) setState((previous) => ({ ...previous, loading: true }))
    try {
      const data = await fetcherRef.current()
      if (id === requestId.current) setState({ data, error: null, loading: false, key })
    } catch (error) {
      if (id === requestId.current) setState((previous) => ({ ...previous, error, loading: false }))
    }
  }, [key])

  useEffect(() => {
    if (!enabled) return
    const id = window.setTimeout(() => void reload(), 0)
    return () => window.clearTimeout(id)
  }, [reload, enabled])

  useEffect(() => {
    if (!pollMs || !enabled) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload({ silent: true })
    }, pollMs)
    return () => window.clearInterval(timer)
  }, [pollMs, reload, enabled])

  return { data: state.data, error: state.error, loading: state.loading, reload }
}

export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export function useNow(intervalMs = 1000, active = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs, active])
  return now
}

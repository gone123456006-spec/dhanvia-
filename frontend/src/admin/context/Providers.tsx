import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError, errorMessage, UNAUTHORIZED_EVENT } from '../lib/api'
import type { Meta, User } from '../lib/types'
import { Button, Field, Input, Modal, Select } from '../components/ui'
import { Icon } from '../components/Icon'
import {
  AuthContext,
  ConfirmContext,
  ToastContext,
  type AuthContextValue,
  type ConfirmOptions,
  type ToastTone,
} from './contexts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')

  const refreshMeta = useCallback(async () => {
    setMeta(await api.get<Meta>('/admin/meta'))
  }, [])

  const refreshUser = useCallback(async () => {
    const { user: current } = await api.get<{ user: User }>('/auth/me')
    setUser(current)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const [{ user: current }, currentMeta] = await Promise.all([api.get<{ user: User }>('/auth/me'), api.get<Meta>('/admin/meta')])
        if (cancelled) return
        setUser(current)
        setMeta(currentMeta)
        setStatus('authenticated')
      } catch {
        if (!cancelled) setStatus('anonymous')
      }
    }
    void bootstrap()
    const onUnauthorized = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => {
      cancelled = true
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: current } = await api.post<{ user: User }>('/auth/login', { email, password })
    const currentMeta = await api.get<Meta>('/admin/meta')
    setUser(current)
    setMeta(currentMeta)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined)
    setUser(null)
    setMeta(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(() => ({ user, meta, status, login, logout, refreshMeta, refreshUser }), [user, meta, status, login, logout, refreshMeta, refreshUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), [])
  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++
    setToasts((items) => [...items.slice(-3), { id, message, tone }])
    window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500)
  }, [dismiss])

  const value = useMemo(() => ({
    toast,
    success: (message: string) => toast(message, 'success'),
    error: (error: unknown, fallback?: string) => {
      if (error instanceof ApiError && error.status === 401) return
      toast(fallback && !(error instanceof Error) ? fallback : errorMessage(error), 'error')
    },
  }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="crm-toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`crm-toast crm-toast-${item.tone}`} role={item.tone === 'error' ? 'alert' : 'status'}>
            <Icon name={item.tone === 'success' ? 'check' : item.tone === 'error' ? 'alert' : 'bell'} size={16} />
            <span>{item.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(item.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: string | false) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const confirm = useCallback((options: ConfirmOptions) => new Promise<string | false>((resolve) => {
    setValue('')
    setError('')
    setPending({ ...options, resolve })
  }), [])

  function close(result: string | false) {
    pending?.resolve(result)
    setPending(null)
  }

  function submit() {
    if (pending?.input?.required !== false && pending?.input && !value.trim()) {
      setError(`${pending.input.label} is required`)
      return
    }
    close(pending?.input ? value.trim() : 'confirmed')
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(pending)}
        onClose={() => close(false)}
        title={pending?.title ?? ''}
        size="sm"
        footer={(
          <>
            <Button onClick={() => close(false)}>Cancel</Button>
            <Button variant={pending?.tone === 'danger' ? 'danger' : 'primary'} onClick={submit}>{pending?.confirmLabel ?? 'Confirm'}</Button>
          </>
        )}
      >
        {pending?.message && <p className="crm-confirm-message">{pending.message}</p>}
        {pending?.input && (
          <Field label={pending.input.label} error={error} required={pending.input.required !== false}>
            {pending.input.options && pending.input.options.length > 0 ? (
              <>
                <Select value={pending.input.options.includes(value) ? value : value ? '__other' : ''} onChange={(event) => setValue(event.target.value === '__other' ? ' ' : event.target.value)}>
                  <option value="">Select…</option>
                  {pending.input.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  <option value="__other">Other…</option>
                </Select>
                {value && !pending.input.options.includes(value) && (
                  <Input autoFocus value={value.trimStart()} placeholder={pending.input.placeholder} onChange={(event) => setValue(event.target.value)} />
                )}
              </>
            ) : (
              <Input autoFocus value={value} placeholder={pending.input.placeholder} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
            )}
          </Field>
        )}
      </Modal>
    </ConfirmContext.Provider>
  )
}

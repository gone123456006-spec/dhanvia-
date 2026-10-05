import { createContext, useContext } from 'react'
import type { Meta, User } from '../lib/types'

export interface AuthContextValue {
  user: User | null
  meta: Meta | null
  status: 'loading' | 'authenticated' | 'anonymous'
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMeta: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

/** Auth context for screens that only render after sign-in. */
export function useSession() {
  const { user, meta, ...rest } = useAuth()
  if (!user || !meta) throw new Error('useSession requires an authenticated session')
  return { user, meta, ...rest }
}

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (error: unknown, fallback?: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  /** When set, the dialog asks for a value (e.g. a lost reason) and resolves with it. */
  input?: { label: string; placeholder?: string; options?: string[]; required?: boolean }
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<string | false>

export const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const value = useContext(ConfirmContext)
  if (!value) throw new Error('useConfirm must be used inside ConfirmProvider')
  return value
}

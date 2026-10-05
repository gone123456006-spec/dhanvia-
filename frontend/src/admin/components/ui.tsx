import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import type { Tone } from '../lib/constants'
import { errorMessage } from '../lib/api'
import { initials } from '../lib/format'
import { Icon, type IconName } from './Icon'

// ── Buttons ─────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md'; icon?: IconName; loading?: boolean }) {
  return (
    <button
      type={type}
      className={`crm-btn crm-btn-${variant} crm-btn-${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="crm-spinner crm-spinner-sm" aria-hidden="true" /> : icon && !children && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children && <span>{children}</span>}
    </button>
  )
}

export function IconButton({ icon, label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button type="button" className={`crm-icon-btn ${className}`} aria-label={label} title={label} {...props}>
      <Icon name={icon} />
    </button>
  )
}

// ── Display ─────────────────────────────────────────────────────────────────

export function Badge({ tone = 'gray', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`crm-badge crm-tone-${tone}`}>
      {dot && <span className="crm-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Avatar({ name, size = 28 }: { name?: string | null; size?: number }) {
  return (
    <span className="crm-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export function Card({ title, actions, children, className = '', padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`crm-card ${className}`}>
      {(title || actions) && (
        <header className="crm-card-header">
          {title && <h2>{title}</h2>}
          {actions && <div className="crm-card-actions">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'crm-card-body' : ''}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, tone = 'green', hint, onClick }: { label: string; value: ReactNode; icon?: IconName; tone?: Tone; hint?: ReactNode; onClick?: () => void }) {
  const content = (
    <>
      <span className={`crm-stat-accent crm-tone-${tone}`} aria-hidden="true" />
      <span className="crm-stat-text">
        <span className="crm-stat-label">{label}</span>
        <strong className="crm-stat-value">{value}</strong>
        {hint && <span className="crm-stat-hint">{hint}</span>}
      </span>
    </>
  )
  return onClick ? (
    <button type="button" className="crm-stat crm-stat-clickable" onClick={onClick}>{content}</button>
  ) : (
    <div className="crm-stat">{content}</div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="crm-loading" role="status">
      <span className="crm-spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  )
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="crm-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => <span key={index} style={{ width: `${70 + ((index * 13) % 30)}%` }} />)}
    </div>
  )
}

export function EmptyState({ title, description, action }: { icon?: IconName; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="crm-empty">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="crm-empty crm-error-state" role="alert">
      <strong>Couldn’t load this data</strong>
      <p>{errorMessage(error)}</p>
      {onRetry && <Button icon="refresh" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function ProgressBar({ value, tone = 'green' }: { value: number; tone?: Tone }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <span className={`crm-progress crm-tone-${tone}`} role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${clamped}%` }} />
    </span>
  )
}

// ── Forms ───────────────────────────────────────────────────────────────────

export function Field({ label, error, hint, children, required, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <div className={`crm-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}{required && <span className="crm-required" aria-hidden="true">*</span>}</label>
      {children}
      {error ? <span className="crm-field-error" role="alert">{error}</span> : hint && <span className="crm-field-hint">{hint}</span>}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="crm-input" {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="crm-input crm-textarea" {...props} />
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="crm-input crm-select" {...props}>{children}</select>
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId()
  return (
    <label className="crm-toggle" htmlFor={id}>
      <span className="crm-toggle-text">
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="crm-toggle-track" aria-hidden="true" />
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="crm-search">
      <Icon name="search" size={16} />
      <input type="search" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-label={placeholder} />
    </div>
  )
}

// ── Overlays ────────────────────────────────────────────────────────────────

function useOverlay(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handler)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = previous
    }
  }, [open])
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useOverlay(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="crm-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`crm-modal crm-modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="crm-modal-header">
          <h2>{title}</h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </header>
        <div className="crm-modal-body">{children}</div>
        {footer && <footer className="crm-modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useOverlay(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="crm-overlay crm-overlay-drawer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="crm-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="crm-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="crm-muted">{subtitle}</p>}
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </header>
        <div className="crm-drawer-body">{children}</div>
        {footer && <footer className="crm-modal-footer">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}

// ── Navigation ──────────────────────────────────────────────────────────────

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: Array<{ id: T; label: string; count?: number; alert?: boolean }>; active: T; onChange: (id: T) => void }) {
  return (
    <div className="crm-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && <span className={`crm-tab-count ${tab.alert ? 'alert' : ''}`}>{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Pagination({ page, totalPages, total, limit, onPage }: { page: number; totalPages: number; total: number; limit: number; onPage: (page: number) => void }) {
  if (total === 0) return null
  const start = (page - 1) * limit + 1
  const end = Math.min(total, page * limit)
  return (
    <nav className="crm-pagination" aria-label="Pagination">
      <span className="crm-muted">{start}–{end} of {total.toLocaleString('en-IN')}</span>
      <div>
        <IconButton icon="chevronLeft" label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        <span className="crm-page-indicator">Page {page} of {totalPages}</span>
        <IconButton icon="chevronRight" label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)} />
      </div>
    </nav>
  )
}

// ── Charts ──────────────────────────────────────────────────────────────────

export function BarChart({ data, format = (value) => String(value), tone = 'green', height = 180 }: {
  data: Array<{ label: string; value: number; secondary?: number }>
  format?: (value: number) => string
  tone?: Tone
  height?: number
}) {
  if (data.length === 0) return <EmptyState icon="reports" title="No data for this period" />
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="crm-bar-chart" style={{ height }} role="img" aria-label="Bar chart">
      {data.map((item) => (
        <div className="crm-bar-col" key={item.label} title={`${item.label}: ${format(item.value)}`}>
          <span className="crm-bar-value">{format(item.value)}</span>
          <span className={`crm-bar crm-tone-${tone}`} style={{ height: `${(item.value / max) * 100}%` }}>
            {item.secondary !== undefined && <span className="crm-bar-secondary" style={{ height: `${item.value ? (item.secondary / item.value) * 100 : 0}%` }} />}
          </span>
          <span className="crm-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function HorizontalBars({ data, format = (value) => String(value) }: { data: Array<{ label: string; value: number; tone?: Tone; meta?: ReactNode }>; format?: (value: number) => string }) {
  if (data.length === 0) return <EmptyState icon="reports" title="No data for this period" />
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <ul className="crm-hbars">
      {data.map((item) => (
        <li key={item.label}>
          <span className="crm-hbar-label">{item.label}</span>
          <span className="crm-hbar-track"><span className={`crm-tone-${item.tone ?? 'green'}`} style={{ width: `${(item.value / max) * 100}%` }} /></span>
          <span className="crm-hbar-value">{format(item.value)}{item.meta && <small> {item.meta}</small>}</span>
        </li>
      ))}
    </ul>
  )
}

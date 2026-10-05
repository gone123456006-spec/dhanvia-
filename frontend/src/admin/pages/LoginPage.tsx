import { useState, type FormEvent } from 'react'
import { Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/contexts'
import { errorMessage } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email || !password) {
      setError('Enter your email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crm-login">
      <div className="crm-login-panel">
        <div className="crm-brand crm-brand-dark">
          <span>
            <strong className="crm-wordmark">Dhanvia</strong>
            <small>Sales CRM</small>
          </span>
        </div>
        <h1>Sign in to your workspace</h1>
        <p className="crm-muted">Manage leads, calls, follow-ups, and conversions.</p>
        <form onSubmit={submit} noValidate>
          <Field label="Work email" htmlFor="login-email">
            <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          {error && <p className="crm-form-error" role="alert">{error}</p>}
          <Button variant="primary" type="submit" loading={loading} className="crm-btn-block">Sign in</Button>
        </form>
        <p className="crm-login-footnote">Accounts are created by your Super Admin.</p>
      </div>
      <div className="crm-login-art" aria-hidden="true">
        <div>
          <h2>New Lead → Assigned → Calling → Interested → Follow-up → Documents → Processing → Converted</h2>
          <p>Every call, stage change, and payment is recorded in a permanent audit trail.</p>
        </div>
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { interestMeta, outcomeMeta } from '../lib/constants'
import { formatTimer, fromLocalInput, hoursFromNow, isOverdue, toLocalInput } from '../lib/format'
import { useNow } from '../lib/hooks'
import type { CallOutcome, Lead } from '../lib/types'
import { Button, Field, Input, Select, Textarea } from './ui'

const needsFollowUp: CallOutcome[] = ['callback']
const suggestsFollowUp: CallOutcome[] = ['connected', 'interested', 'callback', 'no_answer', 'busy']

/** Call Now + outcome capture. Starting the call opens the dialer and runs a timer for the duration. */
export function LogCallForm({ lead, taskId, onLogged }: { lead: Pick<Lead, '_id' | 'name' | 'phone' | 'interest'>; taskId?: string; onLogged: () => void }) {
  const { meta } = useSession()
  const toast = useToast()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [stoppedAt, setStoppedAt] = useState<number | null>(null)
  const [manualDuration, setManualDuration] = useState('')
  const [outcome, setOutcome] = useState<CallOutcome | ''>('')
  const [notes, setNotes] = useState('')
  const [interest, setInterest] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [followUpAt, setFollowUpAt] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const now = useNow(1000, startedAt !== null && stoppedAt === null)

  const elapsed = startedAt ? Math.round(((stoppedAt ?? now) - startedAt) / 1000) : 0
  const duration = manualDuration !== '' ? Math.round(Number(manualDuration) * 60) : elapsed

  function startCall() {
    setStartedAt(Date.now())
    setStoppedAt(null)
    const dialer = document.createElement('a')
    dialer.href = `tel:${lead.phone}`
    dialer.click()
  }

  function quickFollowUp(hours: number) {
    setFollowUpAt(toLocalInput(hoursFromNow(hours)))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!outcome) next.outcome = 'Choose the call outcome'
    if (outcome && needsFollowUp.includes(outcome) && !followUpAt) next.followUpAt = 'Choose when to call back'
    if (followUpAt && isOverdue(fromLocalInput(followUpAt))) next.followUpAt = 'Choose a future time'
    if (Number.isNaN(duration) || duration < 0) next.duration = 'Enter a valid duration'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await api.post(`/admin/leads/${lead._id}/calls`, {
        outcome,
        durationSeconds: duration,
        startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
        notes,
        interest: interest || undefined,
        nextAction,
        followUpAt: fromLocalInput(followUpAt),
        taskId,
      })
      toast.success(`Call logged: ${outcomeMeta[outcome as CallOutcome].label}`)
      setStartedAt(null)
      setStoppedAt(null)
      setManualDuration('')
      setOutcome('')
      setNotes('')
      setInterest('')
      setNextAction('')
      setFollowUpAt('')
      onLogged()
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields)
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  const inCall = startedAt !== null && stoppedAt === null

  return (
    <form className="crm-call-form" onSubmit={submit} noValidate>
      <div className={`crm-call-dialer ${inCall ? 'live' : ''}`}>
        <div>
          <span className="crm-muted">Calling</span>
          <strong>{lead.name}</strong>
          <a href={`tel:${lead.phone}`} className="crm-phone-link">{lead.phone}</a>
        </div>
        <div className="crm-call-timer" aria-live="off">{formatTimer(elapsed)}</div>
        {inCall ? (
          <Button variant="danger" icon="stop" onClick={() => setStoppedAt(Date.now())}>End call</Button>
        ) : (
          <Button variant="success" icon="phone" onClick={startCall}>{startedAt ? 'Call again' : 'Call now'}</Button>
        )}
      </div>

      <Field label="Call outcome" required error={errors.outcome}>
        <div className="crm-outcome-grid" role="radiogroup" aria-label="Call outcome">
          {meta.enums.callOutcomes.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={outcome === item}
              className={`crm-outcome crm-tone-${outcomeMeta[item].tone} ${outcome === item ? 'selected' : ''}`}
              onClick={() => {
                setOutcome(item)
                setErrors((current) => ({ ...current, outcome: '' }))
              }}
              title={outcomeMeta[item].hint}
            >
              {outcomeMeta[item].label}
            </button>
          ))}
        </div>
        {outcome && <span className="crm-field-hint">{outcomeMeta[outcome].hint}</span>}
      </Field>

      <div className="crm-form-grid">
        <Field label="Duration (minutes)" error={errors.duration} hint={startedAt ? `Timer: ${formatTimer(elapsed)} — override if needed` : 'Use the timer or enter manually'}>
          <Input type="number" min={0} step={0.5} value={manualDuration} placeholder={startedAt ? (elapsed / 60).toFixed(1) : '0'} onChange={(event) => setManualDuration(event.target.value)} />
        </Field>
        <Field label="Customer interest">
          <Select value={interest} onChange={(event) => setInterest(event.target.value)}>
            <option value="">Keep current ({interestMeta[lead.interest].label})</option>
            {meta.enums.interestLevels.map((item) => <option key={item} value={item}>{interestMeta[item].label}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Conversation notes">
        <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What did the customer say? Requirements, objections, budget…" />
      </Field>

      <div className="crm-form-grid">
        <Field label="Next action">
          <Input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="e.g. Send proposal on WhatsApp" />
        </Field>
        <Field label={outcome === 'callback' ? 'Callback time' : 'Follow-up'} required={outcome !== '' && needsFollowUp.includes(outcome)} error={errors.followUpAt}>
          <Input type="datetime-local" value={followUpAt} onChange={(event) => setFollowUpAt(event.target.value)} />
        </Field>
      </div>
      {outcome && suggestsFollowUp.includes(outcome) && (
        <div className="crm-quick-picks">
          <span className="crm-muted">Quick schedule:</span>
          {[['1 hour', 1], ['3 hours', 3], ['Tomorrow', 24], ['2 days', 48], ['1 week', 168]].map(([label, hours]) => (
            <button type="button" key={label} onClick={() => quickFollowUp(hours as number)}>{label}</button>
          ))}
        </div>
      )}

      <div className="crm-form-actions">
        <Button variant="primary" type="submit" loading={saving} icon="check">Save call</Button>
      </div>
    </form>
  )
}

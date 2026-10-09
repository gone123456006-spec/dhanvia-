import { useState } from 'react'
import { ApiError, formText, HONEYPOT_FIELD, submitLead, type LeadSource } from '../api'

export type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

export function useLeadSubmission(source: LeadSource) {
  const [state, setState] = useState<SubmissionState>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setState('submitting')
    setMessage('')
    try {
      const callingCode = formText(form, 'callingCode')
      const result = await submitLead({
        name: formText(form, 'name'),
        phone: formText(form, 'phone'),
        email: formText(form, 'email') || undefined,
        service: formText(form, 'service'),
        callingCode: callingCode || undefined,
        source,
        website: formText(form, HONEYPOT_FIELD) || undefined,
      })
      for (const name of ['name', 'phone', 'email']) {
        const field = form.elements.namedItem(name)
        if (field instanceof HTMLInputElement) field.value = ''
      }
      setState('success')
      setMessage(result.message)
    } catch (error) {
      setState('error')
      setMessage(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
    }
  }

  return { state, message, handleSubmit }
}

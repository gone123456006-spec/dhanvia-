const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly fields: Record<string, string>

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message)
    this.fields = fields
  }
}

export const HONEYPOT_FIELD = 'website'

const RETRYABLE_STATUSES = new Set([502, 503])
const RETRY_DELAY_MS = 1500

async function send(path: string, body: unknown): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// One retry covers a deploy/restart window; the API merges a repeated enquiry into the existing lead.
async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response | null = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    try {
      response = await send(path, body)
      if (!RETRYABLE_STATUSES.has(response.status)) break
    } catch {
      response = null
    }
  }
  if (!response) throw new ApiError('Unable to reach the server. Please check your connection and try again.')

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fields: Record<string, string> = data.fields ?? {}
    const firstFieldError = Object.values(fields)[0]
    throw new ApiError(firstFieldError ?? data.error ?? 'Something went wrong. Please try again.', fields)
  }
  return data as T
}

export type LeadSource = 'home-offer' | 'service-detail-hero' | 'service-detail' | 'other'

export interface LeadInput {
  name: string
  phone: string
  email: string
  service: string
  callingCode?: string
  source?: LeadSource
  pagePath?: string
  website?: string
}

export interface SupportRequestInput {
  name: string
  email: string
  phone: string
  message: string
  salesConsultation: boolean
  website?: string
}

export function submitLead(input: LeadInput) {
  return postJson<{ id: string; message: string }>('/api/leads', {
    ...input,
    pagePath: input.pagePath ?? window.location.pathname,
  })
}

export function submitSupportRequest(input: SupportRequestInput) {
  return postJson<{ id: string; ticketNumber: string; message: string }>('/api/support-requests', input)
}

export function formText(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name)
  return typeof value === 'string' ? value.trim() : ''
}

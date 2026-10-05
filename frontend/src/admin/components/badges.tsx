import {
  documentStatusMeta,
  interestMeta,
  outcomeMeta,
  paymentStatusMeta,
  priorityMeta,
  processingStatusMeta,
  stageMeta,
  statusMeta,
  supportStatusMeta,
  taskTypeMeta,
  type Tone,
} from '../lib/constants'
import { formatDateTime, isOverdue, isToday } from '../lib/format'
import type { CallOutcome, Interest, LeadStage, LeadStatus, Priority, TaskType } from '../lib/types'
import { Badge } from './ui'

function MetaBadge({ meta, value, dot = true }: { meta: Record<string, { label: string; tone: Tone }>; value?: string | null; dot?: boolean }) {
  if (!value) return <span className="crm-muted">—</span>
  const entry = meta[value] ?? { label: value, tone: 'gray' as Tone }
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

export const StageBadge = ({ stage }: { stage?: LeadStage | null }) => <MetaBadge meta={stageMeta} value={stage} />
export const StatusBadge = ({ status }: { status?: LeadStatus | null }) => <MetaBadge meta={statusMeta} value={status} />
export const PriorityBadge = ({ priority }: { priority?: Priority | null }) => <MetaBadge meta={priorityMeta} value={priority} dot={false} />
export const OutcomeBadge = ({ outcome }: { outcome?: CallOutcome | null }) => <MetaBadge meta={outcomeMeta} value={outcome} />
export const TaskTypeBadge = ({ type }: { type?: TaskType | null }) => <MetaBadge meta={taskTypeMeta} value={type} dot={false} />
export const DocumentStatusBadge = ({ status }: { status?: string | null }) => <MetaBadge meta={documentStatusMeta} value={status} />
export const PaymentStatusBadge = ({ status }: { status?: string | null }) => <MetaBadge meta={paymentStatusMeta} value={status} />
export const ProcessingStatusBadge = ({ status }: { status?: string | null }) => <MetaBadge meta={processingStatusMeta} value={status} />
export const SupportStatusBadge = ({ status }: { status?: string | null }) => <MetaBadge meta={supportStatusMeta} value={status} />

export function InterestBadge({ interest }: { interest?: Interest | null }) {
  if (!interest) return <span className="crm-muted">—</span>
  const meta = interestMeta[interest]
  return (
    <Badge tone={meta.tone}>{meta.label}</Badge>
  )
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'gray'
  return (
    <span className={`crm-score crm-tone-${tone}`} title="Lead score (0–100)">
      <span style={{ width: `${score}%` }} />
      <b>{score}</b>
    </span>
  )
}

export function DueLabel({ date, empty = 'Not scheduled' }: { date?: string | null; empty?: string }) {
  if (!date) return <span className="crm-muted">{empty}</span>
  const overdue = isOverdue(date)
  const today = isToday(date)
  return (
    <span className={`crm-due ${overdue ? 'overdue' : today ? 'today' : ''}`}>
      {formatDateTime(date)}
      {overdue && <span className="crm-due-flag">Overdue</span>}
    </span>
  )
}

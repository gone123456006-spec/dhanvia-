import type { InterestLevel, LeadStage, Priority } from '../domain/enums.js'

const interestPoints: Record<InterestLevel, number> = { unknown: 10, cold: 0, warm: 20, hot: 35 }
const priorityPoints: Record<Priority, number> = { low: 0, medium: 5, high: 10, urgent: 15 }
const stagePoints: Record<LeadStage, number> = {
  new: 0,
  contacted: 8,
  interested: 16,
  follow_up: 18,
  documents: 24,
  processing: 30,
  converted: 35,
  lost: 0,
}

export interface ScoreInput {
  interest: InterestLevel
  priority: Priority
  stage: LeadStage
  connectedCalls: number
  callAttempts: number
  dealValue: number
  amountPaid: number
}

/** Transparent 0-100 score: interest, priority, pipeline progress, engagement, and payment progress. */
export function calculateLeadScore(input: ScoreInput): number {
  if (input.stage === 'lost') return 0
  const engagement = Math.min(input.connectedCalls * 4, 12)
  const unansweredPenalty = Math.min(Math.max(input.callAttempts - input.connectedCalls - 2, 0) * 2, 10)
  const paymentProgress = input.dealValue > 0 ? Math.min(input.amountPaid / input.dealValue, 1) * 3 : 0
  const score = interestPoints[input.interest]
    + priorityPoints[input.priority]
    + stagePoints[input.stage]
    + engagement
    + paymentProgress
    - unansweredPenalty
  return Math.max(0, Math.min(100, Math.round(score)))
}

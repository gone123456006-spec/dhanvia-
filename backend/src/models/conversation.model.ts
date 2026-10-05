import { Schema, model } from 'mongoose'
import { conversationChannels, conversationDirections } from '../domain/enums.js'
import { preventDeletion } from './immutable.js'

const conversationSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: String, enum: conversationChannels, required: true },
    direction: { type: String, enum: conversationDirections, default: 'outbound' },
    summary: { type: String, required: true, trim: true, maxlength: 5000 },
    occurredAt: { type: Date, required: true },
  },
  { timestamps: true },
)

conversationSchema.index({ lead: 1, occurredAt: -1 })
preventDeletion(conversationSchema, 'Conversation')

export const ConversationModel = model('Conversation', conversationSchema)

import { Schema, model } from 'mongoose'

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
})

const CounterModel = model('Counter', counterSchema)

export async function nextSequence(name: string): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  ).lean()
  return counter!.seq
}

export async function nextFormattedId(name: string, prefix: string): Promise<string> {
  const seq = await nextSequence(name)
  return `${prefix}-${String(seq).padStart(6, '0')}`
}

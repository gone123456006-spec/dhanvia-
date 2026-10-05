import type { Schema } from 'mongoose'

export function preventDeletion(schema: Schema, label: string): void {
  const blocked = ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndReplace'] as const
  for (const operation of blocked) {
    schema.pre(operation, function () {
      throw new Error(`${label} records are permanent and cannot be deleted`)
    })
  }
}

export function preventUpdates(schema: Schema, label: string): void {
  const blocked = ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'] as const
  for (const operation of blocked) {
    schema.pre(operation, function () {
      throw new Error(`${label} records are immutable`)
    })
  }
}

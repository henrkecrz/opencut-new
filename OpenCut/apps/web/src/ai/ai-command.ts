import { createAIClient } from '@opencut-studio/ai-client'
import type { CommandResult, EditorAction } from '@opencut-studio/ai-types'

export type { CommandResult, EditorAction } from '@opencut-studio/ai-types'

const aiClient = createAIClient()

export async function requestAICommand(command: string): Promise<CommandResult> {
  return aiClient.command({
    command,
    timeline_state: {},
  })
}

export function formatConfidence(confidence?: number) {
  if (typeof confidence !== 'number') return '—'
  return `${Math.round(confidence * 100)}%`
}

export function formatActionParams(params: Record<string, unknown>) {
  const entries = Object.entries(params)

  if (entries.length === 0) {
    return 'Sem parâmetros adicionais'
  }

  return entries
    .map(([key, value]) => `${key}: ${formatParamValue(value)}`)
    .join(' · ')
}

function formatParamValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null) return 'null'
  return JSON.stringify(value)
}

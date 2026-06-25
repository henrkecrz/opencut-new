import { getAIBackendUrl } from './ai-status'

export interface EditorAction {
  type: string
  target?: string | null
  params: Record<string, unknown>
  description?: string
}

export interface CommandResult {
  actions: EditorAction[]
  explanation: string
  confidence?: number
}

export async function requestAICommand(command: string): Promise<CommandResult> {
  const response = await fetch(`${getAIBackendUrl()}/api/llm/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      command,
      timeline_state: {},
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as Partial<CommandResult>

  return {
    actions: Array.isArray(data.actions) ? data.actions : [],
    explanation:
      typeof data.explanation === 'string'
        ? data.explanation
        : 'A IA retornou ações para revisão.',
    confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
  }
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

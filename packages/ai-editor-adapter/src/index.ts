import type { EditorAction } from '@opencut-studio/ai-types'

export type ActionPreviewStatus = 'ready' | 'needs_review' | 'unsupported'

export interface ActionPreview {
  id: string
  action: EditorAction
  status: ActionPreviewStatus
  title: string
  description: string
  warnings: string[]
}

export interface ActionPreviewSummary {
  total: number
  ready: number
  needsReview: number
  unsupported: number
}

export interface ActionPreviewResult {
  previews: ActionPreview[]
  summary: ActionPreviewSummary
}

const SUPPORTED_ACTIONS = new Set([
  'add_text',
  'ADD_TEXT_OVERLAY',
  'cut',
  'split',
  'SPLIT_CLIP',
  'trim',
  'TRIM_CLIP',
  'mute',
  'adjust_speed',
  'add_transition',
  'fade_in',
  'fade_out',
])

export function createActionPreviews(actions: EditorAction[]): ActionPreviewResult {
  const previews = actions.map((action, index) => createActionPreview(action, index))

  return {
    previews,
    summary: {
      total: previews.length,
      ready: previews.filter((preview) => preview.status === 'ready').length,
      needsReview: previews.filter((preview) => preview.status === 'needs_review').length,
      unsupported: previews.filter((preview) => preview.status === 'unsupported').length,
    },
  }
}

export function createActionPreview(
  action: EditorAction,
  index: number,
): ActionPreview {
  const normalizedType = normalizeActionType(action.type)
  const warnings = getActionWarnings(normalizedType, action.params)
  const isSupported = SUPPORTED_ACTIONS.has(action.type) || SUPPORTED_ACTIONS.has(normalizedType)

  const status: ActionPreviewStatus = !isSupported
    ? 'unsupported'
    : warnings.length > 0
      ? 'needs_review'
      : 'ready'

  return {
    id: `${index}-${action.type}`,
    action,
    status,
    title: getActionTitle(normalizedType),
    description: getActionDescription(normalizedType, action.params),
    warnings,
  }
}

function normalizeActionType(type: string) {
  switch (type) {
    case 'ADD_TEXT_OVERLAY':
      return 'add_text'
    case 'SPLIT_CLIP':
      return 'split'
    case 'TRIM_CLIP':
      return 'trim'
    default:
      return type
  }
}

function getActionTitle(type: string) {
  switch (type) {
    case 'add_text':
      return 'Adicionar texto'
    case 'cut':
    case 'split':
      return 'Dividir clipe'
    case 'trim':
      return 'Ajustar corte'
    case 'mute':
      return 'Silenciar áudio'
    case 'adjust_speed':
      return 'Alterar velocidade'
    case 'add_transition':
      return 'Adicionar transição'
    case 'fade_in':
      return 'Adicionar fade in'
    case 'fade_out':
      return 'Adicionar fade out'
    default:
      return 'Ação não mapeada'
  }
}

function getActionDescription(type: string, params: Record<string, unknown>) {
  switch (type) {
    case 'add_text':
      return `Criar um overlay de texto${formatMaybeText(params.text)}.`
    case 'cut':
    case 'split':
      return `Dividir o clipe no ponto ${formatMaybeTime(params.time)}.`
    case 'trim':
      return `Ajustar o início/fim do clipe para ${formatRange(params.start, params.end)}.`
    case 'mute':
      return 'Silenciar o áudio do clipe selecionado.'
    case 'adjust_speed':
      return `Alterar velocidade para ${formatMaybeValue(params.speed)}.`
    case 'add_transition':
      return `Adicionar transição ${formatMaybeValue(params.type)}.`
    case 'fade_in':
      return `Aplicar fade in com duração ${formatMaybeValue(params.duration)}.`
    case 'fade_out':
      return `Aplicar fade out com duração ${formatMaybeValue(params.duration)}.`
    default:
      return 'A ação ainda não possui tradução para a timeline do OpenCut.'
  }
}

function getActionWarnings(type: string, params: Record<string, unknown>) {
  const warnings: string[] = []

  if ((type === 'cut' || type === 'split') && typeof params.time !== 'number') {
    warnings.push('Falta o parâmetro numérico time.')
  }

  if (type === 'add_text' && typeof params.text !== 'string') {
    warnings.push('Falta o texto que deve ser adicionado.')
  }

  if (type === 'adjust_speed' && typeof params.speed !== 'number') {
    warnings.push('Falta a velocidade numérica.')
  }

  if (type === 'trim' && typeof params.start !== 'number' && typeof params.end !== 'number') {
    warnings.push('Falta start ou end para ajustar o corte.')
  }

  return warnings
}

function formatMaybeText(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? `: “${value}”` : ''
}

function formatMaybeTime(value: unknown) {
  return typeof value === 'number' ? `${value.toFixed(2)}s` : 'não informado'
}

function formatMaybeValue(value: unknown) {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  return 'não informado'
}

function formatRange(start: unknown, end: unknown) {
  const formattedStart = typeof start === 'number' ? `${start.toFixed(2)}s` : 'início atual'
  const formattedEnd = typeof end === 'number' ? `${end.toFixed(2)}s` : 'fim atual'

  return `${formattedStart} → ${formattedEnd}`
}

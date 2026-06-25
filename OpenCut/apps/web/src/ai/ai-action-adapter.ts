import type { EditorAction } from './ai-command'

export type ActionPreviewStatus = 'ready' | 'needs_review' | 'unsupported'

export interface ActionPreview {
  id: string
  action: EditorAction
  status: ActionPreviewStatus
  title: string
  description: string
  warnings: string[]
}

export function createActionPreviews(actions: EditorAction[]) {
  return actions.map((action, index) => createActionPreview(action, index))
}

function createActionPreview(action: EditorAction, index: number): ActionPreview {
  const type = normalizeActionType(action.type)
  const warnings = getActionWarnings(type, action.params)
  const supported = isSupportedAction(type)

  return {
    id: `${index}-${action.type}`,
    action,
    status: !supported ? 'unsupported' : warnings.length > 0 ? 'needs_review' : 'ready',
    title: getActionTitle(type),
    description: getActionDescription(type, action.params),
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

function isSupportedAction(type: string) {
  return [
    'add_text',
    'cut',
    'split',
    'trim',
    'mute',
    'adjust_speed',
    'add_transition',
    'fade_in',
    'fade_out',
  ].includes(type)
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
      return `Criar um overlay de texto${formatText(params.text)}.`
    case 'cut':
    case 'split':
      return `Dividir o clipe no ponto ${formatTime(params.time)}.`
    case 'trim':
      return `Ajustar o início/fim do clipe para ${formatRange(params.start, params.end)}.`
    case 'mute':
      return 'Silenciar o áudio do clipe selecionado.'
    case 'adjust_speed':
      return `Alterar velocidade para ${formatValue(params.speed)}.`
    case 'add_transition':
      return `Adicionar transição ${formatValue(params.type)}.`
    case 'fade_in':
      return `Aplicar fade in com duração ${formatValue(params.duration)}.`
    case 'fade_out':
      return `Aplicar fade out com duração ${formatValue(params.duration)}.`
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

function formatText(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? `: “${value}”` : ''
}

function formatTime(value: unknown) {
  return typeof value === 'number' ? `${value.toFixed(2)}s` : 'não informado'
}

function formatValue(value: unknown) {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  return 'não informado'
}

function formatRange(start: unknown, end: unknown) {
  const formattedStart = typeof start === 'number' ? `${start.toFixed(2)}s` : 'início atual'
  const formattedEnd = typeof end === 'number' ? `${end.toFixed(2)}s` : 'fim atual'

  return `${formattedStart} → ${formattedEnd}`
}

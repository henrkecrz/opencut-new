import { createAIClient } from '@opencut-studio/ai-client'
import type { TranscriptionResult } from '@opencut-studio/ai-types'

export type {
  TranscriptionResult,
  TranscriptionSegment,
  TranscriptionWord,
} from '@opencut-studio/ai-types'

const aiClient = createAIClient()

export async function transcribeAIFile(
  file: File,
  language?: string,
): Promise<TranscriptionResult> {
  return aiClient.transcribe(file, language)
}

export function formatTimestamp(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = Math.floor(safeSeconds % 60)

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

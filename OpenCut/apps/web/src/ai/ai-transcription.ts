import { getAIBackendUrl } from './ai-status'

export interface TranscriptionWord {
  word: string
  start: number
  end: number
  confidence: number
}

export interface TranscriptionSegment {
  id: number
  text: string
  start: number
  end: number
  words: TranscriptionWord[]
  speaker?: string
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[]
  language: string
  duration: number
}

export async function transcribeAIFile(
  file: File,
  language?: string,
): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('file', file)

  if (language) {
    formData.append('language', language)
  }

  const response = await fetch(`${getAIBackendUrl()}/api/transcribe`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Transcription failed: HTTP ${response.status} - ${errorText}`)
  }

  return response.json() as Promise<TranscriptionResult>
}

export function formatTimestamp(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = Math.floor(safeSeconds % 60)

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

import { createAIClient } from '@opencut-studio/ai-client'
import type { AIBackendStatus } from '@opencut-studio/ai-types'

export type { AIBackendStatus } from '@opencut-studio/ai-types'

export type AIConnectionState = 'checking' | 'connected' | 'disconnected'

const aiClient = createAIClient()

export function getAIBackendUrl() {
  return aiClient.getBaseUrl()
}

export async function fetchAIBackendStatus(
  signal?: AbortSignal,
): Promise<AIBackendStatus> {
  if (signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError')
  }

  return aiClient.health()
}

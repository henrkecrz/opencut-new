export type AIConnectionState = 'checking' | 'connected' | 'disconnected'

export interface AIBackendStatus {
  available: boolean
  models: string[]
  gpuAvailable: boolean
  services?: string[]
  version?: string
  error?: string
}

const DEFAULT_AI_BACKEND_URL = 'http://localhost:8420'

export function getAIBackendUrl() {
  return import.meta.env.VITE_AI_BACKEND_URL || DEFAULT_AI_BACKEND_URL
}

export async function fetchAIBackendStatus(
  signal?: AbortSignal,
): Promise<AIBackendStatus> {
  const response = await fetch(`${getAIBackendUrl()}/health`, { signal })

  if (!response.ok) {
    throw new Error(`AI backend returned HTTP ${response.status}`)
  }

  return response.json() as Promise<AIBackendStatus>
}

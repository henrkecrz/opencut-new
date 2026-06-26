import { getAIBackendUrl } from './ai-status'

export type LLMProvider = 'ollama' | 'turboquant' | 'opencode' | 'openrouter'
export type LLMLevel = 'low' | 'medium' | 'max'

export interface FreeLLMModel {
  id: string
  name: string
  provider: string
  free: boolean
  recommended_level: LLMLevel
  notes?: string
}

export interface PublicLLMProviderSettings {
  provider: LLMProvider
  model: string
  level: LLMLevel
  opencode_key_configured: boolean
  openrouter_key_configured: boolean
}

export interface LLMProviderCatalog {
  providers: {
    opencode: FreeLLMModel[]
    openrouter: FreeLLMModel[]
  }
  levels: LLMLevel[]
}

export interface SaveLLMProviderSettingsInput {
  provider: LLMProvider
  model: string
  level: LLMLevel
  opencode_api_key?: string
  openrouter_api_key?: string
}

export async function getProviderSettings(): Promise<PublicLLMProviderSettings> {
  const response = await fetch(`${getAIBackendUrl()}/api/llm/providers/settings`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<PublicLLMProviderSettings>
}

export async function getProviderCatalog(): Promise<LLMProviderCatalog> {
  const response = await fetch(`${getAIBackendUrl()}/api/llm/providers/models`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<LLMProviderCatalog>
}

export async function saveProviderSettings(
  input: SaveLLMProviderSettingsInput,
): Promise<PublicLLMProviderSettings> {
  const response = await fetch(`${getAIBackendUrl()}/api/llm/providers/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `HTTP ${response.status}`)
  }

  return response.json() as Promise<PublicLLMProviderSettings>
}

export function levelLabel(level: LLMLevel) {
  switch (level) {
    case 'low':
      return 'Low — econômico e rápido'
    case 'medium':
      return 'Medium — equilíbrio'
    case 'max':
      return 'Max — melhor qualidade'
  }
}

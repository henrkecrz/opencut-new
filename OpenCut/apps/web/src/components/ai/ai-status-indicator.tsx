import { useEffect, useState } from 'react'
import {
  type AIBackendStatus,
  type AIConnectionState,
  fetchAIBackendStatus,
  getAIBackendUrl,
} from '#/ai/ai-status'

interface AIStatusIndicatorProps {
  compact?: boolean
}

export function AIStatusIndicator({ compact = false }: AIStatusIndicatorProps) {
  const [state, setState] = useState<AIConnectionState>('checking')
  const [status, setStatus] = useState<AIBackendStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function checkStatus() {
      setState('checking')
      setError(null)

      try {
        const nextStatus = await fetchAIBackendStatus(controller.signal)
        setStatus(nextStatus)
        setState(nextStatus.available ? 'connected' : 'disconnected')
      } catch (nextError) {
        if (controller.signal.aborted) return

        setStatus(null)
        setState('disconnected')
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to reach AI backend',
        )
      }
    }

    checkStatus()
    const interval = window.setInterval(checkStatus, 30_000)

    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [])

  const label = getStatusLabel(state)
  const detail = getStatusDetail(state, status, error)

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
        <StatusDot state={state} />
        <span>{label}</span>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">OpenCut AI</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Status da inteligência artificial
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
          <StatusDot state={state} />
          <span>{label}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{detail}</p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <StatusMetric label="Backend" value={getAIBackendUrl()} />
        <StatusMetric
          label="Modelos"
          value={status?.models?.length ? String(status.models.length) : '—'}
        />
        <StatusMetric
          label="GPU"
          value={status?.gpuAvailable ? 'Disponível' : 'Não detectada'}
        />
      </div>
    </section>
  )
}

function StatusDot({ state }: { state: AIConnectionState }) {
  const className =
    state === 'connected'
      ? 'bg-emerald-500'
      : state === 'checking'
        ? 'bg-amber-500'
        : 'bg-red-500'

  return <span className={`size-2.5 rounded-full ${className}`} />
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  )
}

function getStatusLabel(state: AIConnectionState) {
  switch (state) {
    case 'connected':
      return 'IA conectada'
    case 'checking':
      return 'Verificando IA'
    case 'disconnected':
      return 'IA desconectada'
  }
}

function getStatusDetail(
  state: AIConnectionState,
  status: AIBackendStatus | null,
  error: string | null,
) {
  if (state === 'checking') {
    return 'Verificando a conexão com o backend FastAPI do OpenCut-AI.'
  }

  if (state === 'connected') {
    const serviceCount = status?.services?.length ?? 0
    return serviceCount > 0
      ? `Backend conectado. ${serviceCount} serviço(s) de IA foram detectados.`
      : 'Backend conectado e pronto para receber os primeiros fluxos de IA.'
  }

  return error
    ? `Não foi possível conectar ao backend de IA: ${error}`
    : 'Backend de IA indisponível. Inicie o OpenCut-AI na porta configurada.'
}

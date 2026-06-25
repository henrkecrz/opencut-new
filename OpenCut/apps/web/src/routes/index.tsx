import { createFileRoute } from '@tanstack/react-router'
import { AIStatusIndicator } from '#/components/ai/ai-status-indicator'
import { AICommandPanel } from '#/components/ai/ai-command-panel'
import { AITranscriptionPanel } from '#/components/ai/ai-transcription-panel'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="min-h-dvh bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            OpenCut Studio
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Editor principal com motor de IA
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                Esta tela valida os primeiros fluxos entre o OpenCut e o backend
                FastAPI do OpenCut-AI: status do serviço, transcrição automática
                e comandos revisáveis para timeline.
              </p>
            </div>
            <AIStatusIndicator compact />
          </div>
        </header>

        <AIStatusIndicator />

        <AITranscriptionPanel />

        <AICommandPanel />

        <section className="grid gap-4 md:grid-cols-3">
          <IntegrationCard
            title="1. Status"
            description="Detectar se o backend de IA está disponível."
            done
          />
          <IntegrationCard
            title="2. Transcrição"
            description="Enviar mídia para /api/transcribe e receber segmentos."
            done
          />
          <IntegrationCard
            title="3. Comandos"
            description="Converter linguagem natural em ações revisáveis da timeline."
            done
          />
        </section>
      </div>
    </main>
  )
}

function IntegrationCard({
  title,
  description,
  done = false,
}: {
  title: string
  description: string
  done?: boolean
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
          {done ? 'feito' : 'próximo'}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </article>
  )
}

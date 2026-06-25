import { type FormEvent, useState } from 'react'
import {
  type CommandResult,
  formatActionParams,
  formatConfidence,
  requestAICommand,
} from '#/ai/ai-command'

const EXAMPLE_COMMANDS = [
  'Corte o silêncio inicial do vídeo',
  'Adicione uma legenda curta no começo',
  'Divida o clipe em três partes principais',
]

export function AICommandPanel() {
  const [command, setCommand] = useState('')
  const [result, setResult] = useState<CommandResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canSubmit = command.trim().length > 0 && !isLoading

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedCommand = command.trim()

    if (!normalizedCommand) {
      setError('Digite um comando para a IA interpretar.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const nextResult = await requestAICommand(normalizedCommand)
      setResult(nextResult)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Não foi possível processar o comando de IA.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Segunda ferramenta de IA
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Comandos para timeline
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Digite uma instrução em linguagem natural. A IA devolve ações
            estruturadas para revisão, sem aplicar nada automaticamente.
          </p>
        </div>
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          /api/llm/command
        </span>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium">
          Comando
          <textarea
            className="min-h-28 rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6"
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Ex.: corte o silêncio inicial e adicione uma legenda de abertura"
            value={command}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_COMMANDS.map((example) => (
            <button
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
              key={example}
              onClick={() => setCommand(example)}
              type="button"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            As ações retornadas são apenas um preview até existir o adaptador da timeline.
          </p>
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            {isLoading ? 'Interpretando...' : 'Interpretar comando'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Preview das ações</h3>
              <p className="text-sm text-muted-foreground">
                Confiança: {formatConfidence(result.confidence)} ·{' '}
                {result.actions.length} ação(ões) sugeridas.
              </p>
            </div>
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              Não aplicado
            </span>
          </div>

          <p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm leading-6">
            {result.explanation}
          </p>

          <div className="mt-4 grid gap-3">
            {result.actions.length > 0 ? (
              result.actions.map((action, index) => (
                <article
                  className="rounded-xl border border-border bg-card p-3"
                  key={`${action.type}-${index}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold">
                      {index + 1}. {action.type}
                    </h4>
                    <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {action.target ?? 'sem alvo'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {formatActionParams(action.params)}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
                A IA não retornou ações estruturadas. Revise o comando ou tente ser mais específico.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

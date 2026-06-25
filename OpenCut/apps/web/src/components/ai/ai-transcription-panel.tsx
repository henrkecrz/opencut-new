import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import {
  type TranscriptionResult,
  formatTimestamp,
  transcribeAIFile,
} from '#/ai/ai-transcription'

export function AITranscriptionPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('pt')
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const previewSegments = useMemo(
    () => result?.segments.slice(0, 6) ?? [],
    [result],
  )

  const canSubmit = selectedFile !== null && !isLoading

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setResult(null)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Selecione um arquivo de áudio ou vídeo antes de transcrever.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const nextResult = await transcribeAIFile(
        selectedFile,
        language.trim() || undefined,
      )
      setResult(nextResult)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Não foi possível transcrever o arquivo.',
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
            Primeira ferramenta de IA
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Transcrição automática
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Envie um áudio ou vídeo para validar o primeiro fluxo real entre o
            OpenCut e o backend FastAPI do OpenCut-AI.
          </p>
        </div>
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          /api/transcribe
        </span>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-[1fr_140px]">
          <label className="grid gap-2 text-sm font-medium">
            Arquivo
            <input
              accept="audio/*,video/*"
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground"
              onChange={handleFileChange}
              type="file"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Idioma
            <input
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="pt"
              type="text"
              value={language}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedFile
              ? `Selecionado: ${selectedFile.name}`
              : 'Nenhum arquivo selecionado.'}
          </p>
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            {isLoading ? 'Transcrevendo...' : 'Transcrever arquivo'}
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
              <h3 className="text-base font-semibold">Resultado da transcrição</h3>
              <p className="text-sm text-muted-foreground">
                {result.segments.length} segmento(s), idioma {result.language},
                duração aproximada de {formatTimestamp(result.duration)}.
              </p>
            </div>
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              Preview
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {previewSegments.map((segment) => (
              <article
                className="rounded-xl border border-border bg-card p-3"
                key={`${segment.id}-${segment.start}`}
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatTimestamp(segment.start)}</span>
                  <span>→</span>
                  <span>{formatTimestamp(segment.end)}</span>
                </div>
                <p className="text-sm leading-6">{segment.text}</p>
              </article>
            ))}
          </div>

          {result.segments.length > previewSegments.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Exibindo os primeiros {previewSegments.length} segmentos. A próxima
              etapa será converter esses segmentos em legendas editáveis.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

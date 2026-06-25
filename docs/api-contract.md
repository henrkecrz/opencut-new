# Contrato de API da integração IA

Este documento registra os primeiros endpoints que o OpenCut deve consumir do backend FastAPI do OpenCut-AI.

## Base URL

Desenvolvimento local:

```txt
http://localhost:8420
```

No OpenCut/Vite, usar:

```txt
VITE_AI_BACKEND_URL=http://localhost:8420
```

No backend, a porta padrão é:

```txt
8420
```

## 1. Health check

### Endpoint

```http
GET /health
```

### Objetivo

Verificar se o backend de IA está disponível e quais serviços/modelos estão acessíveis.

### Resposta esperada

```ts
interface AIBackendStatus {
  available: boolean;
  models: string[];
  gpuAvailable: boolean;
  memoryUsage?: {
    ram?: {
      usedMb: number;
      totalMb: number;
      percent: number;
    };
    gpu?: {
      usedMb: number;
      totalMb: number;
    };
  };
  error?: string;
  errorType?: AIErrorType;
}
```

### Uso no editor

- mostrar indicador de IA online/offline;
- alertar backend indisponível;
- liberar ou bloquear painéis de IA.

## 2. Transcrição

### Endpoint

```http
POST /api/transcribe
```

### Corpo

`multipart/form-data`

```txt
file: File
language?: string
```

### Resposta esperada

```ts
interface TranscriptionResult {
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

interface TranscriptionSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: TranscriptionWord[];
  speaker?: string;
}

interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}
```

### Uso no editor

- criar legendas;
- sincronizar texto com timeline;
- permitir seleção por palavra;
- gerar cortes a partir de trechos falados.

## 3. Comando de IA

### Endpoint

```http
POST /api/llm/command
```

### Corpo

```ts
interface CommandRequest {
  command: string;
  timeline_state?: unknown;
  model?: string;
}
```

### Resposta esperada

```ts
interface CommandResult {
  actions: EditorAction[];
  explanation: string;
  confidence?: number;
  raw_response?: string;
}

interface EditorAction {
  type: string;
  target?: string | null;
  params: Record<string, unknown>;
}
```

### Uso no editor

A IA deve retornar ações estruturadas, mas o editor deve exibir preview antes de aplicar.

Exemplo de fluxo:

```txt
"Corte o silêncio inicial e adicione legenda"
↓
/api/llm/command
↓
[
  { type: "trim", params: { start: 1.2 } },
  { type: "add_text", params: { text: "..." } }
]
↓
Preview
↓
Aplicar
```

## 4. Serviços detalhados

### Endpoint

```http
GET /services/health
```

### Objetivo

Verificar status individual dos serviços:

- backend;
- ollama;
- whisper;
- tts;
- image;
- speaker;
- face;
- turboquant;
- clip.

### Uso no editor

- tela de setup;
- diagnóstico;
- aviso de modelos ausentes;
- orientação de instalação.

## Regras de integração

1. O editor nunca deve chamar microserviços diretamente.
2. O editor deve conversar com o `ai-backend`.
3. O backend decide qual microserviço acionar.
4. Ações de IA devem passar por preview antes de alterar a timeline.
5. Tipos compartilhados devem ficar em `packages/ai-types`.
6. O cliente HTTP deve ficar em `packages/ai-client`.
7. A tradução de ações para comandos reais do editor deve ficar em `packages/ai-editor-adapter` ou dentro de `OpenCut/apps/web/src/ai` enquanto estiver experimental.

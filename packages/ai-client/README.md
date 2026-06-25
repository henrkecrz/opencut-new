# `packages/ai-client`

Cliente HTTP compartilhado para o OpenCut conversar com o backend FastAPI do OpenCut-AI.

Este pacote é **framework-neutral**: não depende de React, Next.js, Zustand ou aliases `@/`.

## Origem

Foi extraído/adaptado a partir de:

```txt
OpenCut-AI/apps/web/src/lib/ai-client.ts
```

## Responsabilidade

O pacote expõe uma API simples para os primeiros fluxos de integração:

- `health()` → `GET /health`
- `servicesHealth()` → `GET /services/health`
- `transcribe(file, language?)` → `POST /api/transcribe`
- `command(request)` → `POST /api/llm/command`

## Uso básico

```ts
import { createAIClient } from "@opencut-studio/ai-client";

const aiClient = createAIClient({
  baseUrl: "http://localhost:8420",
});

const status = await aiClient.health();
```

## Uso no OpenCut/Vite

O client tenta ler automaticamente:

```txt
VITE_AI_BACKEND_URL
```

Exemplo:

```env
VITE_AI_BACKEND_URL=http://localhost:8420
```

Também é possível configurar manualmente:

```ts
const aiClient = createAIClient({
  baseUrl: import.meta.env.VITE_AI_BACKEND_URL,
});
```

## Comando de IA

```ts
const result = await aiClient.command({
  command: "Corte o silêncio inicial e adicione uma legenda",
  timeline_state: {},
});
```

A resposta deve ser usada para preview antes de alterar a timeline.

## Transcrição

```ts
const result = await aiClient.transcribe(file, "pt");
```

## Regras

- O editor deve falar apenas com o `ai-backend`.
- O editor não deve chamar microserviços diretamente.
- A IA não deve aplicar ações automaticamente.
- Ações vindas da IA devem passar pelo `ai-editor-adapter`.
- Tipos compartilhados devem vir de `@opencut-studio/ai-types`.

## Próxima etapa

Integrar `aiClient.health()` no OpenCut para mostrar o primeiro indicador visual de backend conectado/desconectado.

# `packages/ai-types`

Contratos TypeScript compartilhados entre o editor OpenCut e a camada de IA.

Este pacote é framework-neutral: não depende de React, Next.js, Vite, Zustand ou aliases `@/`.

## Origem

Adaptado a partir de:

```txt
OpenCut-AI/apps/web/src/types/ai.ts
```

## Responsabilidade

Centralizar contratos para:

- status da IA;
- erros;
- transcrição;
- comandos;
- ações do editor;
- TTS;
- geração de imagem;
- geração de vídeo;
- análise de áudio;
- detecção facial;
- diarização;
- sugestões e automações;
- TurboQuant e modelos.

## Principais exports

```txt
AIBackendStatus
AIErrorType
ServicesHealth
TranscriptionResult
CommandRequest
CommandResult
EditorAction
EditorActionType
TTSRequest
TTSResult
ImageGenParams
ImageGenResult
VideoGenRequest
VideoGenResult
TurboQuantStatus
```

## Uso

```ts
import type { AIBackendStatus, CommandResult } from "@opencut-studio/ai-types";
```

## Regras

- Não depender de Next.js.
- Não depender de Vite.
- Não usar aliases como `@/`.
- Exportar apenas tipos, interfaces e enums.
- Ser a fonte única de contratos para `ai-client`, `ai-store` e `ai-editor-adapter`.

## Próxima etapa

Validar os tipos contra as respostas reais dos endpoints da API.

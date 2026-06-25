# Arquitetura do OpenCut Studio

## Objetivo

O OpenCut Studio une dois projetos originalmente independentes:

- `OpenCut/`: editor web, timeline, interface e experiência principal.
- `OpenCut-AI/`: backend de IA, microserviços, automações e módulos de inteligência artificial.

A meta não é manter dois produtos paralelos, mas consolidar uma única plataforma de edição de vídeo com IA.

## Decisão central

```txt
OpenCut = Editor principal
OpenCut-AI = Motor de IA
```

O frontend final deve ser o OpenCut. O frontend do OpenCut-AI deve ser tratado como referência de implementação para extrair clientes, tipos, hooks, stores e componentes.

## Estado atual

```txt
opencut-new/
├── OpenCut/
│   ├── apps/web      # editor web em Vite
│   └── apps/api      # API em Cloudflare Workers
└── OpenCut-AI/
    ├── apps/web      # frontend Next.js de referência
    ├── services/     # backend e microserviços de IA
    └── docker-compose.yml
```

## Arquitetura-alvo

```txt
opencut-new/
├── apps/
│   ├── editor/
│   └── edge-api/
├── services/
│   ├── ai-backend/
│   ├── whisper-service/
│   ├── tts-service/
│   ├── image-service/
│   ├── speaker-service/
│   ├── face-service/
│   ├── clip-service/
│   └── turboquant-service/
├── packages/
│   ├── ai-client/
│   ├── ai-types/
│   ├── ai-store/
│   └── ai-editor-adapter/
├── infra/
│   └── docker-compose.yml
└── docs/
```

Essa estrutura deve ser atingida gradualmente. No momento, as pastas originais `OpenCut/` e `OpenCut-AI/` devem permanecer preservadas para evitar quebra.

## Fluxo de execução

```txt
Usuário
  ↓
OpenCut Editor Web
  ↓
AI Client compartilhado
  ↓
FastAPI AI Backend
  ↓
Microserviços
  ├── Whisper
  ├── TTS
  ├── Image
  ├── CLIP
  ├── Face
  ├── Speaker
  ├── TurboQuant
  └── Ollama
```

## Camadas

### 1. Camada de editor

Responsável por:

- timeline;
- preview;
- importação de mídia;
- edição manual;
- atalhos;
- futura API de plugins;
- integração com comandos de IA.

Fonte atual: `OpenCut/apps/web`.

### 2. Camada de IA client

Responsável por:

- chamadas HTTP ao backend FastAPI;
- tratamento de erro;
- timeout;
- envio de arquivos;
- leitura de status;
- streaming/keepalive;
- abstração dos endpoints.

Fonte inicial: `OpenCut-AI/apps/web/src/lib/ai-client.ts`.

Adaptação necessária:

```txt
NEXT_PUBLIC_AI_BACKEND_URL → VITE_AI_BACKEND_URL
```

### 3. Camada de tipos

Responsável por padronizar contratos entre frontend e backend:

- transcrição;
- comandos;
- ações do editor;
- TTS;
- geração de imagem;
- vídeo;
- status do backend;
- erros.

Fonte inicial: `OpenCut-AI/apps/web/src/types/ai.ts`.

### 4. Camada de estado

Responsável por:

- status do backend;
- painel de comando;
- histórico de comandos;
- mensagens do studio;
- sugestões;
- erros de conexão.

Fonte inicial: `OpenCut-AI/apps/web/src/stores/ai-store.ts`.

### 5. Camada backend

Responsável por:

- receber requisições do editor;
- acionar microserviços;
- gerar respostas estruturadas;
- expor health checks;
- converter IA em ações do editor.

Fonte atual: `OpenCut-AI/services/ai-backend`.

### 6. Camada de microserviços

Responsável por tarefas pesadas e isoladas:

- transcrição;
- TTS;
- geração de imagem;
- reconhecimento facial;
- speaker diarization;
- CLIP embeddings;
- modelos LLM locais.

Fonte atual: `OpenCut-AI/services/*`.

## Ponto crítico: adaptador de ações

A rota `/api/llm/command` retorna ações estruturadas, mas essas ações ainda não sabem manipular a timeline real do OpenCut.

Será necessário criar uma camada:

```txt
AI Action Adapter
```

Exemplo:

```txt
AI: add_text
↓
Adapter
↓
OpenCut editor command: addTextOverlay(params)
```

Local recomendado:

```txt
packages/ai-editor-adapter/
```

ou, temporariamente:

```txt
OpenCut/apps/web/src/ai/action-adapter.ts
```

## Estratégia de migração

1. Preservar `OpenCut/` e `OpenCut-AI/`.
2. Criar documentação e pacotes-base.
3. Extrair `ai-types`.
4. Extrair `ai-client`.
5. Adaptar variáveis de ambiente para Vite.
6. Integrar `/health` no OpenCut.
7. Integrar `/api/transcribe`.
8. Integrar `/api/llm/command`.
9. Criar adaptador de ações para a timeline.
10. Reavaliar se o frontend Next.js do OpenCut-AI ainda será necessário.

## Princípio de segurança

Nenhuma etapa deve quebrar os projetos originais. Toda mudança estrutural deve ser incremental e testável.

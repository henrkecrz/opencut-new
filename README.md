# OpenCut Studio

Este repositório une o **OpenCut** e o **OpenCut-AI** em uma única base na branch `main`.

A proposta é transformar o projeto em uma plataforma open-source de edição de vídeo com recursos de inteligência artificial, usando o OpenCut como editor principal e o OpenCut-AI como motor de IA.

## Visão geral

```txt
OpenCut Studio
├── OpenCut/       Editor web, timeline e experiência principal
└── OpenCut-AI/    Backend, microserviços e módulos de inteligência artificial
```

## Componentes

### `OpenCut/`

Editor de vídeo moderno para navegador, construído com:

- React
- TypeScript
- Vite
- shadcn/ui
- Moon toolchain
- Cloudflare Workers API

Este será o **frontend principal** do produto.

### `OpenCut-AI/`

Camada de inteligência artificial para processamento e automação de vídeo, com:

- FastAPI
- Whisper/transcrição
- TTS
- CLIP/busca visual
- geração de imagem
- análise de áudio e vídeo
- Ollama/TurboQuant
- Docker Compose para orquestração dos serviços

Este será tratado como **motor de IA e referência de integração**, não como o frontend final.

## Decisão de arquitetura

A fusão técnica seguirá esta direção:

```txt
OpenCut = interface principal / timeline / editor
OpenCut-AI = backend de IA / serviços / módulos reaproveitáveis
```

O frontend Next.js existente em `OpenCut-AI/apps/web` deve ser usado como referência para extrair:

- `ai-client`
- tipos TypeScript de IA
- stores/hooks de IA
- componentes de transcrição, comando, geração e setup

Esses módulos serão gradualmente levados para pacotes compartilhados e integrados ao editor principal do OpenCut.

## Arquitetura-alvo

```txt
opencut-new/
├── README.md
├── OpenCut/
├── OpenCut-AI/
├── docs/
│   ├── architecture.md
│   ├── integration-plan.md
│   └── api-contract.md
└── packages/
    ├── ai-client/
    ├── ai-types/
    └── ai-store/
```

## Fluxo esperado

```txt
Usuário
  ↓
OpenCut Editor Web
  ↓
AI Client
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

## Próximas etapas

1. Consolidar documentação de arquitetura.
2. Criar pacotes compartilhados para IA.
3. Adaptar o `ai-client` para funcionar com Vite usando `VITE_AI_BACKEND_URL`.
4. Integrar primeiro `/health`, `/api/transcribe` e `/api/llm/command` no OpenCut.
5. Criar um adaptador de ações para traduzir comandos de IA em ações reais da timeline.
6. Reduzir gradualmente o papel do frontend Next.js do OpenCut-AI.

## Status

- [x] OpenCut e OpenCut-AI unidos na `main`
- [x] Estrutura documentada
- [ ] Pacotes compartilhados extraídos
- [ ] AI Client adaptado para o OpenCut
- [ ] Primeiro painel de IA integrado ao editor
- [ ] Adaptador de ações da timeline implementado

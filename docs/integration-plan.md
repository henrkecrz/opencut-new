# Plano de integração

## Objetivo

Integrar o OpenCut e o OpenCut-AI de forma progressiva, madura e segura.

A primeira meta não é reestruturar tudo de uma vez, mas criar uma ponte funcional entre:

```txt
OpenCut/apps/web
↓
AI Client
↓
OpenCut-AI/services/ai-backend
```

## Fase 0 — Estado atual

Concluído:

- OpenCut e OpenCut-AI estão na branch `main`.
- Os projetos foram preservados em pastas separadas.
- O README da raiz foi atualizado para refletir a fusão.
- A arquitetura de integração foi documentada.

## Fase 1 — Documentação e base comum

Criar e manter:

```txt
docs/architecture.md
docs/integration-plan.md
docs/api-contract.md
packages/ai-client/
packages/ai-types/
packages/ai-store/
```

Objetivo: preparar a extração dos módulos de IA sem quebrar os projetos originais.

## Fase 2 — Extrair tipos de IA

Origem:

```txt
OpenCut-AI/apps/web/src/types/ai.ts
```

Destino inicial:

```txt
packages/ai-types/
```

Responsabilidades:

- `TranscriptionResult`
- `CommandResult`
- `EditorAction`
- `AIBackendStatus`
- `TTSRequest`
- `TTSResult`
- `ImageGenParams`
- `VideoGenRequest`
- tipos de erro

Critério de sucesso:

- tipos podem ser importados pelo editor OpenCut;
- não dependem de Next.js;
- não dependem de aliases `@/`.

## Fase 3 — Extrair AI Client

Origem:

```txt
OpenCut-AI/apps/web/src/lib/ai-client.ts
```

Destino inicial:

```txt
packages/ai-client/
```

Mudanças obrigatórias:

```txt
process.env.NEXT_PUBLIC_AI_BACKEND_URL
↓
import.meta.env.VITE_AI_BACKEND_URL
```

Também será necessário remover dependências diretas de aliases Next/Vite específicos e consumir os tipos de `packages/ai-types`.

Critério de sucesso:

- `aiClient.health()` funciona no OpenCut;
- `aiClient.transcribe(file)` funciona no OpenCut;
- `aiClient.command(...)` funciona no OpenCut.

## Fase 4 — Integrar status da IA ao OpenCut

Criar no editor principal:

```txt
OpenCut/apps/web/src/ai/
├── ai-provider.tsx
├── use-ai-status.ts
└── ai-status-indicator.tsx
```

Primeira integração visual:

```txt
IA conectada
IA desconectada
Backend iniciando
Erro de conexão
```

Endpoint usado:

```txt
GET /health
```

Critério de sucesso:

- OpenCut mostra se o backend FastAPI está online;
- erro de conexão é claro;
- não existe dependência do frontend Next.js do OpenCut-AI.

## Fase 5 — Integrar transcrição

Endpoint usado:

```txt
POST /api/transcribe
```

Fluxo:

```txt
arquivo de áudio/vídeo
↓
aiClient.transcribe(file)
↓
TranscriptionResult
↓
legendas/segmentos no editor
```

Critério de sucesso:

- usuário envia mídia;
- backend retorna segmentos;
- editor consegue exibir ou preparar legendas.

## Fase 6 — Integrar comandos de IA

Endpoint usado:

```txt
POST /api/llm/command
```

Fluxo:

```txt
comando em linguagem natural
↓
backend LLM
↓
ações estruturadas
↓
preview no editor
↓
usuário confirma
↓
adaptador aplica na timeline
```

Regra importante:

A IA nunca deve aplicar mudanças automaticamente sem preview ou confirmação.

## Fase 7 — Criar AI Action Adapter

Local recomendado:

```txt
packages/ai-editor-adapter/
```

Responsabilidade:

Traduzir ações genéricas vindas da IA para comandos reais do OpenCut.

Exemplos:

```txt
add_text       → adicionar overlay de texto
cut            → dividir clipe
trim           → ajustar início/fim
adjust_speed   → alterar velocidade
add_transition → inserir transição
mute           → silenciar áudio
```

Critério de sucesso:

- ações da IA não dependem do backend;
- editor mantém controle final;
- cada ação pode ser validada antes de aplicar.

## Fase 8 — Reduzir frontend Next.js do OpenCut-AI

Depois que o OpenCut consumir os módulos principais, o frontend Next.js do OpenCut-AI pode virar:

- referência histórica;
- sandbox de testes;
- playground de recursos de IA;
- ou ser removido em uma etapa futura.

Não remover antes de migrar:

- tipos;
- client;
- hooks;
- stores;
- componentes úteis.

## Ordem recomendada de commits

```txt
1. docs: document architecture and integration plan
2. chore: add AI package placeholders
3. refactor: extract AI types
4. refactor: extract AI client
5. feat: add AI backend status to OpenCut editor
6. feat: add transcription integration
7. feat: add AI command preview
8. feat: add AI action adapter
```

## Critério de maturidade

A integração só deve ser considerada madura quando:

- o OpenCut for o único frontend principal;
- o backend FastAPI subir via Docker Compose;
- o editor detectar status da IA;
- ao menos um fluxo de IA funcionar de ponta a ponta;
- as ações de IA forem revisáveis antes de modificar a timeline.

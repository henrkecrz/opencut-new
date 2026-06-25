# `packages/ai-types`

Pacote planejado para centralizar os tipos TypeScript usados na integração entre o editor OpenCut e o backend de IA.

## Origem inicial

```txt
OpenCut-AI/apps/web/src/types/ai.ts
```

## Responsabilidade

Este pacote deve conter contratos compartilhados para:

- status do backend;
- erros de IA;
- transcrição;
- comandos de IA;
- ações do editor;
- TTS;
- geração de imagem;
- geração de vídeo;
- análise de áudio;
- detecção facial;
- diarização;
- sugestões e automações.

## Regras

- Não depender de Next.js.
- Não depender de Vite.
- Não usar aliases como `@/`.
- Exportar apenas tipos, interfaces e enums.
- Servir tanto ao frontend quanto a testes de contrato.

## Próxima etapa

Extrair gradualmente o conteúdo de:

```txt
OpenCut-AI/apps/web/src/types/ai.ts
```

para este pacote.

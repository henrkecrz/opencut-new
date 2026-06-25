# `packages/ai-store`

Pacote planejado para centralizar o estado de IA usado pelo editor.

## Origem inicial

```txt
OpenCut-AI/apps/web/src/stores/ai-store.ts
```

## Responsabilidade

Este pacote deve guardar estado relacionado a:

- status do backend;
- erros de conexão;
- histórico de comandos;
- painel de comando de IA;
- painel de setup;
- sugestões;
- mensagens do studio;
- ideias salvas.

## Regras

- Pode usar Zustand, se o editor principal também aceitar essa dependência.
- Não deve depender de Next.js.
- Não deve depender de componentes visuais.
- Deve importar tipos de `packages/ai-types`.
- Deve ser opcional para o editor, não obrigatório para o `ai-client`.

## Próxima etapa

Extrair o store atual e revisar se todo o estado é realmente necessário para o OpenCut.

Prioridade inicial:

```txt
backendStatus
lastError
lastErrorType
commandHistory
isCommandPanelOpen
```

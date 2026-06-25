# `packages/ai-client`

Pacote planejado para centralizar o cliente HTTP usado pelo OpenCut para conversar com o backend FastAPI do OpenCut-AI.

## Origem inicial

```txt
OpenCut-AI/apps/web/src/lib/ai-client.ts
```

## Responsabilidade

Este pacote deve expor um cliente para:

- `GET /health`;
- `GET /services/health`;
- `POST /api/transcribe`;
- `POST /api/llm/command`;
- chamadas futuras de TTS, geração de imagem, análise, exportação e vídeo.

## Adaptação obrigatória

O client original usa variável de ambiente do Next.js:

```txt
NEXT_PUBLIC_AI_BACKEND_URL
```

Para o OpenCut em Vite, o client compartilhado deve aceitar:

```txt
VITE_AI_BACKEND_URL
```

ou receber a `baseUrl` por configuração:

```ts
createAIClient({ baseUrl: import.meta.env.VITE_AI_BACKEND_URL })
```

## Regras

- Não depender de React.
- Não depender de Next.js.
- Não depender de Zustand.
- Não usar aliases `@/`.
- Consumir tipos de `packages/ai-types`.
- Permitir uso em browser e testes.

## Próxima etapa

Extrair e adaptar o client atual para uma API neutra:

```ts
const aiClient = createAIClient({
  baseUrl: "http://localhost:8420",
});
```

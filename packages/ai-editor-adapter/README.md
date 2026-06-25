# `packages/ai-editor-adapter`

Pacote responsável por transformar ações geradas pela IA em previews seguros para o editor OpenCut.

No estágio atual, ele **não aplica ações na timeline**. Ele valida, classifica e descreve o que a IA sugeriu.

## Problema

O backend de IA pode retornar ações genéricas como:

```txt
cut
trim
add_text
add_transition
adjust_speed
mute
```

Mas o OpenCut terá sua própria API interna de timeline, tracks, clips, overlays e comandos.

Este pacote será a ponte entre os dois mundos.

## Responsabilidade atual

```txt
AI action
↓
normalização
↓
validação
↓
preview seguro
↓
status: pronta | revisar | não suportada
```

## Responsabilidade futura

```txt
preview aprovado pelo usuário
↓
AI editor adapter
↓
OpenCut editor command
↓
timeline alterada com segurança
```

## API inicial

```ts
import { createActionPreviews } from "@opencut-studio/ai-editor-adapter";

const result = createActionPreviews(actions);
```

Retorno:

```ts
{
  previews: ActionPreview[];
  summary: {
    total: number;
    ready: number;
    needsReview: number;
    unsupported: number;
  };
}
```

## Status possíveis

```txt
ready         ação suportada e com parâmetros mínimos
needs_review  ação suportada, mas com parâmetros ausentes ou incompletos
unsupported   ação ainda sem tradução para o OpenCut
```

## Ações reconhecidas nesta versão

```txt
add_text
ADD_TEXT_OVERLAY
cut
split
SPLIT_CLIP
trim
TRIM_CLIP
mute
adjust_speed
add_transition
fade_in
fade_out
```

## Regras

- A IA nunca aplica mudanças diretamente.
- Toda ação deve ser validada antes.
- Toda ação deve gerar preview compreensível.
- O usuário confirma antes de alterar a timeline.
- O adaptador deve ser testável isoladamente.

## Próxima etapa

Mapear a API real da timeline do OpenCut e substituir o modo preview por comandos reais controlados, com confirmação explícita do usuário.

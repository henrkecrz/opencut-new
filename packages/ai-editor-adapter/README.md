# `packages/ai-editor-adapter`

Pacote planejado para traduzir ações geradas pela IA em ações reais da timeline do OpenCut.

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

Mas o editor OpenCut terá sua própria API interna de comandos, timeline, tracks e elementos.

Este pacote será a ponte entre os dois mundos.

## Responsabilidade

```txt
AI action
↓
validação
↓
preview
↓
confirmação do usuário
↓
OpenCut editor command
```

## Regras

- A IA nunca aplica mudanças diretamente.
- Toda ação deve ser validada antes.
- Toda ação deve gerar preview compreensível.
- O usuário confirma antes de alterar a timeline.
- O adaptador deve ser testável isoladamente.

## Exemplo futuro

```ts
const preview = adapter.preview(aiActions, editorState);

if (userConfirmed) {
  adapter.apply(aiActions, editor);
}
```

## Ações iniciais suportadas

Primeira versão deve focar em:

- `add_text`;
- `cut`;
- `trim`;
- `split`;
- `mute`;
- `adjust_speed`.

## Próxima etapa

Mapear a API real da timeline do OpenCut e criar uma tabela de equivalência entre `EditorAction` e comandos internos do editor.

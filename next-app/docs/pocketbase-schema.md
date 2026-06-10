# Schema do PocketBase – fonte de verdade

Para **evitar adivinhar** nomes de campos e tipos, use o schema exportado do PocketBase.

Para **regras de acesso** (list/create/update/delete) recomendadas por coleção, veja **`REGRAS_POCKETBASE.md`**.

## Gerar o schema

Com `.env` configurado (incluindo `POCKETBASE_ADMIN_EMAIL` e `POCKETBASE_ADMIN_PASSWORD`):

```bash
cd next-app
npm run schema
```

Isso gera **`pocketbase-schema.json`** na raiz do `next-app`, com todas as coleções e seus campos.

## Conteúdo do arquivo

- `exportedAt`: data/hora da exportação
- `collections`: array com identificação, regras de acesso e schema
- `listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule`: regras
  exportadas da coleção
- `schema`: array de campos, cada um com `name`, `type` e opções

Exports antigos podem não conter as regras de acesso. Rode `npm run schema`
novamente após atualizar o projeto para registrar essa parte da configuração.

## Uso no desenvolvimento

1. Ao criar ou alterar uma API que grava no PocketBase, **consulte** `pocketbase-schema.json` para os nomes exatos dos campos da coleção.
2. Depois de alterar o schema no painel do PocketBase (novos campos, relações, etc.), rode de novo `npm run schema` e faça commit do JSON atualizado.

## Exemplo

Para saber os campos da coleção `reports`:

```bash
node -e "const s=require('./pocketbase-schema.json'); const r=s.collections.find(c=>c.name==='reports'); console.log(JSON.stringify(r?.schema||[], null, 2))"
```

Ou abra `pocketbase-schema.json` e busque pela coleção desejada.

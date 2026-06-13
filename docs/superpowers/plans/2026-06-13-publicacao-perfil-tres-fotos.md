# Publicacao de perfil com tres fotos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar perfis como rascunho e permitir publicacao explicita somente quando houver pelo menos tres fotos.

**Architecture:** Uma regra de dominio sem dependencias centraliza o minimo de fotos e as decisoes de publicar/remover. As rotas Next.js aplicam essa regra no servidor e o formulario reutiliza os mesmos predicados para orientar o usuario, sem alterar schema, cron ou auto bump.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PocketBase, Node.js `node:test`.

---

### Task 1: Regra de dominio testavel

**Files:**
- Create: `next-app/src/lib/profile-publication.mjs`
- Create: `next-app/src/lib/profile-publication.d.mts`
- Create: `next-app/src/lib/profile-publication.test.mjs`
- Modify: `next-app/package.json`

- [x] **Step 1: Escrever testes que falham**

Cobrir o minimo de tres fotos, publicacao com tres fotos e bloqueio de remocao
que deixaria um perfil ativo abaixo do minimo.

- [x] **Step 2: Verificar o estado RED**

Run: `cd next-app && npm test`

Expected: FAIL porque `profile-publication.mjs` ainda nao existe.

- [x] **Step 3: Implementar a regra minima**

Exportar `MIN_PROFILE_PHOTOS`, `canPublishProfile`,
`canRemoveProfilePhoto` e `getMissingProfilePhotos`.

- [x] **Step 4: Verificar o estado GREEN**

Run: `cd next-app && npm test`

Expected: todos os testes PASS.

### Task 2: Criacao, publicacao e exclusao protegidas no servidor

**Files:**
- Modify: `next-app/src/app/api/profiles/route.ts`
- Create: `next-app/src/app/api/profiles/[id]/publish/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/photos/[photoId]/route.ts`

- [x] **Step 1: Criar perfil com `status = "inactive"`**

O POST de perfil deve ignorar qualquer status recebido do navegador.

- [x] **Step 2: Adicionar endpoint explicito de publicacao**

Validar sessao, propriedade do perfil e quantidade atual de fotos antes de
alterar somente o status para `active`.

- [x] **Step 3: Proteger exclusao de foto**

Carregar o status com as fotos e retornar `400` quando a exclusao deixaria um
perfil ativo com menos de tres fotos.

- [x] **Step 4: Rodar testes e checagem de tipos via build**

Run: `cd next-app && npm test && npm run build`

Expected: PASS.

### Task 3: Fluxo explicito no dashboard

**Files:**
- Modify: `next-app/src/components/DashboardPerfilForm.tsx`

- [x] **Step 1: Manter novo perfil no formulario**

Ao criar, usar o registro retornado, atualizar o estado local e abrir a aba
`midia`.

- [x] **Step 2: Mostrar progresso das fotos**

Exibir quantidade enviada, quantidade restante e requisito minimo.

- [x] **Step 3: Adicionar `Publicar perfil`**

Mostrar apenas para perfil inativo, desabilitar abaixo do minimo, chamar o
endpoint de publicacao e refletir o status retornado.

- [x] **Step 4: Explicar e bloquear remocao da terceira foto**

Desabilitar o comando de exclusao quando o perfil ativo nao continuaria com
tres fotos.

- [x] **Step 5: Rodar lint direcionado**

Run: `cd next-app && npx eslint src/components/DashboardPerfilForm.tsx src/app/api/profiles/route.ts "src/app/api/profiles/[id]/publish/route.ts" "src/app/api/profiles/[id]/photos/[photoId]/route.ts" src/lib/profile-publication.mjs`

Expected: nenhum erro.

### Task 4: Documentacao e verificacao final

**Files:**
- Modify: `AGENTS.md`
- Modify: `next-app/docs/OPERACAO_NEXT_APP.md`

- [x] **Step 1: Documentar a regra operacional**

Registrar que perfis novos nascem inativos, exigem tres fotos e publicacao
explicita, e que a terceira foto de perfil ativo nao pode ser removida.

- [x] **Step 2: Preparar restricao de status no PocketBase**

Adicionar um comando idempotente para impedir criacao ativa e alteracao direta
de `status` pelo JWT do usuario. O comando deve ser executado somente depois do
deploy desta versao.

- [x] **Step 3: Executar verificacoes completas**

Run: `cd next-app && npm test && npm run schema:check && npm run build`

Expected: PASS.

- [x] **Step 4: Revisar diff e auto bump**

Confirmar que `auto_bump.cjs`, `scripts/reset-daily-bumps.mjs` e `Dockerfile`
nao foram alterados.

- [x] **Step 5: Commitar a implementacao**

Run: `git add <arquivos alterados> && git commit -m "exige tres fotos para publicar perfil"`

Expected: commit criado na branch atual.

# Contato Publico Obrigatorio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Exigir pelo menos um WhatsApp, Telegram ou telefone preenchido e visivel em todo perfil criado ou publicado.

**Architecture:** A regra de dominio existente em `profile-publication.mjs` passara a validar pares de valor e visibilidade. O formulario reutilizara o predicado para feedback imediato, enquanto as APIs validarao a criacao, a publicacao e o estado final de atualizacoes de perfis ativos.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PocketBase, Node.js `node:test`.

---

### Task 1: Regra de contato publico

**Files:**
- Modify: `next-app/src/lib/profile-publication.test.mjs`
- Modify: `next-app/src/lib/profile-publication.mjs`
- Modify: `next-app/src/lib/profile-publication.d.mts`

- [x] **Step 1: Escrever testes falhos**

Adicionar casos para contato preenchido e publico, contato oculto, valor vazio,
somente espacos e cada um dos tres canais.

- [x] **Step 2: Verificar o estado RED**

Run: `cd next-app && npm test`

Expected: FAIL porque `hasPublicProfileContact` ainda nao existe.

- [x] **Step 3: Implementar o predicado minimo**

Exportar `hasPublicProfileContact`, considerando valido somente o par cujo valor
possui texto apos `trim()` e cuja flag de exibicao e `true`.

- [x] **Step 4: Verificar o estado GREEN**

Run: `cd next-app && npm test`

Expected: todos os testes PASS.

### Task 2: Proteger APIs

**Files:**
- Modify: `next-app/src/app/api/profiles/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/publish/route.ts`

- [x] **Step 1: Validar criacao**

Antes de criar o registro, retornar `400` com
`Preencha e torne publico pelo menos um contato.` quando nenhum canal satisfizer
a regra.

- [x] **Step 2: Validar publicacao**

Carregar os campos de contato junto com fotos e status e impedir a publicacao
sem contato publico.

- [x] **Step 3: Proteger perfil ativo em atualizacoes parciais**

Carregar status e contatos atuais, combinar com o PATCH preparado e rejeitar o
estado final que remova ou oculte o ultimo contato publico.

- [x] **Step 4: Rodar testes e lint direcionado**

Run: `cd next-app && npm test && npx eslint src/app/api/profiles/route.ts "src/app/api/profiles/[id]/route.ts" "src/app/api/profiles/[id]/publish/route.ts" src/lib/profile-publication.mjs`

Expected: testes PASS e nenhum erro de lint.

### Task 3: Feedback no formulario

**Files:**
- Modify: `next-app/src/components/DashboardPerfilForm.tsx`

- [x] **Step 1: Calcular contato publico**

Usar `hasPublicProfileContact(form)` e combinar o resultado com o requisito de
fotos para habilitar `Publicar perfil`.

- [x] **Step 2: Validar criacao e edicao ativa**

Exibir a mensagem aprovada antes da requisicao ao criar sem contato ou ao tentar
deixar um perfil ativo sem contato.

- [x] **Step 3: Orientar na secao de contato**

Mostrar `Preencha e torne publico pelo menos um contato.` e destacar o texto
quando a regra ainda nao estiver satisfeita.

- [x] **Step 4: Explicar requisito pendente na aba de midia**

Manter a contagem de fotos e informar separadamente quando falta contato
publico. O botao permanece desabilitado enquanto qualquer requisito faltar.

- [x] **Step 5: Rodar lint direcionado**

Run: `cd next-app && npx eslint src/components/DashboardPerfilForm.tsx`

Expected: nenhum erro.

### Task 4: Verificacao final

**Files:**
- Modify: `docs/superpowers/plans/2026-06-13-contato-publico-obrigatorio.md`

- [x] **Step 1: Executar testes**

Run: `cd next-app && npm test`

Expected: todos os testes PASS.

- [x] **Step 2: Validar contrato e build**

Run: `cd next-app && npm run schema:check && npm run build`

Expected: ambos terminam com exit code 0.

- [x] **Step 3: Revisar diff**

Run: `git diff --check && git status --short`

Expected: sem erros de whitespace e sem alteracoes em `auto_bump.cjs`,
`scripts/reset-daily-bumps.mjs` ou `Dockerfile`.

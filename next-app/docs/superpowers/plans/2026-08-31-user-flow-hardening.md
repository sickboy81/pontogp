# User Flow Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir autorização e separar integralmente a experiência de usuários comuns e anunciantes sem alterar dados ou schema do PocketBase.

**Architecture:** Centralizar a validação de sessão no servidor por `auth-refresh` antes de liberar credenciais administrativas. Derivar navegação e conteúdo financeiro do papel validado, proteger as rotas privadas no proxy e restringir perfis/mensagens às combinações de papéis permitidas.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PocketBase, Node test runner.

**Spec:** Auditoria do fluxo de usuário realizada em 2026-08-31 nesta tarefa.

## Global Constraints

- Aplicação oficial: `next-app/`.
- Produção: Docker/Coolify; branch `main`.
- Não alterar dados nem schema PocketBase.
- Não confiar no papel ou ID persistido no navegador para autorizar APIs.
- Preservar o fluxo de criação e publicação de perfil anunciante já validado.

---

### Task 1: Sessão validada no servidor

**Files:**
- Create: `src/lib/authenticated-session.mjs`
- Create: `src/lib/authenticated-session.d.mts`
- Test: `src/lib/authenticated-session.test.mjs`
- Modify: `src/app/api/account/settings/route.ts`
- Modify: `src/app/api/account/events/route.ts`
- Modify: `src/app/api/account/export/route.ts`
- Modify: `src/app/api/users/me/profile/route.ts`
- Modify: `src/app/api/users/[id]/profile/route.ts`
- Modify: `src/app/api/messages/conversation/route.ts`
- Modify: `src/app/api/messages/block/route.ts`

**Interfaces:**
- Produces: `authorizeSession({ pbUrl, sessionToken, fetchImpl, getAdminTokenImpl })`.

- [ ] Escrever testes que rejeitam token forjado antes de solicitar token administrativo e retornam usuário validado para sessão real.
- [ ] Executar o teste e confirmar falha por função inexistente.
- [ ] Implementar a função mínima e confirmar os testes verdes.
- [ ] Migrar rotas que combinam ID decodificado com token administrativo.

### Task 2: Navegação e conta por papel

**Files:**
- Create: `src/lib/account-navigation.mjs`
- Create: `src/lib/account-navigation.d.mts`
- Test: `src/lib/account-navigation.test.mjs`
- Modify: `src/app/(protected)/layout.tsx`
- Modify: `src/components/MinhaContaClient.tsx`

**Interfaces:**
- Produces: `getAccountNavigation(role)` e `canAccessAdvertiserBilling(role)`.

- [ ] Escrever testes garantindo que usuário não recebe Perfil/Planos e anunciante mantém as abas atuais.
- [ ] Confirmar a falha, implementar o mínimo e integrar layout/conta.

### Task 3: Proteção de páginas privadas

**Files:**
- Modify: `src/proxy.ts`
- Modify: teste estático existente de rate limit/proxy.

- [ ] Escrever teste para `/conta`, `/notificacoes` e `/pagamentos` como prefixos protegidos.
- [ ] Confirmar falha, atualizar `PROTECTED_PREFIXES` e confirmar verde.

### Task 4: Papéis permitidos em perfis e mensagens

**Files:**
- Modify: `src/lib/user-profile.mjs`
- Modify: `src/lib/user-profile.test.mjs`
- Modify: `src/lib/message-input.mjs`
- Modify: `src/lib/message-input.test.mjs`
- Modify: `src/app/api/users/[id]/profile/route.ts`
- Modify: `src/app/api/messages/route.ts`

- [ ] Escrever testes que exigem alvo `user` no perfil e par `user`/`advertiser` nas mensagens.
- [ ] Confirmar falhas, implementar regras puras e integrar as rotas.

### Task 5: Login não confirmado e verificação final

**Files:**
- Modify: `src/store/auth.ts`
- Modify: `src/app/(auth)/login/page.tsx`
- Test: novo teste puro de classificação de erro de login.

- [ ] Escrever teste para distinguir conta não confirmada da senha incorreta quando o PocketBase devolver erro genérico.
- [ ] Implementar resposta segura sem revelar existência de contas a terceiros.
- [ ] Executar testes direcionados, suíte completa, lint, build e `git diff --check`.
- [ ] Executar smoke público sem criar dados de produção.

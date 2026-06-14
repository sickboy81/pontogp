# API Rate Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proteger APIs sensiveis contra abuso com limites em memoria, identificacao correta do cliente atras da Cloudflare e respostas HTTP 429 padronizadas.

**Architecture:** Um modulo JavaScript puro concentra armazenamento, extracao de IP, politicas e metadados de resposta. Um adaptador TypeScript converte decisoes em `Response` e compoe chaves por IP/usuario. O proxy aplica um limite geral amplo em `/api/*`, enquanto rotas caras aplicam politicas especificas.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node.js test runner, modulo ESM em memoria.

---

### Task 1: Nucleo do limitador

**Files:**
- Create: `next-app/src/lib/rate-limit.mjs`
- Create: `next-app/src/lib/rate-limit.d.mts`
- Create: `next-app/src/lib/rate-limit.test.mjs`
- Remove: `next-app/src/lib/rate-limit.ts`

- [ ] **Step 1: Write the failing tests**

Cobrir primeira requisicao, bloqueio, reset, limpeza, prioridade de
`cf-connecting-ip`, fallback e normalizacao de IP invalido.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/rate-limit.test.mjs`
Expected: FAIL porque as novas exportacoes ainda nao existem.

- [ ] **Step 3: Write minimal implementation**

Criar `createRateLimiter`, `getClientIp`, `consumeRateLimit` e
`resetRateLimitStore`, com relogio injetavel e limpeza periodica.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/rate-limit.test.mjs`
Expected: PASS.

### Task 2: Adaptador HTTP e politicas

**Files:**
- Create: `next-app/src/lib/api-rate-limit.ts`
- Create: `next-app/src/lib/api-rate-limit-contract.test.mjs`

- [ ] **Step 1: Write the failing contract test**

Verificar no fonte que a resposta 429 inclui `Retry-After`,
`RateLimit-Limit`, `RateLimit-Remaining` e `RateLimit-Reset`, e que politicas
nomeadas existem para geral, contato, cadastro, PIX, escrita, upload, admin e
webhook.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/api-rate-limit-contract.test.mjs`
Expected: FAIL porque o adaptador nao existe.

- [ ] **Step 3: Write minimal implementation**

Criar `RATE_LIMIT_POLICIES`, `enforceIpRateLimit`,
`enforceUserRateLimit` e `createRateLimitResponse`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/api-rate-limit-contract.test.mjs`
Expected: PASS.

### Task 3: Limite geral e rotas publicas sensiveis

**Files:**
- Modify: `next-app/src/proxy.ts`
- Modify: `next-app/src/app/api/contact/route.ts`
- Modify: `next-app/src/app/api/auth/registration-ip/route.ts`
- Modify: `next-app/src/app/api/payments/pix/webhook/route.ts`

- [ ] **Step 1: Write failing source integration tests**

Verificar que o proxy protege `/api/*`, contato e cadastro usam politicas
especificas e webhook preserva politica propria.

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test src/lib/api-rate-limit-integration.test.mjs`
Expected: FAIL nas integracoes ausentes.

- [ ] **Step 3: Integrate the shared limiter**

Aplicar limite geral amplo no proxy e substituir chamadas antigas por
respostas padronizadas nas rotas.

- [ ] **Step 4: Run tests and confirm pass**

Run: `node --test src/lib/api-rate-limit-integration.test.mjs`
Expected: PASS.

### Task 4: Operacoes autenticadas caras

**Files:**
- Modify: `next-app/src/app/api/payments/pix/route.ts`
- Modify: `next-app/src/app/api/reports/route.ts`
- Modify: `next-app/src/app/api/messages/route.ts`
- Modify: `next-app/src/app/api/profiles/me/bump/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/publish/route.ts`
- Modify: `next-app/src/app/api/stories/create/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/photos/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/videos/route.ts`
- Modify: `next-app/src/app/api/profiles/[id]/audio/route.ts`

- [ ] **Step 1: Extend failing integration tests**

Verificar politica `pix`, `write` ou `upload` em cada rota.

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test src/lib/api-rate-limit-integration.test.mjs`
Expected: FAIL listando rotas ainda sem protecao.

- [ ] **Step 3: Add user and IP enforcement**

Aplicar o limite depois da validacao do token e antes de chamadas externas ou
processamento de arquivo.

- [ ] **Step 4: Run tests and confirm pass**

Run: `node --test src/lib/api-rate-limit-integration.test.mjs`
Expected: PASS.

### Task 5: Administracao

**Files:**
- Modify: `next-app/src/lib/api/admin-auth.ts`

- [ ] **Step 1: Write failing test for admin enforcement**

Verificar que `requireAdmin` aplica a politica administrativa antes de
consultar o PocketBase.

- [ ] **Step 2: Run test and confirm failure**

Run: `node --test src/lib/api-rate-limit-integration.test.mjs`
Expected: FAIL na protecao administrativa.

- [ ] **Step 3: Integrate admin policy**

Retornar a resposta 429 do limitador por `requireAdmin`, mantendo o contrato
existente de autorizacao.

- [ ] **Step 4: Run test and confirm pass**

Run: `node --test src/lib/api-rate-limit-integration.test.mjs`
Expected: PASS.

### Task 6: Documentacao e verificacao

**Files:**
- Modify: `AGENTS.md`
- Modify: `next-app/docs/OPERACAO_NEXT_APP.md`

- [ ] **Step 1: Document operational limits**

Registrar armazenamento em memoria, cabecalhos 429, limites por categoria e
necessidade de Redis antes de multiplas replicas.

- [ ] **Step 2: Run full verification**

Run: `npm test`
Expected: todos os testes passam.

Run: `npm run lint`
Expected: exit code 0.

Run: `npm run build`
Expected: exit code 0.

- [ ] **Step 3: Review diff**

Run: `git diff --check && git status --short`
Expected: sem erros de whitespace e somente arquivos do escopo.

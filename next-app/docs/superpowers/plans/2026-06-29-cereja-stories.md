# Cereja Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renomear o recurso visível para Cereja Stories e padronizar sua duração em 24 horas sem alterar contratos técnicos.

**Architecture:** Uma biblioteca JavaScript compartilhada exportará a duração e os cálculos de criação/fallback. APIs e componentes importarão essa fonte; apenas textos visíveis serão renomeados, mantendo rotas e coleções `stories`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner e PocketBase.

---

### Task 1: Fonte única da duração

**Files:**
- Create: `next-app/src/lib/cereja-stories.mjs`
- Create: `next-app/src/lib/cereja-stories.test.mjs`

- [ ] **Step 1: Escrever o teste que exige 24 horas**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CEREJA_STORIES_DURATION_HOURS,
  CEREJA_STORIES_DURATION_MS,
  getCerejaStoryExpiresAt,
  getLegacyCerejaStoryCutoff,
} from './cereja-stories.mjs'

const now = new Date('2026-06-29T12:00:00.000Z')

test('Cereja Stories remain active for 24 hours', () => {
  assert.equal(CEREJA_STORIES_DURATION_HOURS, 24)
  assert.equal(CEREJA_STORIES_DURATION_MS, 86_400_000)
  assert.equal(getCerejaStoryExpiresAt(now).toISOString(), '2026-06-30T12:00:00.000Z')
  assert.equal(getLegacyCerejaStoryCutoff(now).toISOString(), '2026-06-28T12:00:00.000Z')
})
```

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `cd next-app && node --test src/lib/cereja-stories.test.mjs`

Expected: FAIL porque `cereja-stories.mjs` ainda não existe.

- [ ] **Step 3: Implementar a configuração mínima**

```js
export const CEREJA_STORIES_DURATION_HOURS = 24
export const CEREJA_STORIES_DURATION_MS = CEREJA_STORIES_DURATION_HOURS * 60 * 60 * 1000

export function getCerejaStoryExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CEREJA_STORIES_DURATION_MS)
}

export function getLegacyCerejaStoryCutoff(now = new Date()) {
  return new Date(now.getTime() - CEREJA_STORIES_DURATION_MS)
}
```

- [ ] **Step 4: Executar o teste e confirmar GREEN**

Run: `cd next-app && node --test src/lib/cereja-stories.test.mjs`

Expected: 1 teste aprovado e 0 falhas.

### Task 2: APIs alinhadas em 24 horas

**Files:**
- Modify: `next-app/src/app/api/stories/create/route.ts`
- Modify: `next-app/src/app/api/stories/route.ts`
- Modify: `next-app/src/app/api/stories/mine/route.ts`

- [ ] **Step 1: Importar os cálculos compartilhados**

Em `create/route.ts`, importar `getCerejaStoryExpiresAt` e substituir o literal de 12 horas:

```ts
const expiresAt = toPBDate(getCerejaStoryExpiresAt())
```

Em `stories/route.ts`, importar `getLegacyCerejaStoryCutoff`:

```ts
const legacyCutoff = toPBDate(getLegacyCerejaStoryCutoff())
const parts = [`(expires_at > "${now}" || (expires_at = "" && created > "${legacyCutoff}"))`]
```

Em `stories/mine/route.ts`, usar o mesmo cutoff para calcular `active` em registros sem `expires_at`.

- [ ] **Step 2: Confirmar que nenhum literal funcional de 12 horas permanece**

Run: `cd next-app && rg -n "12 \\* 60 \\* 60|STORY_DURATION_HOURS = 12|twelveHoursAgo" src/app/api/stories src/components`

Expected: nenhuma ocorrência.

- [ ] **Step 3: Executar todos os testes unitários**

Run: `cd next-app && npm test`

Expected: todos aprovados e 0 falhas.

### Task 3: Branding visível Cereja Stories

**Files:**
- Modify: `next-app/src/components/DashboardClient.tsx`
- Modify: `next-app/src/components/DashboardStoriesClient.tsx`
- Modify: `next-app/src/components/StoriesSection.tsx`
- Modify: `next-app/src/components/StoryViewer.tsx`
- Modify: `next-app/src/components/AdminDashboard.tsx`
- Modify: `next-app/src/components/DashboardPerfilForm.tsx`
- Modify: `next-app/src/app/(protected)/dashboard/stories/page.tsx`
- Modify: `next-app/src/app/(site)/anunciantes/page.tsx`
- Modify: `next-app/src/app/(site)/anunciantes/layout.tsx`
- Modify: `next-app/src/app/(site)/planos/page.tsx`

- [ ] **Step 1: Usar a duração compartilhada nos componentes**

Remover `STORY_DURATION_HOURS = 12` dos dois componentes de dashboard e importar:

```ts
import { CEREJA_STORIES_DURATION_HOURS } from '@/lib/cereja-stories.mjs'
```

Substituir as referências locais por `CEREJA_STORIES_DURATION_HOURS`.

- [ ] **Step 2: Renomear apenas textos apresentados ao usuário**

Aplicar “Cereja Stories” em títulos e nomes de recurso; usar “Cereja Story” quando a mensagem se referir a uma publicação individual. Exemplos:

```tsx
<h2>Cereja Stories</h2>
<button>Nova Cereja Story</button>
```

Metadados e compartilhamento devem usar:

```ts
title: story.profile?.name
  ? `Cereja Story - ${story.profile.name}`
  : 'Cereja Stories - CerejaVIP'
```

Não alterar nomes de componentes, tipos, variáveis, endpoints, coleções nem parâmetros de URL.

- [ ] **Step 3: Verificar o branding e os identificadores técnicos**

Run: `cd next-app && rg -n "12 horas|12h|STORY_DURATION_HOURS = 12|ativos por 24h" src`

Expected: nenhuma duração antiga; a página comercial menciona “Cereja Stories” e 24 horas.

Run: `cd next-app && rg -n "/api/stories|stories=1|story=" src`

Expected: contratos técnicos continuam presentes.

- [ ] **Step 4: Executar build de produção**

Run: `cd next-app && npm run build`

Expected: exit code 0.

### Task 4: Validação real e encerramento

**Files:**
- No committed test artifacts.

- [ ] **Step 1: Publicar registro temporário pela API de produção**

Criar usuário e perfil temporários no PocketBase, autenticar e enviar imagem para `POST /api/stories/create` com o cookie `cerejavip_token`.

- [ ] **Step 2: Verificar expiração e interações**

Confirmar que `expires_at - created` está entre 23h59 e 24h01, que a listagem pública retorna o registro e que curtir/comentar retornam HTTP 200.

- [ ] **Step 3: Limpar dados temporários**

Excluir comentário, curtida, story, perfil e usuário temporários, nesta ordem. Confirmar que as contagens retornaram ao valor inicial.

- [ ] **Step 4: Revisar diff e commit**

Run: `git diff --check && git status --short`

Expected: sem erros de whitespace; somente arquivos do Cereja Stories e mudanças preexistentes aparecem.

Commit somente os arquivos desta implementação, sem incluir `.env`, schema ou mudanças pendentes não relacionadas.

# Publication and Expiration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a 700-character bio at publication and implement the approved 7/30/90-day public visibility lifecycle.

**Architecture:** Keep draft saves permissive and centralize publication/lifecycle calculations in pure `.mjs` helpers covered by Node tests. API routes and profile queries consume these helpers; PocketBase settings store explicit lifecycle windows.

**Tech Stack:** Next.js 16, TypeScript, PocketBase REST API, Node test runner.

---

### Task 1: Bio publication contract

**Files:**
- Modify: `next-app/src/lib/profile-publication.mjs`
- Modify: `next-app/src/lib/profile-publication.test.mjs`
- Modify: `next-app/src/app/api/profiles/[id]/publish/route.ts`
- Modify: `next-app/src/components/DashboardPerfilForm.tsx`

- [ ] **Step 1: Write failing helper tests**

Add imports and assertions:

```js
import {
  MIN_PROFILE_BIO_LENGTH,
  getMissingProfileBioCharacters,
  hasPublishableProfileBio,
} from './profile-publication.mjs'

test('requires 700 trimmed bio characters for publication', () => {
  assert.equal(MIN_PROFILE_BIO_LENGTH, 700)
  assert.equal(hasPublishableProfileBio('x'.repeat(699)), false)
  assert.equal(hasPublishableProfileBio(`  ${'x'.repeat(700)}  `), true)
  assert.equal(getMissingProfileBioCharacters('x'.repeat(650)), 50)
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="700 trimmed bio"`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement the pure rule**

Add:

```js
export const MIN_PROFILE_BIO_LENGTH = 700

export function hasPublishableProfileBio(bio) {
  return String(bio ?? '').trim().length >= MIN_PROFILE_BIO_LENGTH
}

export function getMissingProfileBioCharacters(bio) {
  return Math.max(0, MIN_PROFILE_BIO_LENGTH - String(bio ?? '').trim().length)
}
```

- [ ] **Step 4: Apply the server validation**

Include `bio` in the PocketBase `fields` query and reject before publication:

```ts
if (!hasPublishableProfileBio(profile.bio)) {
  return Response.json(
    {
      error: `Escreva uma bio com pelo menos ${MIN_PROFILE_BIO_LENGTH} caracteres antes de publicar.`,
      bioLength: String(profile.bio ?? '').trim().length,
      minimumBioLength: MIN_PROFILE_BIO_LENGTH,
    },
    { status: 400 }
  )
}
```

- [ ] **Step 5: Reflect the same rule in the form**

Compute:

```ts
const missingBioCharacters = getMissingProfileBioCharacters(form.bio)
const hasPublishableBio = missingBioCharacters === 0
const canPublish =
  canPublishProfile(photoCount) && hasPublicContact && hasPublishableBio
```

Render a live counter beside the bio field and include the missing bio count in
the publication checklist. Do not block draft save.

- [ ] **Step 6: Verify**

Run: `cd next-app; npm test`

Expected: all publication tests PASS.

- [ ] **Step 7: Commit**

```bash
git add next-app/src/lib/profile-publication.mjs next-app/src/lib/profile-publication.test.mjs next-app/src/app/api/profiles/[id]/publish/route.ts next-app/src/components/DashboardPerfilForm.tsx
git commit -m "exige bio completa para publicar perfil"
```

### Task 2: Explicit lifecycle helper

**Files:**
- Create: `next-app/src/lib/profile-visibility.mjs`
- Create: `next-app/src/lib/profile-visibility.test.mjs`
- Modify: `next-app/src/lib/parse-expiration-settings.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Create tests for exact boundaries:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getProfileVisibilityState } from './profile-visibility.mjs'

const now = new Date('2026-06-14T12:00:00Z')
const expired = (days) =>
  new Date(now.getTime() - days * 86400000).toISOString()

test('keeps normal photos through the first seven days', () => {
  assert.equal(getProfileVisibilityState(expired(6), now).mode, 'normal')
})

test('keeps profile unavailable in search from day seven to day thirty', () => {
  assert.deepEqual(getProfileVisibilityState(expired(7), now), {
    mode: 'unavailable',
    listed: true,
    direct: true,
    archived: false,
  })
})

test('removes from search at day thirty but keeps direct link until day ninety', () => {
  assert.equal(getProfileVisibilityState(expired(30), now).listed, false)
  assert.equal(getProfileVisibilityState(expired(89), now).direct, true)
  assert.equal(getProfileVisibilityState(expired(90), now).archived, true)
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="day thirty"`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the state machine**

Export defaults and a deterministic result:

```js
export const DEFAULT_PROFILE_VISIBILITY_POLICY = {
  blur_after_days: 7,
  remove_from_search_after_days: 30,
  archive_after_days: 90,
}

export function getProfileVisibilityState(searchExpiresAt, now = new Date(), policy = DEFAULT_PROFILE_VISIBILITY_POLICY) {
  if (!searchExpiresAt) return { mode: 'normal', listed: true, direct: true, archived: false }
  const expires = new Date(searchExpiresAt)
  if (Number.isNaN(expires.getTime()) || expires > now) {
    return { mode: 'normal', listed: true, direct: true, archived: false }
  }
  const days = Math.floor((now.getTime() - expires.getTime()) / 86400000)
  if (days >= policy.archive_after_days) return { mode: 'archived', listed: false, direct: false, archived: true }
  if (days >= policy.remove_from_search_after_days) return { mode: 'unavailable', listed: false, direct: true, archived: false }
  if (days >= policy.blur_after_days) return { mode: 'unavailable', listed: true, direct: true, archived: false }
  return { mode: 'normal', listed: true, direct: true, archived: false }
}
```

- [ ] **Step 4: Expand the settings type and parser**

Replace the two-field policy with:

```ts
export type ProfileVisibilityPolicy = {
  blur_after_days: number
  remove_from_search_after_days: number
  archive_after_days: number
}
```

Normalize ordering to `1 <= blur < remove < archive <= 365` and migrate old
values by interpreting `unavailable_after_days` as `blur_after_days`.

- [ ] **Step 5: Verify**

Run: `cd next-app; npm test`

Expected: all lifecycle tests PASS.

- [ ] **Step 6: Commit**

```bash
git add next-app/src/lib/profile-visibility.mjs next-app/src/lib/profile-visibility.test.mjs next-app/src/lib/parse-expiration-settings.ts
git commit -m "define ciclo publico de perfis expirados"
```

### Task 3: Apply lifecycle to queries and profile presentation

**Files:**
- Modify: `next-app/src/lib/api/profiles.ts`
- Modify: `next-app/src/lib/types.ts`
- Modify: `next-app/src/app/api/admin/expiration-settings/route.ts`
- Modify: `next-app/src/app/(admin)/admin/configuracao/page.tsx`

- [ ] **Step 1: Replace duplicated date calculations**

Import `getProfileVisibilityState` and use it after records are mapped. Add to
the `Profile` type:

```ts
visibility_mode?: 'normal' | 'unavailable' | 'archived'
search_expired_days?: number
is_unavailable?: boolean
```

- [ ] **Step 2: Restrict list queries at 30 days**

Build the PocketBase list cutoff from
`remove_from_search_after_days`, then perform the same helper check after
mapping. Direct profile lookup uses `direct`; sitemap uses `listed`.

- [ ] **Step 3: Preserve contact independence**

Do not derive contact visibility from search expiry. `ProfileView` and
`LinkBioView` continue hiding contacts only when `contact_expires_at` is past,
while photos use `visibility_mode === 'unavailable'`.

- [ ] **Step 4: Update admin configuration**

Render and save three fields:

```ts
{
  blur_after_days: 7,
  remove_from_search_after_days: 30,
  archive_after_days: 90,
}
```

Labels must state “Desfocar”, “Retirar das buscas” and “Arquivar”.

- [ ] **Step 5: Verify**

Run:

```bash
cd next-app
npm test
npm run lint
npm run build
```

Expected: tests and build PASS; lint has no new errors.

- [ ] **Step 6: Commit**

```bash
git add next-app/src/lib/api/profiles.ts next-app/src/lib/types.ts next-app/src/app/api/admin/expiration-settings/route.ts next-app/src/app/(admin)/admin/configuracao/page.tsx
git commit -m "aplica janelas de visibilidade dos perfis"
```

### Task 4: Align cleanup and operational documentation

**Files:**
- Modify: `next-app/scripts/cleanup_profiles.mjs`
- Modify: `next-app/docs/OPERACAO_NEXT_APP.md`
- Modify: `next-app/docs/PENDENCIAS_PRODUCAO.md`

- [ ] **Step 1: Make cleanup archive only at 90 days**

Load `profile_visibility_policy`, calculate the archive cutoff, and update only
records beyond it. Remove the behavior that changes status to `muted` when
contact expires; contact expiry is enforced at render/API level.

- [ ] **Step 2: Add dry-run output**

Support `CLEANUP_DRY_RUN=true` and log candidate IDs without patching them.

- [ ] **Step 3: Document safe activation**

Document backup, dry run, sample verification and the fact that the job remains
unscheduled until explicitly enabled in Coolify.

- [ ] **Step 4: Verify**

Run: `cd next-app; npm run build`

Run against a non-production PocketBase with `CLEANUP_DRY_RUN=true`.

Expected: only profiles expired for 90 or more days are listed.

- [ ] **Step 5: Commit**

```bash
git add next-app/scripts/cleanup_profiles.mjs next-app/docs/OPERACAO_NEXT_APP.md next-app/docs/PENDENCIAS_PRODUCAO.md
git commit -m "alinha limpeza ao ciclo de expiracao"
```

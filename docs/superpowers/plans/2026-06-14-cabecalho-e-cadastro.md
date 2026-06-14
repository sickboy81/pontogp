# Header and Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the header on downward scrolling and separate advertiser/client registration without duplicating authentication.

**Architecture:** Extract scroll-direction decisions into a pure helper and a focused hook. Keep one registration form, but gate it behind a role-selection step driven by a validated query parameter.

**Tech Stack:** React 19, Next.js App Router, TypeScript, Tailwind CSS, Node test runner.

---

### Task 1: Scroll-direction behavior

**Files:**
- Create: `next-app/src/lib/header-scroll.mjs`
- Create: `next-app/src/lib/header-scroll.test.mjs`
- Create: `next-app/src/hooks/useAutoHideHeader.ts`
- Modify: `next-app/src/components/SiteHeader.tsx`

- [ ] **Step 1: Write failing direction tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getHeaderVisibility } from './header-scroll.mjs'

test('keeps header visible near top and while an overlay is open', () => {
  assert.equal(getHeaderVisibility({ previousY: 40, currentY: 20, locked: false }), true)
  assert.equal(getHeaderVisibility({ previousY: 100, currentY: 160, locked: true }), true)
})

test('hides only after meaningful downward movement', () => {
  assert.equal(getHeaderVisibility({ previousY: 100, currentY: 104, locked: false }), true)
  assert.equal(getHeaderVisibility({ previousY: 100, currentY: 120, locked: false }), false)
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="meaningful downward"`

Expected: FAIL.

- [ ] **Step 3: Implement helper and hook**

Use a 10px delta and a 24px top safe zone. The hook listens with
`requestAnimationFrame`, uses a passive scroll listener, and returns `visible`.
Its `locked` input is true while any menu/drawer/location panel is open.

- [ ] **Step 4: Apply to the header**

Add:

```tsx
className={`site-header sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur transition-transform duration-300 ${
  headerVisible ? 'translate-y-0' : '-translate-y-full'
}`}
```

Reset visibility on pathname changes and disable motion under
`motion-reduce:transition-none`.

- [ ] **Step 5: Verify**

Run: `cd next-app; npm test; npm run build`

Manual mobile viewport: scroll down, up, open drawer, change route.

- [ ] **Step 6: Commit**

```bash
git add next-app/src/lib/header-scroll.mjs next-app/src/lib/header-scroll.test.mjs next-app/src/hooks/useAutoHideHeader.ts next-app/src/components/SiteHeader.tsx
git commit -m "oculta cabecalho conforme a rolagem"
```

### Task 2: Registration role selection

**Files:**
- Create: `next-app/src/lib/registration-role.mjs`
- Create: `next-app/src/lib/registration-role.test.mjs`
- Create: `next-app/src/components/RegistrationRoleChooser.tsx`
- Modify: `next-app/src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Write failing role tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRegistrationRole } from './registration-role.mjs'

test('accepts only advertiser and user roles', () => {
  assert.equal(parseRegistrationRole('advertiser'), 'advertiser')
  assert.equal(parseRegistrationRole('user'), 'user')
  assert.equal(parseRegistrationRole('admin'), null)
  assert.equal(parseRegistrationRole(null), null)
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="accepts only advertiser"`

Expected: FAIL.

- [ ] **Step 3: Implement parser and chooser**

The chooser renders two large cards with concrete benefits. Its callback accepts
only `'advertiser' | 'user'`.

- [ ] **Step 4: Convert registration into two stages**

Initialize role from `searchParams.get('tipo')`. If absent/invalid, show only
the chooser. Once selected, show the shared form with a visible role summary
and “Trocar tipo de conta”. Preserve filled fields when returning to chooser.

- [ ] **Step 5: Tailor copy and completion**

Advertiser copy references profile creation and publication. Client copy
references favorites and messages. Keep the existing verification-email route;
include the role query so the pending page can show the correct next step.

- [ ] **Step 6: Verify**

Run: `cd next-app; npm test; npm run lint; npm run build`

Manual: both choices, back/forward, invalid query, form preservation.

- [ ] **Step 7: Commit**

```bash
git add next-app/src/lib/registration-role.mjs next-app/src/lib/registration-role.test.mjs next-app/src/components/RegistrationRoleChooser.tsx next-app/src/app/(auth)/register/page.tsx
git commit -m "separa cadastro de anunciante e cliente"
```

### Task 3: Route entry points and verification copy

**Files:**
- Modify: `next-app/src/components/SiteHeader.tsx`
- Modify: `next-app/src/app/(site)/anunciantes/page.tsx`
- Modify: `next-app/src/app/(auth)/verificar-email-pendente/page.tsx`

- [ ] **Step 1: Point advertiser CTAs to the advertiser flow**

Use `/register?tipo=advertiser` for “Anunciar grátis” and advertiser landing
CTAs. Keep generic “Criar conta” links at `/register`.

- [ ] **Step 2: Tailor the pending-email next step**

Read and validate `tipo`; after verification explain that advertisers create a
profile while clients can explore favorites and messaging.

- [ ] **Step 3: Verify**

Run: `cd next-app; npm run build`

Manual: all advertiser CTAs land directly on the advertiser form.

- [ ] **Step 4: Commit**

```bash
git add next-app/src/components/SiteHeader.tsx next-app/src/app/(site)/anunciantes/page.tsx next-app/src/app/(auth)/verificar-email-pendente/page.tsx
git commit -m "direciona entradas para o cadastro correto"
```

# Premium Profile and Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Hybrid Premium profile and verify story likes/comments end to end.

**Architecture:** Split the oversized profile view into presentation-focused components while retaining its existing data and actions. Extract story interaction validation into pure helpers, then harden API routes and PocketBase rules.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS, PocketBase, Node test runner.

---

### Task 1: Profile presentation boundaries

**Files:**
- Create: `next-app/src/components/profile/ProfileHero.tsx`
- Create: `next-app/src/components/profile/ProfileSummary.tsx`
- Create: `next-app/src/components/profile/ProfileActions.tsx`
- Create: `next-app/src/components/profile/ProfileSections.tsx`
- Modify: `next-app/src/components/ProfileView.tsx`

- [ ] **Step 1: Define component contracts**

Use explicit props; do not let child components fetch:

```ts
type ProfileHeroProps = {
  profile: Profile
  photos: string[]
  unavailable: boolean
  onOpenPhoto: (index: number) => void
  onShare: () => void
}
```

`ProfileActions` receives already-calculated contact/message availability and
tracking callbacks. `ProfileSections` receives profile content and media.

- [ ] **Step 2: Extract without visual change**

Move existing JSX into the four components, preserving current behavior,
lightbox, story viewer, report modal and mobile contact bar.

- [ ] **Step 3: Verify refactor**

Run: `cd next-app; npm run lint; npm run build`

Manual: open a profile, lightbox, stories, report and each contact action.

- [ ] **Step 4: Commit**

```bash
git add next-app/src/components/profile next-app/src/components/ProfileView.tsx
git commit -m "separa estrutura da pagina de perfil"
```

### Task 2: Hybrid Premium layout

**Files:**
- Modify: `next-app/src/components/profile/ProfileHero.tsx`
- Modify: `next-app/src/components/profile/ProfileSummary.tsx`
- Modify: `next-app/src/components/profile/ProfileActions.tsx`
- Modify: `next-app/src/components/profile/ProfileSections.tsx`
- Modify: `next-app/src/app/globals.css`

- [ ] **Step 1: Build the approved composition**

Implement:

- dominant `3/4` hero media;
- identity and badges layered over a dark gradient;
- price/media/status summary directly below;
- compact availability/verification panel;
- primary contact and internal-message actions;
- editorial bio, services, schedule and media sections;
- refined fixed contact bar on mobile.

- [ ] **Step 2: Add restrained effects**

Add named CSS classes for staggered reveal, featured glow and image hover.
Every animation must have:

```css
@media (prefers-reduced-motion: reduce) {
  .profile-reveal,
  .profile-featured-glow,
  .profile-media-hover {
    animation: none;
    transition: none;
    transform: none;
  }
}
```

- [ ] **Step 3: Preserve unavailable behavior**

At visibility mode `unavailable`, blur/grayscale all public photos, suppress
media opening if that is the existing policy, and display a clear unavailable
badge. Contact display still depends solely on `contact_expires_at`.

- [ ] **Step 4: Verify responsive behavior**

Run: `cd next-app; npm run build`

Browser checks at 390x844, 768x1024 and 1440x900:

- no horizontal overflow;
- primary actions remain reachable;
- bio is readable;
- unavailable state is unmistakable;
- reduced motion removes animation.

- [ ] **Step 5: Commit**

```bash
git add next-app/src/components/profile next-app/src/app/globals.css
git commit -m "implementa perfil hibrido premium"
```

### Task 3: Story interaction validation

**Files:**
- Create: `next-app/src/lib/story-interactions.mjs`
- Create: `next-app/src/lib/story-interactions.test.mjs`
- Modify: `next-app/src/app/api/stories/[id]/like/route.ts`
- Modify: `next-app/src/app/api/stories/[id]/likes/route.ts`
- Modify: `next-app/src/app/api/stories/[id]/comments/route.ts`

- [ ] **Step 1: Write failing validation tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeStoryComment, canInteractWithStory } from './story-interactions.mjs'

test('rejects empty and oversized comments', () => {
  assert.deepEqual(normalizeStoryComment('   '), { ok: false, error: 'Conteúdo obrigatório' })
  assert.equal(normalizeStoryComment('x'.repeat(501)).ok, false)
  assert.deepEqual(normalizeStoryComment(' oi '), { ok: true, content: 'oi' })
})

test('allows interaction only with active unexpired stories', () => {
  const now = new Date('2026-06-14T12:00:00Z')
  assert.equal(canInteractWithStory({ active: true, expires_at: '2026-06-14T13:00:00Z' }, now), true)
  assert.equal(canInteractWithStory({ active: false }, now), false)
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="oversized comments"`

Expected: FAIL.

- [ ] **Step 3: Implement helpers**

Normalize comment length to 500 and reject inactive, missing or expired stories.

- [ ] **Step 4: Verify story before writes**

Both POST routes fetch the story with an admin token, return 404 when missing
and 410 when inactive/expired. Reuse the helper for comments and likes.

- [ ] **Step 5: Make like toggling duplicate-safe**

Before create, list by `(story,user)`. If more than one record exists, delete
duplicates while preserving one. The returned count must come from a fresh
server query.

- [ ] **Step 6: Stop hiding server failures**

GET endpoints may return empty data only for genuine empty collections. Return
an error status when PocketBase fails, so the viewer can show a retry message.

- [ ] **Step 7: Verify**

Run: `cd next-app; npm test; npm run build`

Manual authenticated checks: like, unlike, double tap, comment, expired story,
logged-out interaction.

- [ ] **Step 8: Commit**

```bash
git add next-app/src/lib/story-interactions.mjs next-app/src/lib/story-interactions.test.mjs next-app/src/app/api/stories/[id]/like/route.ts next-app/src/app/api/stories/[id]/likes/route.ts next-app/src/app/api/stories/[id]/comments/route.ts
git commit -m "endurece curtidas e comentarios dos stories"
```

### Task 4: PocketBase story contracts and viewer errors

**Files:**
- Modify: `next-app/scripts/check-schema-contracts.mjs`
- Modify: `next-app/pocketbase-schema.json` only after exporting live schema
- Modify: `next-app/src/components/StoryViewer.tsx`
- Modify: `next-app/docs/REGRAS_POCKETBASE.md`

- [ ] **Step 1: Extend schema checks**

Require:

- `story_likes.story` and `.user` relations;
- `story_comments.story`, `.user` and text `content`;
- authenticated create rules;
- owner delete/update rules where applicable.

- [ ] **Step 2: Apply schema changes only if checks expose drift**

Use the PocketBase admin panel or a dedicated audited script. Then run:

```bash
cd next-app
npm run schema
npm run schema:check
```

Expected: exported schema matches production and checks PASS.

- [ ] **Step 3: Add viewer retry states**

Track like/comment load errors separately. Show a compact retry action without
closing or advancing the story.

- [ ] **Step 4: Verify complete surface**

Run:

```bash
cd next-app
npm test
npm run lint
npm run build
npm run start
npm run smoke:critical
```

Expected: all automated gates PASS; smoke requires the local server.

- [ ] **Step 5: Commit**

```bash
git add next-app/scripts/check-schema-contracts.mjs next-app/pocketbase-schema.json next-app/src/components/StoryViewer.tsx next-app/docs/REGRAS_POCKETBASE.md
git commit -m "valida contratos dos stories no pocketbase"
```

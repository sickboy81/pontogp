# Advertiser Onboarding Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the advertiser profile flow explicitly guide drafts through a 150-character bio, public contact, three photos and final publication.

**Architecture:** Keep publication rules centralized in `profile-publication.mjs`, add a pure onboarding-state helper consumed by the editor and dashboard, and add a small authenticated telemetry endpoint that writes privacy-safe structured events to server logs. Preserve existing PocketBase records, public route filtering and explicit publish API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node test runner, PocketBase authentication.

**Spec:** `next-app/docs/superpowers/specs/2026-09-02-advertiser-onboarding-completion.md`

## Global Constraints

- Minimum publishable bio: 150 meaningful characters.
- Minimum photos: 3.
- Publishing remains an explicit action.
- Drafts remain unavailable on public routes.
- Telemetry contains no profile content or contact/account identifiers.
- Existing unrelated worktree files must remain untouched.

---

### Task 1: Shared onboarding state

**Files:**
- Create: `next-app/src/lib/profile-onboarding.mjs`
- Create: `next-app/src/lib/profile-onboarding.d.mts`
- Test: `next-app/src/lib/profile-onboarding.test.mjs`
- Modify: `next-app/src/lib/profile-publication.mjs`
- Modify: `next-app/src/lib/profile-publication.test.mjs`

**Interfaces:**
- Consumes: `hasPublishableProfileBio`, `getMissingProfileBioCharacters`, `getMissingProfilePhotos`, `hasPublicProfileContact`.
- Produces: `getProfileOnboardingState(profile)` with completion items, first pending step, action label and destination.

- [x] Write failing tests for the 150-character rule and each first-pending destination.
- [x] Run `node --test src/lib/profile-publication.test.mjs src/lib/profile-onboarding.test.mjs` and confirm the expected failures.
- [x] Change the shared minimum and implement the onboarding-state helper.
- [x] Re-run the targeted tests and confirm they pass.

### Task 2: Guided editor and continuation

**Files:**
- Modify: `next-app/src/components/DashboardPerfilForm.tsx`
- Test: `next-app/src/lib/profile-onboarding.test.mjs`

**Interfaces:**
- Consumes: `getProfileOnboardingState(profile)`.
- Produces: visible requirements before draft creation, accurate progress, guided description copy, "Salvar e continuar", renamed "Link na bio" tab and actionable publication blockers.

- [x] Add failing helper expectations for creation and saved-draft continuation labels.
- [x] Confirm the tests fail for the missing behavior.
- [x] Integrate the helper into the editor and route to the first pending requirement after save.
- [x] Confirm targeted tests and lint pass.

### Task 3: Draft dashboard routing

**Files:**
- Modify: `next-app/src/components/DashboardClient.tsx`
- Test: `next-app/src/lib/profile-onboarding.test.mjs`

**Interfaces:**
- Consumes: `getProfileOnboardingState(profile)`.
- Produces: a draft notice and CTA matching the actual first missing requirement.

- [x] Add failing dashboard-state expectations for missing bio, contact, photos and ready-to-publish states.
- [x] Run the test and confirm failure.
- [x] Replace the photo-only dashboard message and route with the shared state.
- [x] Re-run tests and lint.

### Task 4: Privacy-safe onboarding telemetry

**Files:**
- Create: `next-app/src/lib/profile-onboarding-event.mjs`
- Create: `next-app/src/lib/profile-onboarding-event.d.mts`
- Create: `next-app/src/lib/profile-onboarding-event.test.mjs`
- Create: `next-app/src/app/api/profiles/onboarding-event/route.ts`
- Modify: `next-app/src/components/DashboardPerfilForm.tsx`

**Interfaces:**
- Produces: `normalizeProfileOnboardingEvent(input)` allowing only known event and step values.
- API accepts `{ event, step }`, validates the authenticated advertiser session and emits a structured server log without request metadata or user content.

- [x] Write failing normalization tests for allowed values and rejected extra data.
- [x] Run the tests and confirm failure.
- [x] Implement normalization, authenticated endpoint and non-blocking client calls.
- [x] Re-run targeted tests and lint.

### Task 5: Regression verification

**Files:**
- Verify all modified source and test files.

**Interfaces:**
- Confirms the complete repository behavior without changing public visibility.

- [x] Run `npm test`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Review `git diff --check` and ensure unrelated worktree files are not included.

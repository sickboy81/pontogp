# Messages and Presence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global read-only maintenance mode for internal messages and make online presence expire consistently.

**Architecture:** Store message availability in the existing `settings` collection and enforce it in the send API. Extract presence calculation into a pure helper shared by server mapping and dashboard timers.

**Tech Stack:** Next.js 16, React 19, PocketBase, Node test runner.

---

### Task 1: Message settings contract

**Files:**
- Create: `next-app/src/lib/internal-messages-settings.mjs`
- Create: `next-app/src/lib/internal-messages-settings.test.mjs`
- Create: `next-app/src/app/api/internal-messages-settings/route.ts`
- Create: `next-app/src/app/api/admin/internal-messages-settings/route.ts`

- [ ] **Step 1: Write failing parser tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInternalMessagesSettings } from './internal-messages-settings.mjs'

test('defaults messages to enabled', () => {
  assert.deepEqual(parseInternalMessagesSettings(null), { enabled: true, notice: '' })
})

test('normalizes disabled notice', () => {
  assert.deepEqual(parseInternalMessagesSettings({ enabled: false, notice: ' Manutenção ' }), {
    enabled: false,
    notice: 'Manutenção',
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="defaults messages"`

Expected: FAIL because the parser does not exist.

- [ ] **Step 3: Implement parser and settings key**

```js
export const INTERNAL_MESSAGES_SETTINGS_KEY = 'internal_messages'
export const DEFAULT_INTERNAL_MESSAGES_NOTICE =
  'As mensagens internas estão temporariamente indisponíveis.'

function safeJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function parseInternalMessagesSettings(raw) {
  const value = typeof raw === 'string' ? safeJson(raw) : raw
  return {
    enabled: value?.enabled !== false,
    notice: typeof value?.notice === 'string' ? value.notice.trim().slice(0, 500) : '',
  }
}
```

- [ ] **Step 4: Add public GET and admin GET/PATCH**

Follow the existing announcement routes. Admin PATCH must use `requireAdmin()`,
upsert `settings.key = "internal_messages"` and return normalized data.

- [ ] **Step 5: Verify**

Run: `cd next-app; npm test; npm run build`

Expected: parser tests and route compilation PASS.

- [ ] **Step 6: Commit**

```bash
git add next-app/src/lib/internal-messages-settings.mjs next-app/src/lib/internal-messages-settings.test.mjs next-app/src/app/api/internal-messages-settings/route.ts next-app/src/app/api/admin/internal-messages-settings/route.ts
git commit -m "adiciona configuracao global de mensagens"
```

### Task 2: Enforce read-only messaging

**Files:**
- Modify: `next-app/src/app/api/messages/route.ts`
- Modify: `next-app/src/components/MessageThread.tsx`
- Modify: `next-app/src/components/MensagensClient.tsx`
- Modify: `next-app/src/components/ProfileView.tsx`
- Modify: `next-app/src/components/LinkBioView.tsx`

- [ ] **Step 1: Add the server guard**

Before processing the POST body, load the setting and return:

```ts
if (!settings.enabled) {
  return Response.json(
    { error: settings.notice || DEFAULT_INTERNAL_MESSAGES_NOTICE, code: 'MESSAGES_DISABLED' },
    { status: 503 }
  )
}
```

GET conversation/history routes remain available.

- [ ] **Step 2: Load setting in messaging UI**

`MensagensClient` loads `/api/internal-messages-settings` once and passes the
result to `MessageThread`. Show an alert above the conversation list when
disabled.

- [ ] **Step 3: Disable only compose actions**

`MessageThread` keeps history, read receipts and user blocking active, but
disables input/send and displays the configured notice.

- [ ] **Step 4: Update profile entry points**

When disabled, replace internal-message links with a disabled control that
shows the notice. External WhatsApp, Telegram and phone actions remain governed
only by contact expiry.

- [ ] **Step 5: Verify**

Manual API check:

```bash
curl -i -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  --cookie "cerejavip_token=$CEREJAVIP_TEST_TOKEN" \
  -d '{"recipient_id":"user-id","content":"teste"}'
```

Expected while disabled: HTTP 503 and `MESSAGES_DISABLED`.

Run: `cd next-app; npm run lint; npm run build`

- [ ] **Step 6: Commit**

```bash
git add next-app/src/app/api/messages/route.ts next-app/src/components/MessageThread.tsx next-app/src/components/MensagensClient.tsx next-app/src/components/ProfileView.tsx next-app/src/components/LinkBioView.tsx
git commit -m "bloqueia envio durante manutencao das mensagens"
```

### Task 3: Add admin controls

**Files:**
- Modify: `next-app/src/app/(admin)/admin/configuracao/page.tsx`

- [ ] **Step 1: Add state and initial fetch**

Load the admin endpoint with the other configuration calls:

```ts
const [messagesEnabled, setMessagesEnabled] = useState(true)
const [messagesNotice, setMessagesNotice] = useState('')
const [savingMessages, setSavingMessages] = useState(false)
```

- [ ] **Step 2: Add save handler**

PATCH `{ enabled: messagesEnabled, notice: messagesNotice }`, surface server
errors, and show a success toast that distinguishes enabled/disabled.

- [ ] **Step 3: Add the admin section**

Add a shortcut and a section with switch, 500-character textarea, current
effect explanation and save button.

- [ ] **Step 4: Verify**

Run: `cd next-app; npm run build`

Manual: disable, verify read-only mode, change notice, re-enable, send message.

- [ ] **Step 5: Commit**

```bash
git add next-app/src/app/(admin)/admin/configuracao/page.tsx
git commit -m "adiciona controle admin das mensagens"
```

### Task 4: Presence helper and dashboard expiry

**Files:**
- Create: `next-app/src/lib/profile-presence.mjs`
- Create: `next-app/src/lib/profile-presence.test.mjs`
- Modify: `next-app/src/lib/api/profiles.ts`
- Modify: `next-app/src/components/DashboardClient.tsx`

- [ ] **Step 1: Write failing presence tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { isProfileEffectivelyOnline } from './profile-presence.mjs'

const now = new Date('2026-06-14T12:00:00Z')

test('treats expired and invalid presence as offline', () => {
  assert.equal(isProfileEffectivelyOnline(true, '2026-06-14T11:59:59Z', now), false)
  assert.equal(isProfileEffectivelyOnline(true, 'invalid', now), false)
})

test('supports explicit online without a deadline', () => {
  assert.equal(isProfileEffectivelyOnline(true, '', now), true)
})
```

- [ ] **Step 2: Verify failure**

Run: `cd next-app; npm test -- --test-name-pattern="expired and invalid"`

Expected: FAIL.

- [ ] **Step 3: Implement and use the helper**

```js
export function isProfileEffectivelyOnline(isOnline, onlineUntil, now = new Date()) {
  if (isOnline !== true) return false
  if (!onlineUntil) return true
  const deadline = new Date(onlineUntil)
  return !Number.isNaN(deadline.getTime()) && deadline > now
}
```

Use it in `mapProfile`.

- [ ] **Step 4: Fix dashboard source of truth**

After PATCH, map the returned `is_online` and `online_until` instead of toggling
local state blindly. Add a timeout for the active deadline that sets effective
presence offline without requiring reload.

- [ ] **Step 5: Verify**

Run: `cd next-app; npm test; npm run build`

Manual: activate for one hour using a temporary short deadline in development
and verify the badge disappears when the deadline passes.

- [ ] **Step 6: Commit**

```bash
git add next-app/src/lib/profile-presence.mjs next-app/src/lib/profile-presence.test.mjs next-app/src/lib/api/profiles.ts next-app/src/components/DashboardClient.tsx
git commit -m "corrige expiracao do status online"
```

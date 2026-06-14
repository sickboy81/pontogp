import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_INTERNAL_MESSAGES_NOTICE,
  parseInternalMessagesSettings,
  selectDeterministicSettingsRecord,
} from './internal-messages-settings.mjs'

test('defaults internal messages settings to enabled with the default notice', () => {
  assert.equal(
    DEFAULT_INTERNAL_MESSAGES_NOTICE,
    'As mensagens internas estão temporariamente indisponíveis.',
  )
  assert.deepEqual(parseInternalMessagesSettings(undefined), {
    enabled: true,
    notice: '',
  })
})

test('normalizes notice by trimming and limiting it to 500 characters', () => {
  assert.deepEqual(
    parseInternalMessagesSettings({
      enabled: false,
      notice: `  ${'a'.repeat(510)}  `,
    }),
    {
      enabled: false,
      notice: 'a'.repeat(500),
    },
  )
})

test('uses the stable default notice when internal messages are explicitly disabled without a custom notice', () => {
  assert.deepEqual(
    parseInternalMessagesSettings('{"enabled":false,"notice":"   "}'),
    {
      enabled: false,
      notice: DEFAULT_INTERNAL_MESSAGES_NOTICE,
    },
  )
})

test('selects the same deterministic settings record when duplicates exist', () => {
  const selected = selectDeterministicSettingsRecord([
    { id: 'second', created: '2026-06-14 10:00:00.000Z', value: { enabled: false } },
    { id: 'first', created: '2026-06-14 09:00:00.000Z', value: { enabled: true } },
    { id: 'third', created: '2026-06-14 11:00:00.000Z', value: { enabled: true } },
  ])

  assert.deepEqual(selected, {
    id: 'first',
    created: '2026-06-14 09:00:00.000Z',
    value: { enabled: true },
  })
})

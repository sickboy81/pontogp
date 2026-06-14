import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_INTERNAL_MESSAGES_NOTICE,
  parseInternalMessagesSettings,
} from './internal-messages-settings.mjs'

test('defaults internal messages settings to enabled with the default notice', () => {
  assert.deepEqual(parseInternalMessagesSettings(undefined), {
    enabled: true,
    notice: DEFAULT_INTERNAL_MESSAGES_NOTICE,
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

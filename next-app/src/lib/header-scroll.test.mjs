import assert from 'node:assert/strict'
import test from 'node:test'

import { getHeaderVisibility } from './header-scroll.mjs'

test('keeps header visible near top and while an overlay is open', () => {
  assert.equal(getHeaderVisibility({ previousY: 40, currentY: 20, locked: false }), true)
  assert.equal(getHeaderVisibility({ previousY: 100, currentY: 160, locked: true }), true)
})

test('hides only after meaningful downward movement', () => {
  assert.equal(getHeaderVisibility({ previousY: 100, currentY: 104, locked: false }), true)
  assert.equal(getHeaderVisibility({ previousY: 100, currentY: 120, locked: false }), false)
})

test('shows the header again after meaningful upward movement', () => {
  assert.equal(
    getHeaderVisibility({
      previousY: 160,
      currentY: 140,
      locked: false,
      previousVisible: false,
    }),
    true,
  )
})

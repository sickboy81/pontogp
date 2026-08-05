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
  assert.equal(canInteractWithStory({ active: false, expires_at: '2026-06-14T13:00:00Z' }, now), false)
  assert.equal(canInteractWithStory({ expires_at: '2026-06-14T13:00:00Z' }, now), true)
  assert.equal(canInteractWithStory({ active: true, expires_at: '2026-06-14T11:00:00Z' }, now), false)
  assert.equal(canInteractWithStory({ active: true }, now), false)
})

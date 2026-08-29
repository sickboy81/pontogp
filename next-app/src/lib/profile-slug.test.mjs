import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePublicProfileSlug } from './profile-slug.mjs'

test('normalizes accented usernames and removes trailing separators', () => {
  assert.equal(normalizePublicProfileSlug('@Branquinha Delícia-'), 'branquinha-delicia')
})

test('returns null for an empty optional username', () => {
  assert.equal(normalizePublicProfileSlug('   @---   '), null)
})

test('keeps the slug bounded and URL-safe', () => {
  const slug = normalizePublicProfileSlug('Nome_ válido / teste!!!')
  assert.equal(slug, 'nome-valido-teste')
  assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

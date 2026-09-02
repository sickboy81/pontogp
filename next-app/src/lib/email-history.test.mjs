import test from 'node:test'
import assert from 'node:assert/strict'
import { buildEmailHistoryQuery, getEmailHistoryFailure } from './email-history.mjs'

test('builds a stable PocketBase query for the email history', () => {
  const query = buildEmailHistoryQuery({ page: 2, perPage: 10, template: 'profile-completion', status: 'sent' })
  assert.match(query, /page=2&perPage=10/)
  assert.match(query, /sort=-created/)
  assert.match(query, /filter=/)
  assert.match(query, /expand=profile%2Csender_admin/)
})

test('does not turn a history API failure into an empty successful result', () => {
  assert.deepEqual(getEmailHistoryFailure(503), {
    configured: false,
    error: 'Não foi possível consultar o histórico de emails.',
  })
})

import test from 'node:test'
import assert from 'node:assert/strict'
import * as profileOwner from './profile-owner-record.mjs'

const { selectOwnerProfileRecord } = profileOwner

test('selects the most recently updated profile when a user has legacy duplicates', () => {
  const selected = selectOwnerProfileRecord([
    { id: 'old-empty', updated: '2026-08-05 19:29:45.350Z', photos: [] },
    { id: 'current', updated: '2026-08-05 20:49:48.338Z', photos: ['a', 'b', 'c', 'd', 'e'] },
  ])

  assert.equal(selected?.id, 'current')
})

test('returns null when the user has no profile records', () => {
  assert.equal(selectOwnerProfileRecord([]), null)
})

test('validates the session before loading an inactive owned profile with server credentials', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    if (String(url).endsWith('/api/collections/users/auth-refresh')) {
      return Response.json({ record: { id: 'owner-1', role: 'advertiser' } })
    }
    return Response.json({ id: 'draft-1', user: 'owner-1', status: 'inactive', photos: [] })
  }

  const result = await profileOwner.authorizeProfileOwner({
    pbUrl: 'https://pb.example.com',
    profileId: 'draft-1',
    sessionToken: 'session-token',
    fields: 'id,user,status,photos',
    fetchImpl,
    getAdminTokenImpl: async () => 'admin-token',
  })

  assert.equal(result.ok, true)
  assert.equal(result.profile?.status, 'inactive')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].options.headers.Authorization, 'Bearer session-token')
  assert.equal(calls[1].options.headers.Authorization, 'Bearer admin-token')
})

test('rejects an invalid session before using server credentials', async () => {
  let adminRequested = false
  const result = await profileOwner.authorizeProfileOwner({
    pbUrl: 'https://pb.example.com',
    profileId: 'draft-1',
    sessionToken: 'forged-token',
    fetchImpl: async () => new Response(null, { status: 401 }),
    getAdminTokenImpl: async () => {
      adminRequested = true
      return 'admin-token'
    },
  })

  assert.deepEqual(result, { ok: false, status: 401, error: 'Sessão inválida. Entre novamente.' })
  assert.equal(adminRequested, false)
})

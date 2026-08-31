import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { authorizeSession } from './authenticated-session.mjs'

test('validates the PocketBase session before requesting server credentials', async () => {
  const calls = []
  const result = await authorizeSession({
    pbUrl: 'https://pb.example.com',
    sessionToken: 'valid-token',
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), options })
      return Response.json({ record: { id: 'user-1', role: 'user', verified: true } })
    },
    getAdminTokenImpl: async () => 'admin-token',
  })

  assert.equal(result.ok, true)
  assert.equal(result.userId, 'user-1')
  assert.equal(result.user?.role, 'user')
  assert.equal(result.adminToken, 'admin-token')
  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /users\/auth-refresh$/)
  assert.equal(calls[0].options.headers.Authorization, 'Bearer valid-token')
})

test('rejects a forged session before requesting server credentials', async () => {
  let adminRequested = false
  const result = await authorizeSession({
    pbUrl: 'https://pb.example.com',
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

test('reports server credential unavailability only after a valid session', async () => {
  const result = await authorizeSession({
    pbUrl: 'https://pb.example.com',
    sessionToken: 'valid-token',
    fetchImpl: async () => Response.json({ record: { id: 'user-1', role: 'user' } }),
    getAdminTokenImpl: async () => null,
  })

  assert.deepEqual(result, { ok: false, status: 503, error: 'Serviço indisponível. Tente novamente em instantes.' })
})

test('user account routes validate the session before using administrative credentials', async () => {
  const routes = [
    '../app/api/account/settings/route.ts',
    '../app/api/account/events/route.ts',
    '../app/api/account/export/route.ts',
    '../app/api/users/me/profile/route.ts',
    '../app/api/users/[id]/profile/route.ts',
    '../app/api/messages/conversation/route.ts',
    '../app/api/messages/block/route.ts',
    '../app/api/payments/history/route.ts',
    '../app/api/notifications/route.ts',
    '../app/api/push/subscribe/route.ts',
    '../app/api/profiles/route.ts',
    '../app/api/profiles/me/route.ts',
    '../app/api/profiles/me/stats/route.ts',
    '../app/api/profiles/me/bump/route.ts',
  ]

  for (const route of routes) {
    const source = await readFile(new URL(route, import.meta.url), 'utf8')
    assert.match(source, /authorizeSession\(/, `${route} deve validar a sessão no PocketBase`)
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

function assertUsesPolicy(content, enforcement, policy) {
  assert.match(content, new RegExp(`${enforcement}\\(`))
  assert.match(content, new RegExp(`RATE_LIMIT_POLICIES\\.${policy}`))
}

test('proxy applies the general API rate limit', async () => {
  const content = await source('proxy.ts')
  assertUsesPolicy(content, 'enforceIpRateLimit', 'general')
  assert.match(content, /pathname\.startsWith\(['"]\/api\/['"]\)/)
})

test('public sensitive routes use dedicated IP policies', async () => {
  const routes = [
    ['app/api/contact/route.ts', 'contact'],
    ['app/api/auth/register/route.ts', 'registration'],
    ['app/api/payments/pix/webhook/route.ts', 'webhook'],
  ]

  for (const [path, policy] of routes) {
    assertUsesPolicy(await source(path), 'enforceIpRateLimit', policy)
  }
})

test('authenticated expensive routes use user and IP policies', async () => {
  const routes = [
    ['app/api/payments/pix/route.ts', 'pix'],
    ['app/api/reports/route.ts', 'write'],
    ['app/api/messages/route.ts', 'write'],
    ['app/api/profiles/me/bump/route.ts', 'write'],
    ['app/api/profiles/[id]/publish/route.ts', 'write'],
    ['app/api/stories/create/route.ts', 'upload'],
    ['app/api/profiles/[id]/photos/route.ts', 'upload'],
    ['app/api/profiles/[id]/videos/route.ts', 'upload'],
    ['app/api/profiles/[id]/audio/route.ts', 'upload'],
  ]

  for (const [path, policy] of routes) {
    assertUsesPolicy(await source(path), 'enforceUserRateLimit', policy)
  }
})

test('admin API requests use the shared admin policy in the proxy', async () => {
  const content = await source('proxy.ts')
  assertUsesPolicy(content, 'enforceUserRateLimit', 'admin')
  assert.match(content, /pathname\.startsWith\(['"]\/api\/admin\/['"]\)/)
})

test('account, notifications and payment history require an authenticated page session', async () => {
  const content = await source('proxy.ts')
  for (const path of ['/conta', '/notificacoes', '/pagamentos']) {
    assert.match(content, new RegExp(`['"]${path}['"]`), `${path} deve estar em PROTECTED_PREFIXES`)
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { canAccessAccountPath, canAccessAdvertiserBilling, getAccountNavigation } from './account-navigation.mjs'

test('regular users receive only client navigation', () => {
  assert.deepEqual(getAccountNavigation('user'), [
    '/dashboard',
    '/favoritos',
    '/mensagens',
    '/notificacoes',
    '/conta',
  ])
  assert.equal(canAccessAdvertiserBilling('user'), false)
})

test('advertisers keep profile and plan navigation without client-only favorites', () => {
  assert.deepEqual(getAccountNavigation('advertiser'), [
    '/dashboard',
    '/dashboard/perfil',
    '/mensagens',
    '/planos',
    '/notificacoes',
    '/conta',
  ])
  assert.equal(canAccessAdvertiserBilling('advertiser'), true)
  assert.equal(canAccessAdvertiserBilling('admin'), true)
})

test('regular users cannot open advertiser management routes directly', () => {
  assert.equal(canAccessAccountPath('user', '/dashboard/perfil'), false)
  assert.equal(canAccessAccountPath('user', '/dashboard/stories'), false)
  assert.equal(canAccessAccountPath('user', '/pagamentos'), false)
  assert.equal(canAccessAccountPath('user', '/diretrizes-fotos-videos'), false)
  assert.equal(canAccessAccountPath('user', '/dashboard'), true)
  assert.equal(canAccessAccountPath('user', '/mensagens'), true)
  assert.equal(canAccessAccountPath('advertiser', '/dashboard/perfil'), true)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { canMessageAccountRoles, validateMessageInput } from './message-input.mjs'

const sender = 'abc123456789012'

test('accepts a valid recipient and trims message content', () => {
  assert.deepEqual(validateMessageInput(sender, 'xyz123456789012', '  Olá  '), {
    recipientId: 'xyz123456789012',
    content: 'Olá',
  })
})

test('rejects self messages, invalid recipients and oversized content', () => {
  assert.equal(validateMessageInput(sender, sender, 'Olá').error, 'Você não pode enviar mensagem para si mesmo.')
  assert.equal(validateMessageInput(sender, 'invalid', 'Olá').error, 'Destinatário inválido.')
  assert.match(validateMessageInput(sender, 'xyz123456789012', 'x'.repeat(2001)).error, /2000/)
})

test('allows messages only between a regular user and an advertiser account', () => {
  assert.equal(canMessageAccountRoles('user', 'advertiser'), true)
  assert.equal(canMessageAccountRoles('advertiser', 'user'), true)
  assert.equal(canMessageAccountRoles('admin', 'user'), true)
  assert.equal(canMessageAccountRoles('user', 'user'), false)
  assert.equal(canMessageAccountRoles('advertiser', 'advertiser'), false)
  assert.equal(canMessageAccountRoles('user', 'admin'), true)
})

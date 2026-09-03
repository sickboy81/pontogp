import test from 'node:test'
import assert from 'node:assert/strict'
import {
  phoneContactHref,
  telegramContactHref,
  whatsAppContactHref,
} from './contact-prefill.mjs'

test('adds Brazil country code to a WhatsApp number entered with DDD', () => {
  const href = whatsAppContactHref('(11) 99999-9999', 'https://cerejavip.com/perfil/teste')

  assert.match(href, /^https:\/\/wa\.me\/5511999999999\?text=/)
})

test('preserves an explicit international WhatsApp number', () => {
  const href = whatsAppContactHref('+55 21 99999-9999', 'https://cerejavip.com/perfil/teste')

  assert.match(href, /^https:\/\/wa\.me\/5521999999999\?text=/)
})

test('does not generate a WhatsApp link when the country code cannot be inferred', () => {
  assert.equal(whatsAppContactHref('99999-9999', 'https://cerejavip.com/perfil/teste'), '')
})

test('normalizes a Telegram URL to a safe username link', () => {
  const href = telegramContactHref('https://t.me/cerejavip_atende', 'https://cerejavip.com/perfil/teste')

  assert.match(href, /^https:\/\/t\.me\/cerejavip_atende\?text=/)
})

test('generates an international tel link for a Brazilian local phone', () => {
  assert.equal(phoneContactHref('(21) 3333-4444'), 'tel:+552133334444')
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { applyEmailTemplateOverride, normalizeEmailTemplateOverrides } from './email-template-settings.mjs'

test('normalizes editable email templates with safe limits', () => {
  const result = normalizeEmailTemplateOverrides({ 'plan-expired': { subject: '  Olá  ', body: 'Mensagem {{nome}}' }, unknown: { body: 'não entra' } })
  assert.equal(result['plan-expired'].subject, 'Olá')
  assert.equal(result['plan-expired'].body, 'Mensagem {{nome}}')
  assert.equal(result.unknown, undefined)
})

test('renders permitted variables without allowing HTML in the body', () => {
  const result = applyEmailTemplateOverride({ subject: 'Original', text: 'Texto', html: '<h1>old</h1><p><a href="#">old</a></p>' }, { subject: 'Oi {{nome}}', body: '<script>alert(1)</script>\nLink {{link}}' }, { nome: 'Ana', link: 'https://cerejavip.com/dashboard' })
  assert.equal(result.subject, 'Oi Ana')
  assert.match(result.text, /<script>/)
  assert.doesNotMatch(result.html, /<script>/)
  assert.match(result.html, /&lt;script&gt;/)
})

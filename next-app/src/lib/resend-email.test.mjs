import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildContactEmail,
  buildPocketBaseResendSettings,
  getResendEmailConfig,
} from './resend-email.mjs'

test('requires the Resend key, sender and contact recipient', () => {
  assert.equal(getResendEmailConfig({}), null)
  assert.deepEqual(
    getResendEmailConfig({
      RESEND_API_KEY: 're_test',
      RESEND_FROM_EMAIL: 'CerejaVIP <no-reply@cerejavip.com>',
      CONTACT_EMAIL_TO: 'contato@cerejavip.com',
    }),
    {
      apiKey: 're_test',
      from: 'CerejaVIP <no-reply@cerejavip.com>',
      contactTo: 'contato@cerejavip.com',
    }
  )
})

test('builds a safe contact email with reply-to set to the visitor', () => {
  const email = buildContactEmail(
    {
      name: '<Maria>',
      email: 'maria@example.com',
      subject: 'Parceria & suporte',
      message: '<script>alert(1)</script>\nOlá',
    },
    {
      from: 'CerejaVIP <no-reply@cerejavip.com>',
      contactTo: 'contato@cerejavip.com',
    }
  )

  assert.equal(email.reply_to, 'maria@example.com')
  assert.deepEqual(email.to, ['contato@cerejavip.com'])
  assert.match(email.subject, /Parceria & suporte/)
  assert.doesNotMatch(email.html, /<script>/)
  assert.match(email.html, /&lt;script&gt;/)
  assert.match(email.text, /Olá/)
})

test('builds PocketBase SMTP settings for Resend without changing unrelated settings', () => {
  assert.deepEqual(
    buildPocketBaseResendSettings({ apiKey: 're_test', appUrl: 'https://cerejavip.com' }),
    {
      smtp: {
        enabled: true,
        host: 'smtp.resend.com',
        port: 587,
        username: 'resend',
        password: 're_test',
        tls: false,
        authMethod: 'PLAIN',
        localName: 'cerejavip.com',
      },
      meta: {
        appName: 'CerejaVIP',
        appUrl: 'https://cerejavip.com',
        senderName: 'CerejaVIP',
        senderAddress: 'no-reply@cerejavip.com',
      },
    }
  )
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildContactEmail,
  buildLoginAlertEmail,
  buildPocketBaseEmailTemplates,
  buildPocketBaseResendSettings,
  getResendEmailConfig,
} from './resend-email.mjs'

test('builds a login alert with the real IP and timestamp', () => {
  const email = buildLoginAlertEmail(
    { email: 'user@example.com' },
    '203.0.113.10',
    new Date('2026-08-24T15:30:00.000Z'),
    { from: 'CerejaVIP <no-reply@cerejavip.com>' }
  )

  assert.deepEqual(email.to, ['user@example.com'])
  assert.match(email.html, /203\.0\.113\.10/)
  assert.match(email.text, /203\.0\.113\.10/)
  assert.doesNotMatch(email.html, /ACTION_(TIME|IP)/)
})

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

test('builds PocketBase auth templates with CerejaVIP confirmation routes', () => {
  const templates = buildPocketBaseEmailTemplates('https://cerejavip.com')
  assert.equal(templates.verificationTemplate.actionUrl, 'https://cerejavip.com/verificar-email?token={TOKEN}')
  assert.equal(templates.resetPasswordTemplate.actionUrl, 'https://cerejavip.com/redefinir-senha?token={TOKEN}')
  assert.equal(templates.confirmEmailChangeTemplate.actionUrl, 'https://cerejavip.com/verificar-email?token={TOKEN}')
  assert.match(templates.otp.emailTemplate.body, /\{OTP\}/)
  assert.match(templates.authAlert.emailTemplate.body, /\{ACTION_TIME\}/)
  assert.match(templates.authAlert.emailTemplate.body, /\{ACTION_IP\}/)
  assert.match(templates.verificationTemplate.body, /href="https:\/\/cerejavip\.com\/verificar-email\?token=\{TOKEN\}"/)
  assert.match(templates.resetPasswordTemplate.body, /href="https:\/\/cerejavip\.com\/redefinir-senha\?token=\{TOKEN\}"/)
  assert.match(templates.verificationTemplate.body, /max-width:600px/)
  assert.match(templates.verificationTemplate.body, /background-color:#e31e24/)
  assert.match(templates.verificationTemplate.body, /CerejaVIP/)
})

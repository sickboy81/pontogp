import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeSentryEvent } from './sentry-privacy.mjs'

test('removes request data and user content before sending an event', () => {
  const event = {
    message: 'Falha ao carregar perfil',
    request: {
      url: 'https://cerejavip.com/api/messages?token=secret',
      headers: { authorization: 'Bearer secret', cookie: 'session=secret' },
      data: { message: 'conteúdo privado', document: 'base64-documento' },
    },
    user: { id: 'user-123', email: 'user@example.com', username: 'perfil' },
    contexts: { profile: { bio: 'texto privado' } },
    breadcrumbs: [{ data: { url: '/perfil/user-123', body: 'mensagem privada' } }],
    extra: { payload: 'conteúdo privado' },
  }

  const sanitized = sanitizeSentryEvent(event)

  assert.equal(sanitized.request, undefined)
  assert.equal(sanitized.user, undefined)
  assert.equal(sanitized.contexts, undefined)
  assert.equal(sanitized.breadcrumbs, undefined)
  assert.equal(sanitized.extra, undefined)
  assert.equal(sanitized.message, 'Falha ao carregar perfil')
})

test('keeps technical exception information while removing sensitive exception values', () => {
  const sanitized = sanitizeSentryEvent({
    exception: {
      values: [{ type: 'TypeError', value: 'Cannot read properties of undefined' }],
    },
    tags: { route: '/api/profiles' },
    fingerprint: ['profiles', 'load'],
  })

  assert.deepEqual(sanitized.exception, {
    values: [{ type: 'TypeError', value: 'Cannot read properties of undefined' }],
  })
  assert.deepEqual(sanitized.tags, { route: '/api/profiles' })
  assert.deepEqual(sanitized.fingerprint, ['profiles', 'load'])
})

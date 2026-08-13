import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVerificationPayload } from './verification-payload.mjs'

test('inclui tipo e nome completo na solicitação de verificação', () => {
  assert.deepEqual(
    buildVerificationPayload({ profileId: 'profile123', userId: 'user123', fullName: 'Ana Souza', documentType: 'cnh' }),
    { profile: 'profile123', user: 'user123', status: 'pending', full_name: 'Ana Souza', document_type: 'cnh', terms_accepted: false }
  )
})

test('inclui aceite dos termos na solicitação de verificação', () => {
  const payload = buildVerificationPayload({
    profileId: 'profile-id',
    userId: 'user-id',
    fullName: 'Pessoa Teste',
    documentType: 'rg',
    termsAccepted: true,
  })

  assert.equal(payload.terms_accepted, true)
})

test('normaliza nome e usa RG como tipo padrão', () => {
  assert.deepEqual(
    buildVerificationPayload({ profileId: 'profile123', userId: 'user123', fullName: '  Ana Souza  ', documentType: '' }),
    { profile: 'profile123', user: 'user123', status: 'pending', full_name: 'Ana Souza', document_type: 'rg', terms_accepted: false }
  )
})

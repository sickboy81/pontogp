import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVerificationPayload } from './verification-payload.mjs'

test('inclui tipo e nome completo na solicitação de verificação', () => {
  assert.deepEqual(
    buildVerificationPayload({ profileId: 'profile123', userId: 'user123', fullName: 'Ana Souza', documentType: 'cnh' }),
    { profile: 'profile123', user: 'user123', status: 'pending', full_name: 'Ana Souza', document_type: 'cnh' }
  )
})

test('normaliza nome e usa RG como tipo padrão', () => {
  assert.deepEqual(
    buildVerificationPayload({ profileId: 'profile123', userId: 'user123', fullName: '  Ana Souza  ', documentType: '' }),
    { profile: 'profile123', user: 'user123', status: 'pending', full_name: 'Ana Souza', document_type: 'rg' }
  )
})

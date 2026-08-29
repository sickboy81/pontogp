import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminProfileStatus } from './admin-profile-status.mjs'

const naturalBio = Array.from({ length: 400 }, (_, index) => String.fromCharCode(97 + (index % 26))).join('')

test('classifies inactive profiles as drafts and explains missing publication requirements', () => {
  const result = getAdminProfileStatus({ status: 'inactive', photoCount: 1, bio: 'curta', whatsapp: '', telegram: '', phone: '' })
  assert.equal(result.label, 'Rascunho')
  assert.deepEqual(result.reasons, ['Adicione mais 2 fotos.', 'Complete a bio com pelo menos 400 caracteres.', 'Informe um contato público.'])
})

test('offers publication when an inactive profile meets every requirement', () => {
  const result = getAdminProfileStatus({ status: 'inactive', photoCount: 3, bio: naturalBio, whatsapp: '5511999999999', show_whatsapp: true })
  assert.equal(result.label, 'Rascunho')
  assert.deepEqual(result.reasons, ['Pronto para publicar: o anunciante ainda precisa confirmar “Publicar perfil”.'])
})

test('identifies repeated characters as the reason a draft cannot be published', () => {
  const result = getAdminProfileStatus({ status: 'inactive', photoCount: 3, bio: 'a'.repeat(400), whatsapp: '5511999999999', show_whatsapp: true })
  assert.deepEqual(result.reasons, ['Remova sequências repetidas de caracteres da bio.'])
})

test('uses explicit labels for published and moderated states', () => {
  assert.equal(getAdminProfileStatus({ status: 'active' }).label, 'Publicado')
  assert.equal(getAdminProfileStatus({ status: 'suspended' }).label, 'Suspenso')
  assert.equal(getAdminProfileStatus({ status: 'archived' }).label, 'Arquivado')
})

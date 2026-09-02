import test from 'node:test'
import assert from 'node:assert/strict'
import { getProfileOnboardingState } from './profile-onboarding.mjs'

const bio = 'Atendimento discreto e respeitoso, com horários flexíveis e ambiente confortável. Entre em contato para conhecer detalhes, disponibilidade e combinar tudo com tranquilidade.'

test('sends an incomplete description to the description field', () => {
  const state = getProfileOnboardingState({
    name: 'Perfil', city: 'Goiânia', state: 'GO', bio: '',
    whatsapp: '62999999999', photos: ['1', '2', '3'],
  })

  assert.equal(state.firstPending, 'bio')
  assert.equal(state.actionLabel, 'Completar descrição')
  assert.equal(state.href, '/dashboard/perfil?tab=dados#profile-description')
})

test('sends a missing public contact to the contact fields', () => {
  const state = getProfileOnboardingState({
    name: 'Perfil', city: 'Goiânia', state: 'GO', bio, photos: ['1', '2', '3'],
  })

  assert.equal(state.firstPending, 'contact')
  assert.equal(state.actionLabel, 'Adicionar contato')
  assert.equal(state.href, '/dashboard/perfil?tab=dados#profile-contact')
})

test('sends a profile without three photos to media', () => {
  const state = getProfileOnboardingState({
    name: 'Perfil', city: 'Goiânia', state: 'GO', bio,
    whatsapp: '62999999999', photos: ['1'],
  })

  assert.equal(state.firstPending, 'photos')
  assert.equal(state.actionLabel, 'Adicionar fotos')
  assert.equal(state.href, '/dashboard/perfil?tab=midia')
  assert.deepEqual(state.pendingLabels, ['2 fotos'])
})

test('offers review and publication when every requirement is complete', () => {
  const state = getProfileOnboardingState({
    name: 'Perfil', city: 'Goiânia', state: 'GO', bio,
    whatsapp: '62999999999', photos: ['1', '2', '3'],
  })

  assert.equal(state.firstPending, null)
  assert.equal(state.actionLabel, 'Revisar e publicar')
  assert.equal(state.href, '/dashboard/perfil?tab=midia')
  assert.equal(state.completionPercent, 100)
})

test('uses only real publication requirements in the completion percentage', () => {
  const state = getProfileOnboardingState({
    name: 'Perfil', city: 'Goiânia', state: 'GO', bio,
    whatsapp: '62999999999', photos: ['1', '2', '3'], prices: [],
  })

  assert.deepEqual(state.completionItems.map((item) => item.id), ['identity', 'bio', 'contact', 'photos'])
  assert.equal(state.completionPercent, 100)
})

test('explains repeated filler instead of reporting zero missing characters', () => {
  const state = getProfileOnboardingState({
    name: 'Perfil', city: 'Goiânia', state: 'GO', bio: `Atendimento discreto ${'>'.repeat(160)}`,
    whatsapp: '62999999999', photos: ['1', '2', '3'],
  })

  assert.deepEqual(state.pendingLabels, ['remover sequências repetidas da descrição'])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MIN_PROFILE_PHOTOS,
  canPublishProfile,
  canSaveProfileContacts,
  canRemoveProfilePhoto,
  getMissingProfilePhotos,
  hasPublicProfileContact,
  isPublicProfileStatus,
} from './profile-publication.mjs'

test('requires at least three photos to publish a profile', () => {
  assert.equal(MIN_PROFILE_PHOTOS, 3)
  assert.equal(canPublishProfile(0), false)
  assert.equal(canPublishProfile(1), false)
  assert.equal(canPublishProfile(2), false)
  assert.equal(canPublishProfile(3), true)
  assert.equal(canPublishProfile(4), true)
})

test('reports how many photos are missing for publication', () => {
  assert.equal(getMissingProfilePhotos(0), 3)
  assert.equal(getMissingProfilePhotos(2), 1)
  assert.equal(getMissingProfilePhotos(3), 0)
  assert.equal(getMissingProfilePhotos(8), 0)
})

test('allows removing photos freely while profile is inactive', () => {
  assert.equal(canRemoveProfilePhoto('inactive', 1), true)
  assert.equal(canRemoveProfilePhoto('inactive', 3), true)
})

test('blocks removal when an active profile would have fewer than three photos', () => {
  assert.equal(canRemoveProfilePhoto('active', 1), false)
  assert.equal(canRemoveProfilePhoto('active', 2), false)
  assert.equal(canRemoveProfilePhoto('active', 3), false)
})

test('allows removal when an active profile keeps at least three photos', () => {
  assert.equal(canRemoveProfilePhoto('active', 4), true)
  assert.equal(canRemoveProfilePhoto('active', 5), true)
})

test('only exposes active profiles on public routes', () => {
  assert.equal(isPublicProfileStatus('active'), true)
  assert.equal(isPublicProfileStatus('inactive'), false)
  assert.equal(isPublicProfileStatus('suspended'), false)
  assert.equal(isPublicProfileStatus(''), false)
})

test('requires a filled and public contact channel', () => {
  assert.equal(
    hasPublicProfileContact({
      whatsapp: '(21) 99999-9999',
      show_whatsapp: true,
    }),
    true
  )
  assert.equal(
    hasPublicProfileContact({
      whatsapp: '(21) 99999-9999',
      show_whatsapp: false,
    }),
    false
  )
  assert.equal(
    hasPublicProfileContact({
      whatsapp: '   ',
      show_whatsapp: true,
    }),
    false
  )
})

test('accepts any one of whatsapp, telegram or phone as public contact', () => {
  assert.equal(
    hasPublicProfileContact({
      telegram: '@perfil',
      show_telegram: true,
    }),
    true
  )
  assert.equal(
    hasPublicProfileContact({
      phone: '(21) 3333-4444',
      show_phone: true,
    }),
    true
  )
  assert.equal(
    hasPublicProfileContact({
      whatsapp: '(21) 99999-9999',
      telegram: '@perfil',
      phone: '(21) 3333-4444',
      show_whatsapp: false,
      show_telegram: false,
      show_phone: false,
    }),
    false
  )
})

test('blocks an active profile from losing its last public contact', () => {
  assert.equal(
    canSaveProfileContacts('active', {
      whatsapp: '',
      show_whatsapp: true,
      telegram: '@oculto',
      show_telegram: false,
    }),
    false
  )
  assert.equal(canSaveProfileContacts('inactive', {}), true)
})

test('allows an active profile to switch its public contact channel', () => {
  assert.equal(
    canSaveProfileContacts('active', {
      whatsapp: '',
      show_whatsapp: false,
      telegram: '@novo-contato',
      show_telegram: true,
    }),
    true
  )
})

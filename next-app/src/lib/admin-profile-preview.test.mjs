import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminProfilePreviewPath } from './admin-profile-preview.mjs'

test('opens an inactive profile only in the administrative preview route', () => {
  assert.equal(getAdminProfilePreviewPath({ id: 'draft123', status: 'inactive' }), '/admin/perfis/draft123')
  assert.equal(getAdminProfilePreviewPath({ id: 'published123', status: 'active' }), null)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { ADMIN_USER_GROUPS, buildAdminUsersQuery, getAdminUserGroup } from './admin-users-filter.mjs'

test('separates advertisers and administrators from regular users', () => {
  assert.equal(getAdminUserGroup('advertiser'), 'advertisers')
  assert.equal(getAdminUserGroup('admin'), 'admins')
  assert.equal(getAdminUserGroup('user'), 'users')
  assert.deepEqual(ADMIN_USER_GROUPS.admins.roles, ['admin', 'administrator', '1'])
})

test('builds a scoped PocketBase filter with account filters', () => {
  assert.equal(
    buildAdminUsersQuery({ group: 'advertisers', status: 'inactive', verified: 'no', documentVerified: 'yes' }),
    '(role = "advertiser") && status = "inactive" && verified = false && document_verified = true'
  )
})

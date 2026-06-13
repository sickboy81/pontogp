import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { isProfileBumpEligible } from './profile-bump-eligibility.mjs'

const require = createRequire(import.meta.url)
const { isProfileBumpEligible: isCronProfileBumpEligible } = require('../../../auto_bump_eligibility.cjs')

const implementations = [
  ['Next.js', isProfileBumpEligible],
  ['cron', isCronProfileBumpEligible],
]

const now = new Date('2026-06-13T15:00:00.000Z')

for (const [name, eligible] of implementations) {
  test(`${name}: allows active profiles without expiration dates`, () => {
    assert.equal(eligible({ status: 'active' }, now), true)
  })

  test(`${name}: allows active profiles with future expiration dates`, () => {
    assert.equal(
      eligible(
        {
          status: 'active',
          search_expires_at: '2026-06-14T15:00:00.000Z',
          contact_expires_at: '2026-06-14T15:00:00.000Z',
        },
        now
      ),
      true
    )
  })

  test(`${name}: blocks inactive and expired profiles`, () => {
    assert.equal(eligible({ status: 'inactive' }, now), false)
    assert.equal(
      eligible(
        {
          status: 'active',
          search_expires_at: '2026-06-13T14:59:59.000Z',
        },
        now
      ),
      false
    )
    assert.equal(
      eligible(
        {
          status: 'active',
          contact_expires_at: '2026-06-13T15:00:00.000Z',
        },
        now
      ),
      false
    )
  })
}

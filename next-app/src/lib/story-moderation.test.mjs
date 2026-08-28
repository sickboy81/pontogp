import test from 'node:test'
import assert from 'node:assert/strict'
import { blockKey, canBlockCommentAuthor, canModerateStory } from './story-moderation.mjs'

test('only the story owner can moderate its comments', () => {
  assert.equal(canModerateStory({ storyOwnerId: 'owner', viewerId: 'owner' }), true)
  assert.equal(canModerateStory({ storyOwnerId: 'owner', viewerId: 'other' }), false)
  assert.equal(canModerateStory({ storyOwnerId: '', viewerId: 'owner' }), false)
})

test('does not allow blocking the moderator own account', () => {
  assert.equal(canBlockCommentAuthor({ authorId: 'commenter', viewerId: 'owner' }), true)
  assert.equal(canBlockCommentAuthor({ authorId: 'owner', viewerId: 'owner' }), false)
  assert.equal(canBlockCommentAuthor({ authorId: '', viewerId: 'owner' }), false)
})

test('normalizes block pairs', () => {
  assert.deepEqual(blockKey('z-user', 'a-user'), ['a-user', 'z-user'])
})

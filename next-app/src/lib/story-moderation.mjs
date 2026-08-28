/** Ordena IDs para a chave única usada pela coleção message_blocks. */
export function blockKey(a, b) {
  return a <= b ? [a, b] : [b, a]
}

export function canModerateStory({ storyOwnerId, viewerId }) {
  return Boolean(storyOwnerId && viewerId && storyOwnerId === viewerId)
}

export function canBlockCommentAuthor({ authorId, viewerId }) {
  return Boolean(authorId && viewerId && authorId !== viewerId)
}

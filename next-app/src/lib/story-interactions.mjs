const STORY_COMMENT_MAX_LENGTH = 500

/**
 * @param {unknown} raw
 * @returns {{ ok: true, content: string } | { ok: false, error: string }}
 */
export function normalizeStoryComment(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Conteúdo obrigatório' }
  }

  const content = raw.trim()
  if (!content) {
    return { ok: false, error: 'Conteúdo obrigatório' }
  }

  if (content.length > STORY_COMMENT_MAX_LENGTH) {
    return { ok: false, error: 'Máximo 500 caracteres' }
  }

  return { ok: true, content }
}

/**
 * @param {{ active?: unknown, expires_at?: unknown } | null | undefined} story
 * @param {Date} [now]
 */
export function canInteractWithStory(story, now = new Date()) {
  // Older production schemas do not have an `active` field. In that schema,
  // expiration is the source of truth; only an explicit false disables it.
  if (!story || story.active === false) return false
  if (typeof story.expires_at !== 'string' || !story.expires_at.trim()) return false

  const expiresAt = new Date(story.expires_at)
  if (Number.isNaN(expiresAt.getTime())) return false

  return expiresAt > now
}

export { STORY_COMMENT_MAX_LENGTH }

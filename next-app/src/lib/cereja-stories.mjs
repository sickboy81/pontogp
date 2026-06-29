export const CEREJA_STORIES_DURATION_HOURS = 24
export const CEREJA_STORIES_DURATION_MS = CEREJA_STORIES_DURATION_HOURS * 60 * 60 * 1000

export function getCerejaStoryExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CEREJA_STORIES_DURATION_MS)
}

export function getLegacyCerejaStoryCutoff(now = new Date()) {
  return new Date(now.getTime() - CEREJA_STORIES_DURATION_MS)
}

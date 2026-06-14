export const INTERNAL_MESSAGES_SETTINGS_KEY = 'internal_messages'
export const DEFAULT_INTERNAL_MESSAGES_NOTICE = ''

const MAX_INTERNAL_MESSAGES_NOTICE_LENGTH = 500

/**
 * @param {unknown} raw
 * @returns {{ enabled: boolean, notice: string }}
 */
export function parseInternalMessagesSettings(raw) {
  const value = parseInternalMessagesSettingsSource(raw)

  return {
    enabled: value?.enabled === false ? false : true,
    notice: normalizeInternalMessagesNotice(value?.notice),
  }
}

/**
 * @param {unknown} raw
 * @returns {{ enabled?: unknown, notice?: unknown } | null}
 */
function parseInternalMessagesSettingsSource(raw) {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return isRecord(raw) ? raw : null
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeInternalMessagesNotice(value) {
  if (typeof value !== 'string') return DEFAULT_INTERNAL_MESSAGES_NOTICE
  return value.trim().slice(0, MAX_INTERNAL_MESSAGES_NOTICE_LENGTH)
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

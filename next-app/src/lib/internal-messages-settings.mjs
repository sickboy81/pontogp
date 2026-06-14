export const INTERNAL_MESSAGES_SETTINGS_KEY = 'internal_messages'
export const DEFAULT_INTERNAL_MESSAGES_NOTICE =
  'As mensagens internas estão temporariamente indisponíveis.'
export const DEFAULT_PUBLIC_INTERNAL_MESSAGES_SETTINGS = { enabled: true, notice: '' }

const MAX_INTERNAL_MESSAGES_NOTICE_LENGTH = 500

/**
 * @param {unknown} raw
 * @returns {{ enabled: boolean, notice: string }}
 */
export function parseInternalMessagesSettings(raw) {
  const value = parseInternalMessagesSettingsSource(raw)
  const enabled = value?.enabled === false ? false : true
  const notice = normalizeInternalMessagesNotice(value?.notice)

  return {
    enabled,
    notice: !enabled && !notice ? DEFAULT_INTERNAL_MESSAGES_NOTICE : notice,
  }
}

/**
 * @param {unknown} records
 * @returns {{ id?: unknown, created?: unknown, value?: unknown } | null}
 */
export function selectDeterministicSettingsRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null

  return [...records]
    .filter(isRecord)
    .sort(compareSettingsRecords)[0] ?? null
}

/**
 * @param {unknown} records
 * @returns {{ enabled: boolean, notice: string }}
 */
export function getPublicInternalMessagesSettings(records) {
  const record = selectDeterministicSettingsRecord(records)
  return record
    ? parseInternalMessagesSettings(record.value)
    : DEFAULT_PUBLIC_INTERNAL_MESSAGES_SETTINGS
}

/**
 * @param {unknown} raw
 * @returns {{ error: string, code: 'MESSAGES_DISABLED' }}
 */
export function buildInternalMessagesDisabledPayload(raw) {
  const settings = parseInternalMessagesSettings(raw)
  return {
    error: settings.notice || DEFAULT_INTERNAL_MESSAGES_NOTICE,
    code: 'MESSAGES_DISABLED',
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
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, MAX_INTERNAL_MESSAGES_NOTICE_LENGTH)
}

/**
 * @param {{ id?: unknown, created?: unknown }} left
 * @param {{ id?: unknown, created?: unknown }} right
 */
function compareSettingsRecords(left, right) {
  const createdOrder = compareText(left.created, right.created)
  if (createdOrder !== 0) return createdOrder
  return compareText(left.id, right.id)
}

/**
 * @param {unknown} left
 * @param {unknown} right
 */
function compareText(left, right) {
  const leftText = typeof left === 'string' ? left : ''
  const rightText = typeof right === 'string' ? right : ''
  if (leftText < rightText) return -1
  if (leftText > rightText) return 1
  return 0
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

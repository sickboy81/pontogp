const HEADER_TOP_SAFE_ZONE = 24
const HEADER_MIN_SCROLL_DELTA = 10

/**
 * @param {{
 *   previousY: number
 *   currentY: number
 *   locked: boolean
 *   previousVisible?: boolean
 * }} input
 */
export function getHeaderVisibility(input) {
  const previousY = Number.isFinite(input?.previousY) ? input.previousY : 0
  const currentY = Number.isFinite(input?.currentY) ? input.currentY : 0
  const previousVisible = input?.previousVisible !== false

  if (input?.locked) return true
  if (currentY <= HEADER_TOP_SAFE_ZONE) return true

  const delta = currentY - previousY
  if (delta >= HEADER_MIN_SCROLL_DELTA) return false
  if (delta <= -HEADER_MIN_SCROLL_DELTA) return true

  return previousVisible
}

export { HEADER_MIN_SCROLL_DELTA, HEADER_TOP_SAFE_ZONE }

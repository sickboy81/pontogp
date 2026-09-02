const ALLOWED_EVENTS = new Set([
  'step_viewed',
  'draft_saved',
  'photo_uploaded',
  'publish_succeeded',
  'onboarding_error',
])

const ALLOWED_STEPS = new Set(['details', 'photos', 'review'])

export function normalizeProfileOnboardingEvent(input) {
  if (!input || typeof input !== 'object') return null
  const event = typeof input.event === 'string' ? input.event : ''
  const step = typeof input.step === 'string' ? input.step : ''
  if (!ALLOWED_EVENTS.has(event) || !ALLOWED_STEPS.has(step)) return null
  return { event, step }
}

export type ProfileOnboardingEvent = 'step_viewed' | 'draft_saved' | 'photo_uploaded' | 'publish_succeeded' | 'onboarding_error'
export type ProfileOnboardingStep = 'details' | 'photos' | 'review'

export declare function normalizeProfileOnboardingEvent(input: unknown): {
  event: ProfileOnboardingEvent
  step: ProfileOnboardingStep
} | null

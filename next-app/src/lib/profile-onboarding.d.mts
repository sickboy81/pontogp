export interface ProfileOnboardingInput {
  name?: string
  city?: string
  state?: string
  bio?: string
  whatsapp?: string
  telegram?: string
  phone?: string
  show_whatsapp?: boolean
  show_telegram?: boolean
  show_phone?: boolean
  photos?: string[]
}

export interface ProfileOnboardingState {
  completionItems: Array<{ id: 'identity' | 'bio' | 'contact' | 'photos'; label: string; done: boolean }>
  completionPercent: number
  firstPending: 'identity' | 'bio' | 'contact' | 'photos' | null
  actionLabel: string
  href: string
  pendingLabels: string[]
  missingBioCharacters: number
  missingPhotos: number
  canPublish: boolean
}

export declare function getProfileOnboardingState(profile?: ProfileOnboardingInput): ProfileOnboardingState

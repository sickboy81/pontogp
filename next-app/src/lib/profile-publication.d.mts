export declare const MIN_PROFILE_BIO_LENGTH: number
export declare const MIN_PROFILE_PHOTOS: number
export declare function canPublishProfile(photoCount: number): boolean
export declare function hasPublishableProfileBio(bio: unknown): boolean
export declare function getMissingProfileBioCharacters(bio: unknown): number
export declare function getProfileDraftValidationError(profile: {
  name?: unknown
  state?: unknown
  city?: unknown
}): string | null
export declare function getMissingProfilePhotos(photoCount: number): number
export declare function canRemoveProfilePhoto(status: string, currentPhotoCount: number): boolean
export declare function hasPublicProfileContact(profile: {
  whatsapp?: unknown
  telegram?: unknown
  phone?: unknown
  show_whatsapp?: unknown
  show_telegram?: unknown
  show_phone?: unknown
}): boolean
export declare function hasUnsavedProfileContactChanges(
  savedProfile: {
    whatsapp?: unknown
    telegram?: unknown
    phone?: unknown
    show_whatsapp?: unknown
    show_telegram?: unknown
    show_phone?: unknown
  },
  currentProfile: {
    whatsapp?: unknown
    telegram?: unknown
    phone?: unknown
    show_whatsapp?: unknown
    show_telegram?: unknown
    show_phone?: unknown
  }
): boolean
export declare function canSaveProfileContacts(
  status: string,
  profile: {
    whatsapp?: unknown
    telegram?: unknown
    phone?: unknown
    show_whatsapp?: unknown
    show_telegram?: unknown
    show_phone?: unknown
  }
): boolean
export declare function isPublicProfileStatus(status: string): boolean

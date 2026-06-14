export const MIN_PROFILE_BIO_LENGTH: number
export const MIN_PROFILE_PHOTOS: number
export function hasPublishableProfileBio(bio: unknown): boolean
export function getMissingProfileBioCharacters(bio: unknown): number
export function canPublishProfile(photoCount: number): boolean
export function getMissingProfilePhotos(photoCount: number): number
export function canRemoveProfilePhoto(status: string, currentPhotoCount: number): boolean
export function hasPublicProfileContact(profile: {
  whatsapp?: unknown
  telegram?: unknown
  phone?: unknown
  show_whatsapp?: unknown
  show_telegram?: unknown
  show_phone?: unknown
}): boolean
export function canSaveProfileContacts(
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
export function isPublicProfileStatus(status: string): boolean

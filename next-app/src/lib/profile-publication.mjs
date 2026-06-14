export const MIN_PROFILE_BIO_LENGTH = 700
export const MIN_PROFILE_PHOTOS = 3

function normalizeBioLength(bio) {
  return String(bio ?? '').trim().length
}

function normalizePhotoCount(photoCount) {
  const count = Number(photoCount)
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

export function hasPublishableProfileBio(bio) {
  return normalizeBioLength(bio) >= MIN_PROFILE_BIO_LENGTH
}

export function getMissingProfileBioCharacters(bio) {
  return Math.max(0, MIN_PROFILE_BIO_LENGTH - normalizeBioLength(bio))
}

export function canPublishProfile(photoCount) {
  return normalizePhotoCount(photoCount) >= MIN_PROFILE_PHOTOS
}

export function getMissingProfilePhotos(photoCount) {
  return Math.max(0, MIN_PROFILE_PHOTOS - normalizePhotoCount(photoCount))
}

export function canRemoveProfilePhoto(status, currentPhotoCount) {
  if (status !== 'active') return true
  return normalizePhotoCount(currentPhotoCount) - 1 >= MIN_PROFILE_PHOTOS
}

export function hasPublicProfileContact(profile) {
  return [
    [profile?.whatsapp, profile?.show_whatsapp],
    [profile?.telegram, profile?.show_telegram],
    [profile?.phone, profile?.show_phone],
  ].some(([value, visible]) => visible === true && String(value ?? '').trim().length > 0)
}

export function canSaveProfileContacts(status, profile) {
  return status !== 'active' || hasPublicProfileContact(profile)
}

export function isPublicProfileStatus(status) {
  return status === 'active'
}

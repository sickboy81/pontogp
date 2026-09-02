export const MIN_PROFILE_BIO_LENGTH = 150
export const MIN_PROFILE_PHOTOS = 3

function normalizeBioLength(bio) {
  return String(bio ?? '').trim().length
}

function normalizePhotoCount(photoCount) {
  const count = Number(photoCount)
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

export function hasPublishableProfileBio(bio) {
  return normalizeBioLength(bio) >= MIN_PROFILE_BIO_LENGTH && !getProfileBioQualityError(bio)
}

/** Rejects obvious character spam used to inflate the publication minimum. */
export function getProfileBioQualityError(bio) {
  const text = String(bio ?? '').trim()
  if (/([^\p{L}\p{N}\s])\1{5,}/u.test(text) || /([\p{L}\p{N}])\1{11,}/iu.test(text)) {
    return 'Remova sequências repetidas de caracteres da bio.'
  }
  return null
}

export function getMissingProfileBioCharacters(bio) {
  return Math.max(0, MIN_PROFILE_BIO_LENGTH - normalizeBioLength(bio))
}

export function canPublishProfile(photoCount) {
  return normalizePhotoCount(photoCount) >= MIN_PROFILE_PHOTOS
}

export function getProfileDraftValidationError(profile) {
  if (!String(profile?.name ?? '').trim()) return 'Informe o nome público do perfil.'
  if (!String(profile?.state ?? '').trim()) return 'Selecione o estado.'
  if (!String(profile?.city ?? '').trim()) return 'Selecione a cidade.'
  return null
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
  ].some(([value, visible]) => visible !== false && String(value ?? '').trim().length > 0)
}

export function canPublishProfileDraft(photoCount, bio, profile) {
  return canPublishProfile(photoCount) && hasPublishableProfileBio(bio) && hasPublicProfileContact(profile)
}

export function hasUnsavedProfileContactChanges(savedProfile, currentProfile) {
  return ['whatsapp', 'telegram', 'phone'].some((field) =>
    String(savedProfile?.[field] ?? '').trim() !== String(currentProfile?.[field] ?? '').trim()
  ) || ['show_whatsapp', 'show_telegram', 'show_phone'].some((field) =>
    (savedProfile?.[field] !== false) !== (currentProfile?.[field] !== false)
  )
}

export function canSaveProfileContacts(status, profile) {
  return status !== 'active' || hasPublicProfileContact(profile)
}

export function isPublicProfileStatus(status) {
  return status === 'active'
}

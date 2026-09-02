import {
  MIN_PROFILE_BIO_LENGTH,
  MIN_PROFILE_PHOTOS,
  getMissingProfileBioCharacters,
  getMissingProfilePhotos,
  getProfileBioQualityError,
  hasPublicProfileContact,
  hasPublishableProfileBio,
} from './profile-publication.mjs'

export function getProfileOnboardingState(profile = {}) {
  const photoCount = Array.isArray(profile.photos) ? profile.photos.length : 0
  const missingBioCharacters = getMissingProfileBioCharacters(profile.bio)
  const bioQualityError = getProfileBioQualityError(profile.bio)
  const missingPhotos = getMissingProfilePhotos(photoCount)
  const identityComplete = Boolean(
    String(profile.name ?? '').trim() &&
    String(profile.city ?? '').trim() &&
    String(profile.state ?? '').trim()
  )
  const bioComplete = hasPublishableProfileBio(profile.bio)
  const contactComplete = hasPublicProfileContact(profile)
  const photosComplete = missingPhotos === 0
  const completionItems = [
    { id: 'identity', label: 'Nome e localização', done: identityComplete },
    { id: 'bio', label: `Descrição com ${MIN_PROFILE_BIO_LENGTH} caracteres`, done: bioComplete },
    { id: 'contact', label: 'Contato público', done: contactComplete },
    { id: 'photos', label: `Pelo menos ${MIN_PROFILE_PHOTOS} fotos`, done: photosComplete },
  ]
  const completionPercent = Math.round(
    (completionItems.filter((item) => item.done).length / completionItems.length) * 100
  )

  let firstPending = null
  let actionLabel = 'Revisar e publicar'
  let href = '/dashboard/perfil?tab=midia'
  if (!identityComplete) {
    firstPending = 'identity'
    actionLabel = 'Completar dados básicos'
    href = '/dashboard/perfil?tab=dados#profile-identity'
  } else if (!bioComplete) {
    firstPending = 'bio'
    actionLabel = 'Completar descrição'
    href = '/dashboard/perfil?tab=dados#profile-description'
  } else if (!contactComplete) {
    firstPending = 'contact'
    actionLabel = 'Adicionar contato'
    href = '/dashboard/perfil?tab=dados#profile-contact'
  } else if (!photosComplete) {
    firstPending = 'photos'
    actionLabel = 'Adicionar fotos'
  }

  const pendingLabels = [
    !identityComplete ? 'nome e localização' : null,
    !bioComplete
      ? bioQualityError
        ? 'remover sequências repetidas da descrição'
        : `${missingBioCharacters} ${missingBioCharacters === 1 ? 'caractere na descrição' : 'caracteres na descrição'}`
      : null,
    !contactComplete ? 'um contato público' : null,
    !photosComplete ? `${missingPhotos} ${missingPhotos === 1 ? 'foto' : 'fotos'}` : null,
  ].filter(Boolean)

  return {
    completionItems,
    completionPercent,
    firstPending,
    actionLabel,
    href,
    pendingLabels,
    missingBioCharacters,
    missingPhotos,
    canPublish: firstPending === null,
  }
}

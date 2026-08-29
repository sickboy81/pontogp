import { getMissingProfilePhotos, getProfileBioQualityError, hasPublishableProfileBio, hasPublicProfileContact } from './profile-publication.mjs'

export function getAdminProfileStatus(profile = {}) {
  const status = String(profile.status || 'inactive')
  if (status === 'active') return { label: 'Publicado', tone: 'success', reasons: [] }
  if (status === 'suspended') return { label: 'Suspenso', tone: 'danger', reasons: [] }
  if (status === 'archived') return { label: 'Arquivado', tone: 'muted', reasons: [] }
  if (status === 'muted') return { label: 'Silenciado', tone: 'warning', reasons: [] }

  const reasons = []
  const photoCount = Number(profile.photoCount) || 0
  const missingPhotos = getMissingProfilePhotos(photoCount)
  if (missingPhotos > 0) reasons.push(`Adicione mais ${missingPhotos} foto${missingPhotos === 1 ? '' : 's'}.`)
  const bioQualityError = getProfileBioQualityError(profile.bio)
  if (bioQualityError) reasons.push(bioQualityError)
  else if (!hasPublishableProfileBio(profile.bio)) reasons.push('Complete a bio com pelo menos 400 caracteres.')
  if (!hasPublicProfileContact(profile)) reasons.push('Informe um contato público.')
  if (reasons.length === 0) reasons.push('Pronto para publicar: o anunciante ainda precisa confirmar “Publicar perfil”.')
  return { label: 'Rascunho', tone: 'warning', reasons }
}

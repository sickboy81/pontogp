export function getAdminProfilePreviewPath(profile) {
  if (!profile?.id || profile.status === 'active') return null
  return `/admin/perfis/${encodeURIComponent(profile.id)}`
}

export function getAdminProfilePhotoLabel(profileName, index) {
  return `Abrir foto ${index + 1} de ${profileName || 'perfil'}`
}

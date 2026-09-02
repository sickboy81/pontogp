export function getAdminProfilePreviewPath(profile) {
  if (!profile?.id || profile.status === 'active') return null
  return `/admin/perfis/${encodeURIComponent(profile.id)}`
}

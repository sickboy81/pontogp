export function canViewUserProfile(viewer, profileId, viewerId) {
  return viewer?.role === 'advertiser' && Boolean(profileId) && profileId !== viewerId
}

export function toPublicUserProfile(user = {}) {
  return {
    id: String(user.id || ''),
    name: String(user.display_name || user.name || user.first_name || 'Usuário CerejaVIP'),
    ...(user.avatar ? { avatar: String(user.avatar) } : {}),
    created: user.created,
    role: user.role === 'advertiser' ? 'advertiser' : 'user',
  }
}

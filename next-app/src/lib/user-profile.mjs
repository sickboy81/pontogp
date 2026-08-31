export function canViewUserProfile(viewer, target, profileId, viewerId) {
  return viewer?.role === 'advertiser' && target?.role === 'user' && Boolean(profileId) && profileId !== viewerId
}

export function toPublicUserProfile(user = {}) {
  const result = {
    id: String(user.id || ''),
    name: String(user.display_name || user.name || user.first_name || 'Usuário CerejaVIP'),
    ...(user.avatar ? { avatar: String(user.avatar) } : {}),
    created: user.created,
    role: user.role === 'advertiser' ? 'advertiser' : 'user',
  }
  for (const key of ['city', 'state', 'bio']) if (typeof user[key] === 'string' && user[key].trim()) result[key] = user[key].trim()
  if (Number.isFinite(Number(user.age)) && Number(user.age) >= 18 && Number(user.age) <= 100) result.age = Number(user.age)
  return result
}

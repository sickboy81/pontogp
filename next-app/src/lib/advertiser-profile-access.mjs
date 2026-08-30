export const ADVERTISER_PROFILE_OWNER_FILTER = '(user.role = "advertiser" || user.role = "admin")'

export function isAdvertiserRole(role) {
  if (typeof role !== 'string') return false
  const normalized = role.trim().toLowerCase()
  return normalized === 'advertiser' || normalized === 'admin' || normalized === 'administrator' || normalized === '1'
}

export function filterAdvertiserProfiles(items) {
  return items.filter((item) => isAdvertiserRole(item?.expand?.user?.role))
}

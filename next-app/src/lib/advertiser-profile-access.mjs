export function isAdvertiserRole(role) {
  return role === 'advertiser'
}

export function filterAdvertiserProfiles(items) {
  return items.filter((item) => isAdvertiserRole(item?.expand?.user?.role))
}

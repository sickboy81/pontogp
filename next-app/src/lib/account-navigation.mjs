const CLIENT_NAVIGATION = ['/dashboard', '/favoritos', '/mensagens', '/notificacoes', '/conta']
const ADVERTISER_NAVIGATION = ['/dashboard', '/dashboard/perfil', '/mensagens', '/planos', '/notificacoes', '/conta']
const ADVERTISER_ONLY_PREFIXES = ['/dashboard/perfil', '/dashboard/stories', '/pagamentos', '/diretrizes-fotos-videos']

export function canAccessAdvertiserBilling(role) {
  const normalized = String(role || '').trim().toLowerCase()
  return normalized === 'advertiser' || normalized === 'admin' || normalized === 'administrator' || normalized === '1'
}

export function getAccountNavigation(role) {
  return canAccessAdvertiserBilling(role) ? [...ADVERTISER_NAVIGATION] : [...CLIENT_NAVIGATION]
}

export function canAccessAccountPath(role, pathname) {
  const advertiserOnly = ADVERTISER_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return !advertiserOnly || canAccessAdvertiserBilling(role)
}

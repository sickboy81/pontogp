export function getRegistrationNextUrl(role) {
  const destination = role === 'advertiser' ? '/dashboard/perfil' : '/dashboard'
  return `/login?callbackUrl=${encodeURIComponent(destination)}`
}

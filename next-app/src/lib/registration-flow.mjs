export function getRegistrationNextUrl(role, email) {
  const params = new URLSearchParams({ tipo: role })
  if (email) params.set('email', email)
  return `/verificar-email-pendente?${params.toString()}`
}

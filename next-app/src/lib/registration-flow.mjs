export function getRegistrationNextUrl(role, email, verificationSent = true) {
  const params = new URLSearchParams({ tipo: role })
  if (email) params.set('email', email)
  if (!verificationSent) params.set('envio', 'erro')
  return `/verificar-email-pendente?${params.toString()}`
}

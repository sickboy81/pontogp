export const EMAIL_TEMPLATES = Object.freeze([
  {
    id: 'profile-completion',
    label: 'Cadastro de anunciante incompleto',
    description: 'Convida uma anunciante com perfil em rascunho a finalizar o cadastro.',
    audience: 'Anunciantes com perfil em rascunho',
    cooldownDays: 7,
  },
])

export function getEmailTemplate(id) {
  return EMAIL_TEMPLATES.find((template) => template.id === id) || null
}

export function getResendCooldownState(lastSentAt, now = new Date(), cooldownDays = 7) {
  if (!lastSentAt) return { allowed: true, nextAllowedAt: null, remainingHours: 0 }
  const nextAllowedAt = new Date(new Date(lastSentAt).getTime() + cooldownDays * 86400000)
  const remainingHours = Math.max(0, Math.ceil((nextAllowedAt.getTime() - now.getTime()) / 3600000))
  return { allowed: remainingHours === 0, nextAllowedAt, remainingHours }
}

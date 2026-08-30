export const EMAIL_TEMPLATES = Object.freeze([
  { id: 'profile-completion', label: 'Cadastro de anunciante incompleto', description: 'Convida uma anunciante com perfil em rascunho a finalizar o cadastro.', audience: 'Anunciantes com perfil em rascunho', cooldownDays: 7 },
  { id: 'plan-expiring', label: 'Plano próximo do vencimento', description: 'Lembra a anunciante de renovar antes de perder visibilidade.', audience: 'Anunciantes com vencimento nos próximos 7 dias', cooldownDays: 3 },
  { id: 'plan-expired', label: 'Plano vencido', description: 'Convida a anunciante a renovar um plano já vencido.', audience: 'Anunciantes com plano vencido', cooldownDays: 7 },
  { id: 'profile-suspended', label: 'Perfil suspenso', description: 'Informa a anunciante sobre a suspensão do perfil e orienta a revisão.', audience: 'Anunciantes com perfil suspenso', cooldownDays: 7 },
  { id: 'payment-confirmation', label: 'Confirmação de pagamento', description: 'Confirma manualmente o recebimento de um pagamento.', audience: 'Anunciante selecionada pelo administrador', cooldownDays: 0 },
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

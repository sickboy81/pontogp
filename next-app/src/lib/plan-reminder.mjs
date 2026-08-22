function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function getReminderDays(daysUntilExpiry) {
  return daysUntilExpiry === 7 || daysUntilExpiry === 0 ? [daysUntilExpiry] : []
}

function daysUntil(dateValue, now) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  date.setUTCHours(0, 0, 0, 0)
  return Math.round((date.getTime() - start.getTime()) / 86400000)
}

/** Retorna os marcos que devem ser comunicados uma única vez ao anunciante. */
export function getPlanLifecycleEvents(profile, now = new Date()) {
  const events = []
  const searchDays = daysUntil(profile?.search_expires_at, now)
  const contactDays = daysUntil(profile?.contact_expires_at, now)

  if (searchDays === 7) events.push({ type: 'plan_expiring', days: 7, expiresAt: profile.search_expires_at })
  if (searchDays === 0) events.push({ type: 'plan_expired', days: 0, expiresAt: profile.search_expires_at })
  if (contactDays === 7) events.push({ type: 'contact_expiring', days: 7, expiresAt: profile.contact_expires_at })
  if (contactDays === 0) events.push({ type: 'contact_expired', days: 0, expiresAt: profile.contact_expires_at })
  if (searchDays === -30) events.push({ type: 'search_removed', days: -30, expiresAt: profile.search_expires_at })
  if (searchDays === -90) events.push({ type: 'profile_archived', days: -90, expiresAt: profile.search_expires_at })
  return events
}

export function buildPlanExpiryEmail({ name, expiresAt, appUrl = 'https://cerejavip.com', from, to }) {
  const normalizedUrl = String(appUrl).replace(/\/$/, '')
  const safeName = escapeHtml(name || 'anunciante')
  const date = new Date(expiresAt)
  const formattedDate = Number.isNaN(date.getTime()) ? 'em breve' : date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  return {
    from,
    to: [to],
    subject: `Lembrete para renovar seu plano CerejaVIP`,
    html: `<h2>Seu plano CerejaVIP precisa ser renovado</h2><p>Olá, ${safeName}.</p><p>Seu plano vence em <strong>${formattedDate}</strong>. Para continuar aparecendo e recebendo contatos, escolha um novo plano e pague via PIX.</p><p><a href="${normalizedUrl}/planos">Renovar meu plano</a></p><p>Não existe renovação automática: você decide quando renovar.</p>`,
    text: `Olá, ${name || 'anunciante'}!\n\nSeu plano CerejaVIP vence em ${formattedDate}. Para continuar aparecendo e recebendo contatos, acesse ${normalizedUrl}/planos e renove via PIX.\n\nNão existe renovação automática: você decide quando renovar.`,
  }
}

export function buildPlanLifecycleEmail({ name, expiresAt, eventType, appUrl = 'https://cerejavip.com', from, to }) {
  const normalizedUrl = String(appUrl).replace(/\/$/, '')
  const safeName = escapeHtml(name || 'anunciante')
  const date = new Date(expiresAt)
  const formattedDate = Number.isNaN(date.getTime()) ? 'a data informada' : date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const copy = {
    plan_expiring: ['Seu plano está perto de vencer', `Seu plano vence em ${formattedDate}. Renove via PIX para continuar aparecendo e recebendo contatos.`],
    plan_expired: ['Seu plano venceu', 'Seu período terminou. Renove via PIX para reativar a visibilidade e os contatos.'],
    contact_expiring: ['Seus contatos estão perto de expirar', `Os contatos do seu anúncio vencem em ${formattedDate}. Renove para continuar recebendo mensagens e ligações.`],
    contact_expired: ['Seus contatos foram desativados', 'WhatsApp, telefone, redes sociais e mensagens internas foram ocultados porque o período de contatos terminou.'],
    search_removed: ['Seu perfil saiu da busca', 'Seu perfil continua disponível por acesso direto, mas deixou de aparecer nas buscas após 30 dias de expiração. Renove para voltar à busca.'],
    profile_archived: ['Seu perfil foi arquivado', 'Seu perfil foi arquivado após 90 dias sem renovação e não está mais acessível publicamente. Renove para reativá-lo conforme as regras da plataforma.'],
  }[eventType] || ['Atualização do seu anúncio', 'O estado do seu anúncio foi atualizado.']
  return {
    from,
    to: [to],
    subject: `${copy[0]} | CerejaVIP`,
    html: `<h2>${copy[0]}</h2><p>Olá, ${safeName}.</p><p>${copy[1]}</p><p><a href="${normalizedUrl}/planos">Ver planos e renovar</a></p><p>Não existe renovação automática: você decide quando renovar.</p>`,
    text: `Olá, ${name || 'anunciante'}!\n\n${copy[0]}\n\n${copy[1]}\n\nAcesse ${normalizedUrl}/planos para renovar.\n\nNão existe renovação automática: você decide quando renovar.`,
  }
}

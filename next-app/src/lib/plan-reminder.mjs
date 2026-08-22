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

const RESEND_API_URL = 'https://api.resend.com/emails'

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function getResendEmailConfig(env = process.env) {
  const apiKey = String(env.RESEND_API_KEY ?? '').trim()
  const from = String(env.RESEND_FROM_EMAIL ?? '').trim()
  const contactTo = String(env.CONTACT_EMAIL_TO ?? '').trim()
  if (!apiKey || !from || !contactTo) return null
  return { apiKey, from, contactTo }
}

export function buildContactEmail(contact, config) {
  const name = String(contact.name ?? '').trim()
  const email = String(contact.email ?? '').trim()
  const subject = String(contact.subject ?? '').trim()
  const message = String(contact.message ?? '').trim()
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br>')

  return {
    from: config.from,
    to: [config.contactTo],
    reply_to: email,
    subject: `[Contato CerejaVIP] ${subject}`,
    html: `<h2>Novo contato pelo CerejaVIP</h2><p><strong>Nome:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Assunto:</strong> ${escapeHtml(subject)}</p><p><strong>Mensagem:</strong><br>${safeMessage}</p>`,
    text: `Novo contato pelo CerejaVIP\n\nNome: ${name}\nEmail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${message}`,
  }
}

export async function sendResendEmail(payload, apiKey, fetchImpl = fetch) {
  const response = await fetchImpl(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = result?.message || result?.error || 'Falha ao enviar email pela Resend.'
    throw new Error(String(message))
  }
  return result
}

export function buildPocketBaseResendSettings({ apiKey, appUrl }) {
  const normalizedUrl = String(appUrl || 'https://cerejavip.com').replace(/\/$/, '')
  const localName = new URL(normalizedUrl).hostname
  return {
    smtp: {
      enabled: true,
      host: 'smtp.resend.com',
      port: 587,
      username: 'resend',
      password: apiKey,
      tls: false,
      authMethod: 'PLAIN',
      localName,
    },
    meta: {
      appName: 'CerejaVIP',
      appUrl: normalizedUrl,
      senderName: 'CerejaVIP',
      senderAddress: 'no-reply@cerejavip.com',
    },
  }
}

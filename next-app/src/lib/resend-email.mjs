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

function authTemplate(subject, intro, button, actionUrl, warning = '') {
  const securityNote = warning || 'Se voce nao solicitou esta acao, voce pode ignorar este email com seguranca.'
  const template = {
    subject,
    actionUrl,
    body: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background-color:#0b1224;color:#dbe4f3;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1224;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#111b31;border:1px solid #283957;border-radius:20px;overflow:hidden"><tr><td style="background-color:#e31e24;padding:26px 32px"><div style="font-size:24px;font-weight:800;letter-spacing:-.5px;color:#fff">Cereja<span style="color:#ffd3d3">VIP</span></div><div style="margin-top:5px;color:#ffe8e8;font-size:12px;letter-spacing:1.5px;text-transform:uppercase">Conexoes com mais confianca</div></td></tr><tr><td style="padding:36px 32px 30px"><div style="display:inline-block;background-color:#2b203c;color:#f8b4c8;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">CerejaVIP</div><h1 style="margin:20px 0 12px;color:#fff;font-size:28px;line-height:1.2">${subject}</h1><p style="margin:0;color:#b7c4d8;font-size:16px;line-height:1.7">Ola,</p><p style="margin:14px 0 0;color:#dbe4f3;font-size:16px;line-height:1.7">${intro}</p><table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0"><tr><td style="background-color:#e31e24;border-radius:10px"><a href="{{ACTION_URL}}" style="display:inline-block;padding:15px 24px;color:#fff;text-decoration:none;font-size:15px;font-weight:700">${button} &nbsp; &rarr;</a></td></tr></table><div style="border-top:1px solid #283957;padding-top:20px;color:#8fa1bb;font-size:13px;line-height:1.6"><strong style="color:#dbe4f3">Aviso de seguranca</strong><br>${securityNote}</div></td></tr><tr><td style="border-top:1px solid #283957;padding:22px 32px;color:#71839d;font-size:12px;line-height:1.6">Este email foi enviado automaticamente pelo CerejaVIP.<br>Se precisar de ajuda, acesse <a href="{{APP_URL}}" style="color:#f36b70;text-decoration:none">cerejavip.com</a>.</td></tr></table></td></tr></table></body></html>`,
  }
  return {
    ...template,
    body: template.body.replaceAll('{{ACTION_URL}}', actionUrl).replaceAll('{{APP_URL}}', '{APP_URL}'),
  }
}

export function buildPocketBaseEmailTemplates(appUrl = 'https://cerejavip.com') {
  const normalizedUrl = String(appUrl).replace(/\/$/, '')
  const templates = {
    verificationTemplate: authTemplate(
      'Confirme seu email no CerejaVIP',
      'Clique no botao abaixo para confirmar seu email e ativar sua conta.',
      'Confirmar email',
      `${normalizedUrl}/verificar-email?token={TOKEN}`
    ),
    resetPasswordTemplate: authTemplate(
      'Redefina sua senha do CerejaVIP',
      'Clique no botao abaixo para criar uma nova senha.',
      'Redefinir senha',
      `${normalizedUrl}/redefinir-senha?token={TOKEN}`,
      'Se voce nao solicitou isso, ignore este email.'
    ),
    confirmEmailChangeTemplate: authTemplate(
      'Confirme seu novo email no CerejaVIP',
      'Clique no botao abaixo para confirmar a alteracao do seu email.',
      'Confirmar novo email',
      `${normalizedUrl}/verificar-email?token={TOKEN}`,
      'Se voce nao solicitou essa alteracao, ignore este email.'
    ),
    otp: {
      emailTemplate: {
        subject: 'Seu codigo de acesso do CerejaVIP',
        body: `<!doctype html><html lang="pt-BR"><body style="margin:0;background-color:#0b1224;color:#dbe4f3;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1224;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#111b31;border:1px solid #283957;border-radius:20px;overflow:hidden"><tr><td style="background-color:#e31e24;padding:26px 32px;color:#fff;font-size:24px;font-weight:800">Cereja<span style="color:#ffd3d3">VIP</span></td></tr><tr><td style="padding:36px 32px"><h1 style="margin:0 0 14px;color:#fff;font-size:28px">Seu codigo de acesso</h1><p style="color:#b7c4d8;font-size:16px;line-height:1.7">Use o codigo abaixo para continuar com seguranca:</p><div style="margin:28px 0;padding:22px;background-color:#1b2943;border:1px solid #e31e24;border-radius:12px;color:#fff;text-align:center;font-size:32px;font-weight:800;letter-spacing:8px">{{OTP}}</div><p style="color:#8fa1bb;font-size:13px;line-height:1.6">Se voce nao solicitou este codigo, ignore este email.</p></td></tr><tr><td style="border-top:1px solid #283957;padding:22px 32px;color:#71839d;font-size:12px">CerejaVIP - conexoes com mais confianca.</td></tr></table></td></tr></table></body></html>`,
      },
    },
    authAlert: {
      emailTemplate: {
        subject: 'Novo acesso detectado na sua conta CerejaVIP',
        body: `<!doctype html><html lang="pt-BR"><body style="margin:0;background-color:#0b1224;color:#dbe4f3;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1224;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#111b31;border:1px solid #283957;border-radius:20px;overflow:hidden"><tr><td style="background-color:#e31e24;padding:26px 32px;color:#fff;font-size:24px;font-weight:800">Cereja<span style="color:#ffd3d3">VIP</span></td></tr><tr><td style="padding:36px 32px"><div style="display:inline-block;background-color:#3a2e1d;color:#ffd38a;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Alerta de seguranca</div><h1 style="margin:20px 0 14px;color:#fff;font-size:28px">Novo login detectado</h1><p style="color:#dbe4f3;font-size:16px;line-height:1.7">Identificamos um novo acesso na sua conta CerejaVIP.</p><div style="margin:24px 0;padding:18px;background-color:#1b2943;border-radius:12px;color:#b7c4d8;font-size:14px;line-height:1.8"><strong style="color:#fff">Data e hora:</strong> {{ACTION_TIME}}<br><strong style="color:#fff">Endereco IP:</strong> {{ACTION_IP}}</div><p style="color:#8fa1bb;font-size:13px;line-height:1.6">Se esse acesso nao foi seu, altere sua senha imediatamente e entre em contato conosco.</p></td></tr><tr><td style="border-top:1px solid #283957;padding:22px 32px;color:#71839d;font-size:12px">CerejaVIP - conexoes com mais confianca.</td></tr></table></td></tr></table></body></html>`,
      },
    },
  }
  return {
    ...templates,
    otp: {
      ...templates.otp,
      emailTemplate: {
        ...templates.otp.emailTemplate,
        body: templates.otp.emailTemplate.body.replaceAll('{{OTP}}', '{OTP}'),
      },
    },
    authAlert: {
      ...templates.authAlert,
      emailTemplate: {
        ...templates.authAlert.emailTemplate,
        body: templates.authAlert.emailTemplate.body
          .replaceAll('{{ACTION_TIME}}', '{ACTION_TIME}')
          .replaceAll('{{ACTION_IP}}', '{ACTION_IP}'),
      },
    },
  }
}

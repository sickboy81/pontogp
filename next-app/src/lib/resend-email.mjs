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

export function getResendTransactionalConfig(env = process.env) {
  const apiKey = String(env.RESEND_API_KEY ?? '').trim()
  const from = String(env.RESEND_FROM_EMAIL ?? '').trim()
  if (!apiKey || !from) return null
  return { apiKey, from }
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

export function buildLoginAlertEmail(user, ip, occurredAt = new Date(), config) {
  const email = String(user?.email ?? '').trim()
  const safeIp = escapeHtml(ip || 'Não identificado')
  const occurred = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(occurredAt)
  const safeOccurred = escapeHtml(occurred)
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0b1224;color:#dbe4f3;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1224;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#111b31;border:1px solid #283957;border-radius:20px;overflow:hidden"><tr><td style="background:#e31e24;padding:26px 32px;color:#fff;font-size:24px;font-weight:800">Cereja<span style="color:#ffd3d3">VIP</span></td></tr><tr><td style="padding:36px 32px"><div style="display:inline-block;background:#3a2e1d;color:#ffd38a;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Alerta de segurança</div><h1 style="margin:20px 0 14px;color:#fff;font-size:28px">Novo login detectado</h1><p style="color:#dbe4f3;font-size:16px;line-height:1.7">Identificamos um novo acesso na sua conta CerejaVIP.</p><div style="margin:24px 0;padding:18px;background:#1b2943;border-radius:12px;color:#b7c4d8;font-size:14px;line-height:1.8"><strong style="color:#fff">Data e hora:</strong> ${safeOccurred}<br><strong style="color:#fff">Endereço IP:</strong> ${safeIp}</div><p style="color:#8fa1bb;font-size:13px;line-height:1.6">Se esse acesso não foi seu, altere sua senha imediatamente e entre em contato conosco.</p></td></tr><tr><td style="border-top:1px solid #283957;padding:22px 32px;color:#71839d;font-size:12px">CerejaVIP - conexões com mais confiança.</td></tr></table></td></tr></table></body></html>`
  return {
    from: config.from,
    to: [email],
    subject: 'Novo acesso detectado na sua conta CerejaVIP',
    html,
    text: `Novo login detectado na sua conta CerejaVIP.\n\nData e hora: ${occurred}\nEndereço IP: ${ip || 'Não identificado'}\n\nSe esse acesso não foi seu, altere sua senha imediatamente e entre em contato conosco.`,
  }
}

export function buildProfileCompletionReminderEmail({ email, name, appUrl = 'https://cerejavip.com', from }) {
  const recipient = String(email ?? '').trim()
  const safeName = escapeHtml(String(name ?? '').trim() || 'anunciante')
  const url = `${String(appUrl).replace(/\/$/, '')}/dashboard/perfil`
  return {
    from,
    to: [recipient],
    subject: 'Finalize seu anúncio no CerejaVIP',
    html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f6fb;color:#1e293b;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.08)"><tr><td style="background:#172033;padding:24px 28px"><div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:-.5px">Cereja<span style="color:#f04b5a">VIP</span></div><div style="margin-top:6px;color:#cbd5e1;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase">Seu anúncio merece ser visto</div></td></tr><tr><td style="padding:34px 28px 30px"><div style="display:inline-block;background:#fff1f2;color:#c81e35;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Cadastro pendente</div><h1 style="margin:20px 0 12px;color:#172033;font-size:27px;line-height:1.2">Finalize seu anúncio</h1><p style="margin:0;color:#334155;font-size:16px;line-height:1.7">Olá, ${safeName}.</p><p style="margin:14px 0 0;color:#475569;font-size:16px;line-height:1.7">Você começou a criar seu anúncio no CerejaVIP, mas ele ainda está em rascunho e não aparece para os clientes.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px"><tr><td style="padding:16px 18px;color:#9a3412;font-size:14px;line-height:1.6"><strong>Para publicar:</strong><br>complete as informações, adicione as fotos necessárias e confirme a publicação do perfil.</td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 10px"><tr><td style="background:#df2635;border-radius:10px"><a href="${url}" style="display:inline-block;padding:15px 24px;color:#fff;text-decoration:none;font-size:15px;font-weight:700">Continuar meu cadastro &nbsp;→</a></td></tr></table><p style="margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.6">Se você já concluiu essa etapa, pode ignorar este email.</p></td></tr><tr><td style="border-top:1px solid #e2e8f0;padding:20px 28px;color:#94a3b8;font-size:12px;line-height:1.6">Este email foi enviado automaticamente pelo CerejaVIP.<br>Conexões com mais confiança.</td></tr></table></td></tr></table></body></html>`,
    text: `Olá, ${name || 'anunciante'}!\n\nVocê começou a criar seu anúncio no CerejaVIP, mas ele ainda está em rascunho e não aparece para os clientes.\n\nContinue seu cadastro: ${url}\n\nSe você já concluiu essa etapa, pode ignorar este email.`,
  }
}

export function buildAdminProfileEmail({ email, name, appUrl = 'https://cerejavip.com', from, template, expiresAt }) {
  const safeName = escapeHtml(String(name ?? '').trim() || 'anunciante')
  const normalizedUrl = String(appUrl).replace(/\/$/, '')
  const date = new Date(expiresAt)
  const formattedDate = Number.isNaN(date.getTime()) ? 'em breve' : date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const content = {
    'plan-expiring': ['Seu plano está perto de vencer', `Seu plano vence em ${formattedDate}. Renove via PIX para continuar aparecendo e recebendo contatos.`, 'Renovar meu plano', `${normalizedUrl}/planos`],
    'plan-expired': ['Seu plano venceu', 'Seu período terminou. Renove via PIX para reativar a visibilidade e os contatos.', 'Renovar meu plano', `${normalizedUrl}/planos`],
    'profile-suspended': ['Seu perfil foi suspenso', 'Seu perfil está temporariamente suspenso e não aparece publicamente. Revise as informações do anúncio ou entre em contato com o suporte.', 'Revisar meu perfil', `${normalizedUrl}/dashboard/perfil`],
    'payment-confirmation': ['Pagamento recebido', 'Identificamos o recebimento do seu pagamento. O processamento e a ativação do anúncio podem levar alguns instantes.', 'Acessar meu painel', `${normalizedUrl}/dashboard`],
  }[template] || ['Atualização do seu anúncio', 'Há uma atualização importante sobre o seu anúncio.', 'Acessar meu painel', `${normalizedUrl}/dashboard`]
  return {
    from, to: [email], subject: `${content[0]} | CerejaVIP`,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6fb;color:#1e293b;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden"><tr><td style="background:#172033;padding:24px 28px;color:#fff;font-size:24px;font-weight:800">Cereja<span style="color:#f04b5a">VIP</span></td></tr><tr><td style="padding:34px 28px"><div style="display:inline-block;background:#fff1f2;color:#c81e35;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">CerejaVIP</div><h1 style="color:#172033;font-size:27px">${content[0]}</h1><p style="color:#334155;font-size:16px;line-height:1.7">Olá, ${safeName}.</p><p style="color:#475569;font-size:16px;line-height:1.7">${content[1]}</p><p><a href="${content[3]}" style="display:inline-block;background:#df2635;border-radius:10px;padding:15px 24px;color:#fff;text-decoration:none;font-weight:700">${content[2]} →</a></p></td></tr><tr><td style="border-top:1px solid #e2e8f0;padding:20px 28px;color:#94a3b8;font-size:12px">Este email foi enviado pelo CerejaVIP.</td></tr></table></td></tr></table></body></html>`,
    text: `Olá, ${name || 'anunciante'}!\n\n${content[0]}\n\n${content[1]}\n\nAcesse: ${content[3]}`,
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
      `${normalizedUrl}/confirmar-email?token={TOKEN}`,
      'Se voce nao solicitou essa alteracao, ignore este email.'
    ),
    otp: {
      emailTemplate: {
        subject: 'Seu codigo de acesso do CerejaVIP',
        body: `<!doctype html><html lang="pt-BR"><body style="margin:0;background-color:#0b1224;color:#dbe4f3;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b1224;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#111b31;border:1px solid #283957;border-radius:20px;overflow:hidden"><tr><td style="background-color:#e31e24;padding:26px 32px;color:#fff;font-size:24px;font-weight:800">Cereja<span style="color:#ffd3d3">VIP</span></td></tr><tr><td style="padding:36px 32px"><h1 style="margin:0 0 14px;color:#fff;font-size:28px">Seu codigo de acesso</h1><p style="color:#b7c4d8;font-size:16px;line-height:1.7">Use o codigo abaixo para continuar com seguranca:</p><div style="margin:28px 0;padding:22px;background-color:#1b2943;border:1px solid #e31e24;border-radius:12px;color:#fff;text-align:center;font-size:32px;font-weight:800;letter-spacing:8px">{{OTP}}</div><p style="color:#8fa1bb;font-size:13px;line-height:1.6">Se voce nao solicitou este codigo, ignore este email.</p></td></tr><tr><td style="border-top:1px solid #283957;padding:22px 32px;color:#71839d;font-size:12px">CerejaVIP - conexoes com mais confianca.</td></tr></table></td></tr></table></body></html>`,
      },
    },
    authAlert: {
      enabled: false,
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

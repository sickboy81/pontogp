import { EMAIL_TEMPLATES } from './email-center.mjs'

export const EMAIL_TEMPLATES_SETTINGS_KEY = 'email_templates'

const MAX_SUBJECT = 180
const MAX_BODY = 5000
const VARIABLE_PATTERN = /\{\{(nome|link|data_vencimento)\}\}/g

export function normalizeEmailTemplateOverrides(value) {
  const input = value && typeof value === 'object' ? value : {}
  return Object.fromEntries(EMAIL_TEMPLATES.map((template) => {
    const item = input[template.id] && typeof input[template.id] === 'object' ? input[template.id] : {}
    return [template.id, {
      subject: String(item.subject || '').trim().slice(0, MAX_SUBJECT),
      body: String(item.body || '').trim().slice(0, MAX_BODY),
    }]
  }))
}

export function applyEmailTemplateOverride(email, override, variables) {
  const subject = String(override?.subject || '').trim()
  const body = String(override?.body || '').trim()
  if (!subject && !body) return email
  const replace = (value) => value.replace(VARIABLE_PATTERN, (_, key) => String(variables[key] || ''))
  const renderedSubject = replace(subject || email.subject)
  const renderedBody = replace(body || email.text)
  const htmlBody = renderedBody.split(/\r?\n/).filter(Boolean).map((line) => `<p style="color:#475569;font-size:16px;line-height:1.7">${escapeHtml(line)}</p>`).join('')
  return { ...email, subject: renderedSubject, text: renderedBody, html: email.html.replace(/<h1[\s\S]*?<\/h1>[\s\S]*?<p><a[\s\S]*?<\/a><\/p>/, `<h1 style="color:#172033;font-size:27px">${escapeHtml(renderedSubject)}</h1>${htmlBody}`) }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

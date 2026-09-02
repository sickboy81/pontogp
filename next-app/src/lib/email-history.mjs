export function buildEmailHistoryQuery({ page = 1, perPage = 20, template = '', status = '' } = {}) {
  const params = new URLSearchParams({
    page: String(Math.max(1, Number(page) || 1)),
    perPage: String(Math.min(50, Math.max(1, Number(perPage) || 20))),
    sort: '-created',
    expand: 'profile,sender_admin',
    fields: 'id,template,recipient_email,subject,status,provider_id,error,created,expand.profile.name,expand.sender_admin.email',
  })
  const filters = [
    template ? `template = "${String(template).replaceAll('"', '\\"')}"` : '',
    status ? `status = "${String(status).replaceAll('"', '\\"')}"` : '',
  ].filter(Boolean)
  if (filters.length) params.set('filter', filters.join(' && '))
  return params.toString()
}

export function getEmailHistoryFailure(status) {
  return {
    configured: false,
    error: status === 404
      ? 'Histórico de emails ainda não configurado.'
      : 'Não foi possível consultar o histórico de emails.',
  }
}

export const ADMIN_USER_GROUPS = {
  users: { label: 'Utilizadores', roles: ['user'] },
  advertisers: { label: 'Anunciantes', roles: ['advertiser'] },
  admins: { label: 'Administradores', roles: ['admin', 'administrator', '1'] },
}

export function getAdminUserGroup(role) {
  const entry = Object.entries(ADMIN_USER_GROUPS).find(([, group]) => group.roles.includes(role))
  return entry ? entry[0] : 'users'
}

export function buildAdminUsersQuery({ group = 'users', status = '', verified = '', documentVerified = '' } = {}) {
  const selected = ADMIN_USER_GROUPS[group] || ADMIN_USER_GROUPS.users
  const filters = [`(${selected.roles.map((role) => `role = "${role}"`).join(' || ')})`]
  if (status) filters.push(`status = "${status}"`)
  if (verified === 'yes') filters.push('verified = true')
  if (verified === 'no') filters.push('verified = false')
  if (documentVerified === 'yes') filters.push('document_verified = true')
  if (documentVerified === 'no') filters.push('document_verified = false')
  return filters.join(' && ')
}

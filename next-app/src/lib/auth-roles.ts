const ADMIN_ROLE_SPECIAL_ID = '6b06e338-311c-4a88-b1c9-381d98f0ad71'

export function isAdminRole(role: string | undefined): boolean {
  if (!role) return false
  const r = role.toLowerCase()
  return (
    r === 'admin' ||
    r === 'administrator' ||
    r === '1' ||
    role === ADMIN_ROLE_SPECIAL_ID
  )
}


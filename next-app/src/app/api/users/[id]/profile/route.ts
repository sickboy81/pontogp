import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { isAdminRole } from '@/lib/auth-roles'
import { canViewUserProfile, toPublicUserProfile } from '@/lib/user-profile.mjs'
import { authorizeSession } from '@/lib/authenticated-session.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie')); const { id } = await params
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { user: viewer, userId: viewerId, adminToken } = auth
  const targetRes = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(id)}?fields=id,name,display_name,first_name,avatar,created,role,city,state,age,bio`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  if (targetRes.status === 404) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  if (!targetRes.ok) return Response.json({ error: 'Não foi possível carregar o perfil.' }, { status: 502 })
  const target = await targetRes.json()
  const canView = isAdminRole(viewer.role as string | undefined)
    ? target?.role === 'user'
    : canViewUserProfile(viewer, target, id, viewerId)
  if (!canView) return Response.json({ error: 'Este perfil está disponível apenas para anunciantes e deve pertencer a um usuário.' }, { status: 403 })
  return Response.json({ profile: { ...toPublicUserProfile(target), avatar: target.avatar ? `${PB_URL}/api/files/users/${target.id}/${encodeURIComponent(target.avatar)}` : undefined } })
}

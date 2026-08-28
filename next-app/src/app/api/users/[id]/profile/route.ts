import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { isAdminRole } from '@/lib/auth-roles'
import { canViewUserProfile, toPublicUserProfile } from '@/lib/user-profile.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie')); const viewerId = token ? getUserIdFromToken(token) : null; const { id } = await params
  if (!token || !viewerId) return Response.json({ error: 'Faça login para ver perfis de usuários.' }, { status: 401 })
  const adminToken = await getAdminToken(); if (!adminToken) return Response.json({ error: 'Serviço indisponível.' }, { status: 503 })
  const authRes = await fetch(`${PB_URL}/api/collections/users/records/${viewerId}?fields=id,role`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  const viewer = authRes.ok ? await authRes.json() : null
  if (!viewer || !canViewUserProfile(viewer, id, viewerId) && !isAdminRole(viewer.role)) return Response.json({ error: 'Este perfil está disponível apenas para anunciantes.' }, { status: 403 })
  const targetRes = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(id)}?fields=id,name,display_name,first_name,avatar,created,role`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  if (targetRes.status === 404) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  if (!targetRes.ok) return Response.json({ error: 'Não foi possível carregar o perfil.' }, { status: 502 })
  const target = await targetRes.json()
  return Response.json({ profile: { ...toPublicUserProfile(target), avatar: target.avatar ? `${PB_URL}/api/files/users/${target.id}/${encodeURIComponent(target.avatar)}` : undefined } })
}

import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import {
  canPublishProfile,
  hasPublicProfileContact,
  MIN_PROFILE_PHOTOS,
} from '@/lib/profile-publication.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id: profileId } = await params
  if (!profileId) return Response.json({ error: 'ID do perfil obrigatório' }, { status: 400 })

  try {
    const profileRes = await fetch(
      `${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,user,status,photos,whatsapp,telegram,phone,show_whatsapp,show_telegram,show_phone`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })
      }
      return Response.json({ error: 'Erro ao carregar perfil' }, { status: profileRes.status })
    }

    const profile = (await profileRes.json()) as {
      user?: string
      status?: string
      photos?: string[]
      whatsapp?: string
      telegram?: string
      phone?: string
      show_whatsapp?: boolean
      show_telegram?: boolean
      show_phone?: boolean
    }

    if (profile.user !== userId) {
      return Response.json({ error: 'Sem permissão para publicar este perfil' }, { status: 403 })
    }

    const photoCount = Array.isArray(profile.photos) ? profile.photos.length : 0
    if (!canPublishProfile(photoCount)) {
      return Response.json(
        {
          error: `Adicione pelo menos ${MIN_PROFILE_PHOTOS} fotos antes de publicar o perfil.`,
          photoCount,
          minimumPhotos: MIN_PROFILE_PHOTOS,
        },
        { status: 400 }
      )
    }

    if (!hasPublicProfileContact(profile)) {
      return Response.json(
        { error: 'Preencha e torne público pelo menos um contato.' },
        { status: 400 }
      )
    }

    if (profile.status === 'active') {
      return Response.json({ status: 'active' })
    }

    const adminToken = await getAdminToken()
    if (!adminToken) {
      return Response.json(
        { error: 'Serviço de publicação indisponível. Tente novamente em instantes.' },
        { status: 503 }
      )
    }

    const patchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    })

    if (!patchRes.ok) {
      const error = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (error as { message?: string }).message || 'Erro ao publicar perfil' },
        { status: patchRes.status }
      )
    }

    return Response.json({ status: 'active' })
  } catch {
    return Response.json({ error: 'Erro ao publicar perfil' }, { status: 500 })
  }
}

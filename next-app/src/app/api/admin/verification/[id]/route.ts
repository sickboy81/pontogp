import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getVerificationReviewSubjectUpdates } from '@/lib/verification-review-sync.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** PATCH: atualiza status da verificação. Body: { status: "approved"|"rejected", rejection_reason? } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const body = (await request.json()) as { status?: string; rejection_reason?: string }
    const status = body?.status?.toLowerCase()
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return Response.json({ error: 'status inválido' }, { status: 400 })
    }

    const updateBody: Record<string, unknown> = {
      status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    }
    if (status === 'rejected' && body.rejection_reason) {
      updateBody.rejection_reason = body.rejection_reason
    }

    const res = await fetch(`${PB_URL}/api/collections/verification_requests/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(updateBody),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar' },
        { status: res.status }
      )
    }

    const record = (await res.json()) as { profile?: string; user?: string; id?: string }
    const subjectUpdates = getVerificationReviewSubjectUpdates(status)
    if (subjectUpdates) {
      const updates = [
        record.profile
          ? fetch(`${PB_URL}/api/collections/profiles/records/${record.profile}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
              body: JSON.stringify(subjectUpdates.profile),
            })
          : null,
        record.user
          ? fetch(`${PB_URL}/api/collections/users/records/${record.user}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
              body: JSON.stringify(subjectUpdates.user),
            })
          : null,
      ].filter((update): update is Promise<Response> => update !== null)

      const results = await Promise.all(updates)
      if (results.some((result) => !result.ok)) {
        return Response.json({ error: 'A decisão foi registrada, mas não foi possível sincronizar o selo de documento da conta.' }, { status: 502 })
      }
    }

    return Response.json(record)
  } catch (e) {
    return Response.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

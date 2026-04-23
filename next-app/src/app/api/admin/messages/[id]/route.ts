import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

export const dynamic = 'force-dynamic'

const FORBIDDEN_READ_MSG =
  'A moderação não pode alterar o estado "lida" visto pelos utilizadores. ' +
  'A leitura de chats no admin é invisível para os interlocutores: o campo `read` só muda quando o destinatário abre a conversa no site.'

/**
 * A visualização de mensagens pelo admin não grava `read` no PocketBase
 * (senão o destinatário veria a mensagem como lida sem ter aberto o chat).
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  return Response.json({ error: FORBIDDEN_READ_MSG }, { status: 403 })
}

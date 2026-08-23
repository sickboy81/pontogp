import type { Message } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

function avatarUrl(userId: string, filename: string | undefined): string | undefined {
  if (!filename) return undefined
  return `${PB_URL}/api/files/users/${userId}/${filename}`
}

function mapUserExpand(record: Record<string, unknown> | undefined): { id: string; name?: string; email?: string; avatar?: string; role?: string } | undefined {
  if (!record || typeof record !== 'object') return undefined
  const id = record.id as string
  const name = (record.name as string) || (record.first_name as string) || (record.email as string) || ''
  const avatar = record.avatar ? avatarUrl(id, record.avatar as string) : undefined
  return { id, name, email: record.email as string | undefined, avatar, role: record.role as string | undefined }
}

export function mapMessage(record: Record<string, unknown> & { expand?: Record<string, unknown> }): Message {
  const expand = record.expand || {}
  const sender = expand.sender as Record<string, unknown> | undefined
  const recipient = expand.recipient as Record<string, unknown> | undefined
  return {
    id: record.id as string,
    sender: record.sender as string,
    recipient: record.recipient as string,
    sender_id: record.sender as string,
    recipient_id: record.recipient as string,
    content: (record.content as string) || '',
    read: !!(record.read as boolean),
    created_at: (record.created_at as string) || (record.created as string) || new Date().toISOString(),
    expand: {
      sender: mapUserExpand(sender),
      recipient: mapUserExpand(recipient),
    },
  }
}

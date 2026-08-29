#!/usr/bin/env node

import PocketBase from 'pocketbase'
import { buildPlanLifecycleEmail, getPlanLifecycleEvents } from '../src/lib/plan-reminder.mjs'

const PB_URL = String(process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
const EMAIL_API_KEY = String(process.env.RESEND_API_KEY || '').trim()
const EMAIL_FROM = String(process.env.RESEND_FROM_EMAIL || '').trim()
const APP_URL = String(process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com').replace(/\/$/, '')
const ADMIN_EMAIL = String(process.env.POCKETBASE_ADMIN_EMAIL || '').trim()
const ADMIN_PASSWORD = String(process.env.POCKETBASE_ADMIN_PASSWORD || '')

if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Defina NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD.')
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

async function sendEmail(payload) {
  if (!EMAIL_API_KEY || !EMAIL_FROM || !payload.to?.length) return false
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, from: EMAIL_FROM }),
  })
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`)
  return true
}

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  const profiles = await pb.collection('profiles').getFullList({
    filter: '(search_expires_at != "" || contact_expires_at != "")',
    fields: 'id,name,user,search_expires_at,contact_expires_at',
    expand: 'user',
  })
  let notified = 0
  let emailed = 0
  for (const profile of profiles) {
    const user = profile.expand?.user
    const events = getPlanLifecycleEvents(profile, new Date())
    for (const event of events) {
      const link = `/planos?renew=1&profile=${profile.id}&event=${event.type}`
      const filter = `recipient = "${profile.user}" && type = "${event.type}" && link = "${link.replace(/"/g, '\\"')}"`
      const existing = await pb.collection('notifications').getList(1, 1, { filter, fields: 'id' })
      if (existing.totalItems > 0) continue
      const titleByType = {
        plan_expiring: 'Seu plano está perto de vencer',
        plan_expired: 'Seu plano venceu',
        contact_expiring: 'Seus contatos estão perto de expirar',
        contact_expired: 'Seus contatos foram desativados',
        search_removed: 'Seu perfil saiu da busca',
        profile_archived: 'Seu perfil foi arquivado',
      }
      await pb.collection('notifications').create({
        recipient: profile.user,
        title: titleByType[event.type] || 'Atualização do seu anúncio',
        message: `Atualização do anúncio: ${titleByType[event.type] || 'verifique seu plano'}.`,
        type: event.type,
        read: false,
        link,
        created_at: new Date().toISOString(),
      })
      notified++
      if (user?.email && EMAIL_API_KEY && EMAIL_FROM) {
        try {
          await sendEmail(buildPlanLifecycleEmail({
            name: profile.name,
            expiresAt: event.expiresAt,
            eventType: event.type,
            appUrl: APP_URL,
            from: EMAIL_FROM,
            to: user.email,
          }))
          emailed++
        } catch (error) {
          console.error(`Falha ao enviar atualização para ${user.email}:`, error.message)
        }
      }
    }
  }
  console.log(`Lembretes: notificações=${notified}, emails=${emailed}`)
}

main().catch((error) => {
  console.error('Falha no lembrete de planos:', error.message || error)
  process.exit(1)
})

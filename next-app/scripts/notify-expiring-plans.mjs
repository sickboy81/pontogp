#!/usr/bin/env node

import PocketBase from 'pocketbase'
import { buildPlanExpiryEmail, getReminderDays } from '../src/lib/plan-reminder.mjs'

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

function daysUntil(value) {
  const expiration = new Date(value)
  if (Number.isNaN(expiration.getTime())) return null
  const today = new Date()
  const todayDate = new Date(today.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }))
  const expiryDate = new Date(expiration.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }))
  return Math.round((expiryDate.getTime() - todayDate.getTime()) / 86400000)
}

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
    filter: 'status = "active" && (search_expires_at != "" || contact_expires_at != "")',
    fields: 'id,name,user,search_expires_at,contact_expires_at',
    expand: 'user',
  })
  let notified = 0
  let emailed = 0
  for (const profile of profiles) {
    const dates = [profile.search_expires_at, profile.contact_expires_at].filter(Boolean)
    const expiresAt = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
    const days = daysUntil(expiresAt)
    if (!getReminderDays(days).length) continue
    const user = profile.expand?.user
    const link = `/planos?renew=1&profile=${profile.id}&reminder=${days}`
    const filter = `recipient = "${profile.user}" && type = "plan_expiry" && link = "${link.replace(/"/g, '\\"')}"`
    const existing = await pb.collection('notifications').getList(1, 1, { filter, fields: 'id' })
    if (existing.totalItems > 0) continue
    await pb.collection('notifications').create({
      recipient: profile.user,
      title: days === 0 ? 'Seu plano venceu' : 'Seu plano está perto de vencer',
      message: days === 0 ? 'Renove seu plano via PIX para continuar ativo.' : `Seu plano vence em ${days} dias. Renove via PIX para não perder visibilidade.`,
      type: 'plan_expiry',
      read: false,
      link,
      created_at: new Date().toISOString(),
    })
    notified++
    if (user?.email && EMAIL_API_KEY && EMAIL_FROM) {
      try {
        await sendEmail(buildPlanExpiryEmail({ name: profile.name, expiresAt, appUrl: APP_URL, from: EMAIL_FROM, to: user.email }))
        emailed++
      } catch (error) {
        console.error(`Falha ao enviar lembrete para ${user.email}:`, error.message)
      }
    }
  }
  console.log(`Lembretes: notificações=${notified}, emails=${emailed}`)
}

main().catch((error) => {
  console.error('Falha no lembrete de planos:', error.message || error)
  process.exit(1)
})

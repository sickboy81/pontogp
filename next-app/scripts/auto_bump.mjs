#!/usr/bin/env node
/**
 * Aplica bump automático em perfis com auto_bump = true que ainda têm cota.
 * Uso: node scripts/auto_bump.mjs
 * Agende com cron (ex.: a cada 15 min).
 *
 * Variáveis: NEXT_PUBLIC_POCKETBASE_URL (ou VITE_POCKETBASE_URL),
 * POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD.
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import PocketBase from 'pocketbase'

const __dirname = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(__dirname, '..')
const repoRoot = join(nextAppRoot, '..')

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim()
      process.env[m[1]] = val
    }
  }
}

loadEnv(nextAppRoot)
loadEnv(repoRoot)

const PB_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || '').replace(/\/$/, '')
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || ''
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || ''

if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error('Defina URL e credenciais admin do PocketBase (ou .env)')
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

function todayBR() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

async function main() {
  try {
    await pb.admins.authWithPassword(EMAIL, PASSWORD)
  } catch (err) {
    console.error('Erro ao autenticar:', err.message)
    process.exit(1)
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const today = todayBR()

  let list
  try {
    list = await pb.collection('profiles').getList(1, 200, {
      filter: 'auto_bump = true && status = "active"',
      fields: 'id,plan,last_bump_at,bumps_used_date,bumps_used_today',
    })
  } catch (err) {
    console.error('Erro ao listar perfis:', err.message)
    process.exit(1)
  }

  const plansCache = {}
  async function getDailyBumps(planRef) {
    if (!planRef) return 0
    if (plansCache[planRef] !== undefined) return plansCache[planRef]
    try {
      const isId = String(planRef).length >= 15 && !['gratis', 'bronze', 'prata', 'ouro', 'vip', 'premium'].includes(planRef)
      const plan = isId
        ? await pb.collection('plans').getOne(planRef, { fields: 'daily_bumps' })
        : (await pb.collection('plans').getList(1, 1, { filter: `slug="${planRef}"`, fields: 'daily_bumps' })).items[0]
      const n = plan ? (Number(plan.daily_bumps) || 0) : 0
      plansCache[planRef] = n
      return n
    } catch {
      plansCache[planRef] = 0
      return 0
    }
  }

  let applied = 0
  for (const profile of list.items || []) {
    const dailyBumps = await getDailyBumps(profile.plan)
    if (dailyBumps <= 0) continue

    const usedToday = profile.bumps_used_date === today ? (Number(profile.bumps_used_today) || 0) : 0
    if (usedToday >= dailyBumps) continue

    try {
      await pb.collection('profiles').update(profile.id, {
        last_bump_at: now,
        bumps_used_date: today,
        bumps_used_today: usedToday + 1,
      })
      applied++
      console.log('Bump aplicado:', profile.id)
    } catch (err) {
      console.warn('Erro ao dar bump em', profile.id, err.message)
    }
  }

  console.log('Total de bumps aplicados:', applied)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

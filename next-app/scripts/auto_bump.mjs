#!/usr/bin/env node
/**
 * Aplica bump automático usando a mesma fonte oficial da produção:
 * profile_daily_bumps + profiles.last_bump_at.
 *
 * Este script existe para `npm run auto-bump` dentro do next-app. O Docker de
 * produção continua copiando e executando `/app/auto_bump.cjs` na raiz.
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import PocketBase from 'pocketbase'
import bumpEligibility from '../../auto_bump_eligibility.cjs'

const { isProfileBumpEligible } = bumpEligibility

const __dirname = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(__dirname, '..')
const repoRoot = join(nextAppRoot, '..')
const LOCK_FILE = '/tmp/cerejavip-auto-bump.lock'
const LOCK_STALE_MS = 15 * 60 * 1000

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
}

loadEnv(nextAppRoot)
loadEnv(repoRoot)

const PB_URL = (
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.VITE_POCKETBASE_URL ||
  'https://pocketbase.cerejavip.com'
).replace(/\/$/, '')
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || ''
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD || ''

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

function acquireLock() {
  const now = Date.now()
  try {
    if (existsSync(LOCK_FILE)) {
      const lockTs = Number(readFileSync(LOCK_FILE, 'utf8'))
      const lockAge = Number.isFinite(lockTs) ? now - lockTs : Number.POSITIVE_INFINITY
      if (lockAge < LOCK_STALE_MS) {
        console.log(`[AutoBump] Skip: another execution is running (lock age ${Math.round(lockAge / 1000)}s).`)
        return false
      }
      console.log('[AutoBump] Stale lock detected, replacing old lock.')
      unlinkSync(LOCK_FILE)
    }

    writeFileSync(LOCK_FILE, String(now), { flag: 'wx' })
    return true
  } catch (error) {
    console.error('[AutoBump] Failed to acquire lock:', error.message)
    return false
  }
}

function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE)
  } catch (error) {
    console.error('[AutoBump] Failed to release lock:', error.message)
  }
}

async function runAutoBump() {
  if (!acquireLock()) return

  try {
    if (!PB_URL || !EMAIL || !PASSWORD) {
      console.error('Defina URL e credenciais admin do PocketBase')
      process.exitCode = 1
      return
    }

    console.log(`[${new Date().toISOString()}] Starting Auto-Bump process...`)
    await pb.admins.authWithPassword(EMAIL, PASSWORD)

    const plans = await pb.collection('plans').getFullList({
      fields: 'id,slug,daily_bumps',
    })
    const plansMap = new Map()
    for (const plan of plans) {
      if (plan.id) plansMap.set(plan.id, plan)
      if (plan.slug) plansMap.set(plan.slug, plan)
    }

    const profiles = await pb.collection('profiles').getFullList({
      filter: 'status = "active" && auto_bump = true',
      sort: '-last_bump_at',
      fields: 'id,name,plan,last_bump_at,auto_bump,status,search_expires_at,contact_expires_at',
    })
    console.log(`Found ${profiles.length} active profiles with auto-bump enabled.`)

    const today = todayBR()
    const dailyMap = new Map()
    const dailyRecords = await pb.collection('profile_daily_bumps').getFullList({
      filter: `date = "${today}"`,
      fields: 'id,profile,bumps_used',
    })
    for (const record of dailyRecords) {
      if (record.profile) dailyMap.set(record.profile, record)
    }

    const forceMode = process.argv.includes('--force')
    for (const profile of profiles) {
      if (!isProfileBumpEligible(profile)) {
        try {
          await pb.collection('profiles').update(profile.id, { auto_bump: false })
          console.log(`Auto-bump disabled for expired profile ${profile.id}.`)
        } catch (error) {
          console.error(`Failed to disable auto-bump for expired profile ${profile.id}:`, error.message)
        }
        continue
      }

      const plan = plansMap.get(profile.plan)
      const dailyBumps = Number(plan?.daily_bumps) || 0
      if (dailyBumps <= 0) {
        console.log(`Profile ${profile.id} has no valid plan for bumps (plan ref: ${profile.plan || 'empty'}).`)
        continue
      }

      const dailyBumpRecord = dailyMap.get(profile.id)
      const bumpsUsed = Number(dailyBumpRecord?.bumps_used) || 0
      if (bumpsUsed >= dailyBumps) {
        console.log(`Profile ${profile.id} already used all ${dailyBumps} bumps for today.`)
        continue
      }

      const intervalMs = (24 * 60 * 60 * 1000) / dailyBumps
      const lastBump = profile.last_bump_at ? new Date(profile.last_bump_at).getTime() : 0
      const now = Date.now()
      if (!forceMode && now - lastBump < intervalMs) {
        const nextBumpIn = Math.round((intervalMs - (now - lastBump)) / 1000 / 60)
        console.log(`Profile ${profile.id} needs to wait ${nextBumpIn} more minutes for next auto-bump.`)
        continue
      }

      console.log(`Bumping profile ${profile.id} (${profile.name})... ${forceMode ? '[FORCE MODE]' : ''}`)
      if (dailyBumpRecord) {
        await pb.collection('profile_daily_bumps').update(dailyBumpRecord.id, {
          bumps_used: bumpsUsed + 1,
        })
        dailyMap.set(profile.id, { ...dailyBumpRecord, bumps_used: bumpsUsed + 1 })
      } else {
        const created = await pb.collection('profile_daily_bumps').create({
          profile: profile.id,
          date: today,
          bumps_used: 1,
        })
        dailyMap.set(profile.id, created)
      }

      await pb.collection('profiles').update(profile.id, {
        last_bump_at: new Date().toISOString(),
      })
      console.log(`Successfully bumped ${profile.id}.`)
    }
  } catch (error) {
    console.error('Auto-Bump Error:', error)
    process.exitCode = 1
  } finally {
    releaseLock()
  }
}

if (process.argv.includes('--loop')) {
  console.log('Running in loop mode (every 5 minutes)...')
  runAutoBump()
  setInterval(runAutoBump, 5 * 60 * 1000)
} else {
  runAutoBump()
}

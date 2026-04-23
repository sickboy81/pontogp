#!/usr/bin/env node
/**
 * Atualiza status de perfis por expiração:
 * - contact_expires_at vencido → status = "muted"
 * - search_expires_at vencido  → status = "archived"
 *
 * Uso: node scripts/cleanup_profiles.mjs
 * Agende com cron (ex.: uma vez ao dia).
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

const now = new Date().toISOString()

async function main() {
  try {
    await pb.admins.authWithPassword(EMAIL, PASSWORD)
  } catch (err) {
    console.error('Erro ao autenticar:', err.message)
    process.exit(1)
  }

  let archived = 0
  let muted = 0

  try {
    const searchExpired = await pb.collection('profiles').getList(1, 500, {
      filter: `search_expires_at != "" && search_expires_at < "${now}" && status != "archived"`,
      fields: 'id,status',
    })
    for (const p of searchExpired.items || []) {
      try {
        await pb.collection('profiles').update(p.id, { status: 'archived' })
        archived++
        console.log('Arquivado (search_expires_at):', p.id)
      } catch (e) {
        console.warn('Erro ao arquivar', p.id, e.message)
      }
    }
  } catch (err) {
    console.error('Erro ao listar perfis com search expirado:', err.message)
  }

  try {
    const contactExpired = await pb.collection('profiles').getList(1, 500, {
      filter: `contact_expires_at != "" && contact_expires_at < "${now}" && status != "muted" && status != "archived"`,
      fields: 'id,status',
    })
    for (const p of contactExpired.items || []) {
      try {
        await pb.collection('profiles').update(p.id, { status: 'muted' })
        muted++
        console.log('Mutado (contact_expires_at):', p.id)
      } catch (e) {
        console.warn('Erro ao mutar', p.id, e.message)
      }
    }
  } catch (err) {
    console.error('Erro ao listar perfis com contact expirado:', err.message)
  }

  console.log('Resumo: arquivados', archived, ', mutados', muted)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

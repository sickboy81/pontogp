#!/usr/bin/env node
/**
 * Arquiva perfis ativos após a janela configurada em
 * settings.profile_visibility_policy.archive_after_days.
 *
 * Uso: node scripts/cleanup_profiles.mjs
 * Dry-run: CLEANUP_DRY_RUN=true node scripts/cleanup_profiles.mjs
 *
 * Variáveis: NEXT_PUBLIC_POCKETBASE_URL,
 * POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD.
 */

import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import PocketBase from 'pocketbase'
import {
  buildProfileArchiveCutoff,
  parseProfileVisibilityPolicy,
} from '../src/lib/profile-visibility.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(__dirname, '..')
const repoRoot = join(nextAppRoot, '..')
const VISIBILITY_POLICY_KEY = 'profile_visibility_policy'
const PAGE_SIZE = 500

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim()
    }
  }
}

loadEnv(nextAppRoot)
loadEnv(repoRoot)

const PB_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || ''
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || ''
const DRY_RUN = process.env.CLEANUP_DRY_RUN === 'true'

if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error(
    'Defina NEXT_PUBLIC_POCKETBASE_URL e credenciais admin do PocketBase (ou .env)',
  )
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

async function loadVisibilityPolicy() {
  try {
    const setting = await pb
      .collection('settings')
      .getFirstListItem(`key = "${VISIBILITY_POLICY_KEY}"`, { fields: 'value' })
    return parseProfileVisibilityPolicy(setting.value)
  } catch (error) {
    if (error?.status !== 404) throw error
    return parseProfileVisibilityPolicy(null)
  }
}

async function main() {
  try {
    await pb.admins.authWithPassword(EMAIL, PASSWORD)
  } catch (error) {
    console.error('Erro ao autenticar:', error.message)
    process.exit(1)
  }

  const policy = await loadVisibilityPolicy()
  const cutoff = buildProfileArchiveCutoff(new Date(), policy).toISOString()
  const filter =
    `status = "active" && search_expires_at != "" && search_expires_at <= "${cutoff}"`

  let candidates
  try {
    // Coleta todos os IDs antes dos PATCHes para não deslocar páginas do filtro.
    candidates = await pb.collection('profiles').getFullList(PAGE_SIZE, {
      filter,
      sort: 'id',
      fields: 'id,search_expires_at',
    })
  } catch (error) {
    console.error('Erro ao listar candidatos a arquivamento:', error.message)
    process.exit(1)
  }

  console.log(
    `Política: archive_after_days=${policy.archive_after_days}; cutoff=${cutoff}; candidatos=${candidates.length}; dry_run=${DRY_RUN}`,
  )

  if (DRY_RUN) {
    for (const profile of candidates) {
      console.log(
        'Candidato a arquivamento:',
        profile.id,
        profile.search_expires_at || '',
      )
    }
    console.log('Resumo dry-run: candidatos', candidates.length, ', alterações 0')
    return
  }

  let archived = 0
  let failed = 0
  for (const profile of candidates) {
    try {
      await pb.collection('profiles').update(profile.id, { status: 'archived' })
      archived++
      console.log('Arquivado:', profile.id)
    } catch (error) {
      failed++
      console.warn('Erro ao arquivar', profile.id, error.message)
    }
  }

  console.log(
    'Resumo: candidatos',
    candidates.length,
    ', arquivados',
    archived,
    ', falhas',
    failed,
  )
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

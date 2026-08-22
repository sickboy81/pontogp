#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PocketBase from 'pocketbase'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(scriptDir, '..')
const repoRoot = join(nextAppRoot, '..')

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.replace(/^\uFEFF/, '').trim()
    const separator = line.indexOf('=')
    if (!line || line.startsWith('#') || separator <= 0) continue
    const key = line.slice(0, separator).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) continue
    process.env[key] = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
}

loadEnv(nextAppRoot)
loadEnv(repoRoot)

const catalog = {
  gratis: {
    daily_bumps: 0, max_photos: 3, max_videos: 0, max_audio: 0,
    featured: false, analytics: false, verified_badge: false, highlight_percentage: 0,
    features: ['3 fotos no perfil', 'Contagem total de visualizações', 'Sem bumps diários'],
  },
  bronze: {
    daily_bumps: 3, max_photos: 10, max_videos: 0, max_audio: 0,
    featured: false, analytics: false, verified_badge: false, highlight_percentage: 0,
    features: ['10 fotos no perfil', '3 bumps por dia', 'Resumo de visualizações, cliques e favoritos'],
  },
  prata: {
    daily_bumps: 6, max_photos: 15, max_videos: 1, max_audio: 1,
    featured: false, analytics: false, verified_badge: false, highlight_percentage: 0,
    features: ['15 fotos no perfil', '1 vídeo e 1 áudio', '6 bumps por dia', 'Resumo de visualizações, cliques e favoritos'],
  },
  ouro: {
    daily_bumps: 24, max_photos: -1, max_videos: -1, max_audio: 1,
    featured: true, analytics: true, verified_badge: false, highlight_percentage: 100,
    features: ['Fotos e vídeos ilimitados', '1 áudio no perfil', '24 bumps por dia', 'Destaque visual', 'Analytics completo'],
  },
}

async function main() {
  const baseUrl = (process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
  const email = process.env.POCKETBASE_ADMIN_EMAIL || ''
  const password = process.env.POCKETBASE_ADMIN_PASSWORD || ''
  if (!baseUrl || !email || !password) throw new Error('Defina NEXT_PUBLIC_POCKETBASE_URL e credenciais administrativas do PocketBase.')

  const pb = new PocketBase(baseUrl)
  await pb.collection('_superusers').authWithPassword(email, password)
  const records = await pb.collection('plans').getFullList({ fields: 'id,slug' })
  const bySlug = new Map(records.map((record) => [record.slug, record]))
  const missing = Object.keys(catalog).filter((slug) => !bySlug.has(slug))
  if (missing.length) throw new Error(`Planos ausentes no PocketBase: ${missing.join(', ')}`)

  const dryRun = process.argv.includes('--dry-run')
  for (const [slug, values] of Object.entries(catalog)) {
    const record = bySlug.get(slug)
    if (dryRun) {
      console.log(`[dry-run] ${slug}:`, values)
      continue
    }
    await pb.collection('plans').update(record.id, values)
    console.log(`[plan-catalog] ${slug} atualizado`)
  }
}

main().catch((error) => {
  console.error(`[plan-catalog] ${error.message}`)
  process.exit(1)
})

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
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) continue
    process.env[key] = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
}

loadEnv(nextAppRoot)
loadEnv(repoRoot)

const baseUrl = (process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
const email = process.env.POCKETBASE_ADMIN_EMAIL || ''
const password = process.env.POCKETBASE_ADMIN_PASSWORD || ''
if (!baseUrl || !email || !password) {
  throw new Error('Defina NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD.')
}

const pb = new PocketBase(baseUrl)
const visibilityFields = ['show_whatsapp', 'show_telegram', 'show_phone']

await pb.admins.authWithPassword(email, password)
const profiles = await pb.collections.getOne('pbc_3414089001')
const existing = new Set((profiles.schema || []).map((field) => field.name))
const schema = [...(profiles.schema || [])]
for (const name of visibilityFields) {
  if (existing.has(name)) continue
  schema.push({
    name,
    type: 'bool',
    required: false,
    presentable: false,
    system: false,
  })
}

if (schema.length === (profiles.schema || []).length) {
  console.log('[profile-contact-visibility] Campos já estavam configurados.')
} else {
  await pb.collections.update(profiles.id, { schema })
  console.log('[profile-contact-visibility] Campos de visibilidade adicionados ao profiles.')
}

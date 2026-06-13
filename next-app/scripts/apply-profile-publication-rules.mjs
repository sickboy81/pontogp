#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(scriptDir, '..')
const repoRoot = join(nextAppRoot, '..')

const PROFILE_CREATE_RULE =
  'user = @request.auth.id && @request.body.status = "inactive"'
const PROFILE_UPDATE_RULE =
  '(user = @request.auth.id && @request.body.status:changed = false) || @request.auth.role = "admin"'

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim()
  }
}

async function authenticate(baseUrl, email, password) {
  const body = JSON.stringify({ identity: email, password })
  let response = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!response.ok) {
    response = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  }
  if (!response.ok) throw new Error('Falha ao autenticar como administrador do PocketBase.')
  const data = await response.json()
  if (!data.token) throw new Error('PocketBase não retornou token administrativo.')
  return data.token
}

async function main() {
  loadEnv(nextAppRoot)
  loadEnv(repoRoot)

  const baseUrl = (process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, '')
  const email = process.env.POCKETBASE_ADMIN_EMAIL || ''
  const password = process.env.POCKETBASE_ADMIN_PASSWORD || ''
  if (!baseUrl || !email || !password) {
    throw new Error(
      'Defina NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD.'
    )
  }

  const token = await authenticate(baseUrl, email, password)
  const response = await fetch(`${baseUrl}/api/collections/profiles`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      createRule: PROFILE_CREATE_RULE,
      updateRule: PROFILE_UPDATE_RULE,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Falha ao atualizar regras de profiles: ${response.status} ${error}`)
  }

  const collection = await response.json()
  if (
    collection.createRule !== PROFILE_CREATE_RULE ||
    collection.updateRule !== PROFILE_UPDATE_RULE
  ) {
    throw new Error('PocketBase respondeu sem confirmar as regras esperadas.')
  }

  console.log('[profile-publication-rules] Regras aplicadas e confirmadas.')
}

main().catch((error) => {
  console.error(`[profile-publication-rules] ${error.message}`)
  process.exit(1)
})

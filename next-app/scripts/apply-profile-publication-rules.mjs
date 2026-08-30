#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(scriptDir, '..')
const repoRoot = join(nextAppRoot, '..')

const PROFILE_CREATE_RULE =
  'user = @request.auth.id && @request.auth.role = "advertiser" && @request.body.status = "inactive"'
const PROFILE_UPDATE_RULE =
  '(user = @request.auth.id && @request.auth.role = "advertiser" && @request.body.status:changed = false) || @request.auth.role = "admin"'
const PROFILE_LIST_RULE = 'status = "active" && user.role = "advertiser"'
const PROFILE_VIEW_RULE = 'status = "active" && user.role = "advertiser"'
const PROFILE_DELETE_RULE = '(user = @request.auth.id && @request.auth.role = "advertiser") || @request.auth.role = "admin"'

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
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    process.env[key] = value
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
      listRule: PROFILE_LIST_RULE,
      viewRule: PROFILE_VIEW_RULE,
      deleteRule: PROFILE_DELETE_RULE,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Falha ao atualizar regras de profiles: ${response.status} ${error}`)
  }

  const collection = await response.json()
  if (
    collection.listRule !== PROFILE_LIST_RULE ||
    collection.viewRule !== PROFILE_VIEW_RULE ||
    collection.createRule !== PROFILE_CREATE_RULE ||
    collection.updateRule !== PROFILE_UPDATE_RULE
    || collection.deleteRule !== PROFILE_DELETE_RULE
  ) {
    throw new Error('PocketBase respondeu sem confirmar as regras esperadas.')
  }

  console.log('[profile-publication-rules] Regras aplicadas e confirmadas.')
}

main().catch((error) => {
  console.error(`[profile-publication-rules] ${error.message}`)
  process.exit(1)
})

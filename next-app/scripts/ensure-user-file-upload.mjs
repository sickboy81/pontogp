#!/usr/bin/env node

import PocketBase from 'pocketbase'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
for (const file of [join(root, '.env'), join(root, '..', '.env')]) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}
const pb = new PocketBase((process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, ''))
if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) throw new Error('Defina as credenciais administrativas do PocketBase.')
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)
const files = await pb.collections.getOne('files')
if (files.createRule !== '@request.auth.id != ""') {
  await pb.collections.update(files.id, { createRule: '@request.auth.id != ""' })
  console.log('[user-file-upload] Regra de criação corrigida para usuários autenticados.')
} else console.log('[user-file-upload] Regra já estava configurada.')

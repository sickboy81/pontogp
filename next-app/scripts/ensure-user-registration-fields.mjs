#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PocketBase from 'pocketbase'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const file of [join(root, '.env'), join(root, '..', '.env')]) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}

const pb = new PocketBase((process.env.NEXT_PUBLIC_POCKETBASE_URL || '').replace(/\/$/, ''))
if (!pb.baseUrl || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) throw new Error('Defina as variáveis do PocketBase.')
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)
const users = await pb.collections.getOne('_pb_users_auth_')
const existing = new Set((users.schema || []).map((field) => field.name))
const additions = [
  { name: 'full_name', type: 'text', required: false, presentable: false, max: 255 },
  { name: 'display_name', type: 'text', required: false, presentable: false, max: 100 },
  { name: 'age', type: 'number', required: false, presentable: false, min: 18, max: 100 },
  { name: 'city', type: 'text', required: false, presentable: false, max: 100 },
  { name: 'state', type: 'text', required: false, presentable: false, max: 2 },
  { name: 'bio', type: 'text', required: false, presentable: false, max: 300 },
]
const schema = [...(users.schema || []), ...additions.filter((field) => !existing.has(field.name))]
if (schema.length !== (users.schema || []).length) {
  await pb.collections.update(users.id, { schema })
  console.log('[user-registration-fields] Campos adicionados.')
} else console.log('[user-registration-fields] Campos já configurados.')

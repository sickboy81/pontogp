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
const fileSchema = files.schema || files.fields || []
const fileField = fileSchema.find((field) => field.name === 'file')
const desiredMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
  'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm',
]
const changes = {}
if (files.createRule !== '@request.auth.id != ""') changes.createRule = '@request.auth.id != ""'
if (files.updateRule !== '@request.auth.id != ""') changes.updateRule = '@request.auth.id != ""'
if (fileField && (fileField.maxSize || 0) < 100 * 1024 * 1024) {
  changes.schema = fileSchema.map((field) => field.name === 'file'
    ? { ...field, maxSize: 100 * 1024 * 1024, mimeTypes: desiredMimeTypes }
    : field)
}
if (Object.keys(changes).length) {
  await pb.collections.update(files.id, changes)
  console.log('[user-file-upload] Limite de 100 MB, MIME types e regras de upload corrigidos.')
} else console.log('[user-file-upload] Regras e limites de upload já estavam configurados.')

#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = JSON.parse(readFileSync(join(root, 'pocketbase-schema.json'), 'utf8'))
const collections = new Map(schema.collections.map((collection) => [collection.name, collection]))

const contracts = {
  users: ['role', 'status', 'plan', 'chat_blocked'],
  profiles: [
    'user',
    'status',
    'plan',
    'last_bump_at',
    'auto_bump',
    'contact_expires_at',
    'search_expires_at',
  ],
  payments: ['user', 'plan', 'amount', 'status', 'method', 'external_id', 'description'],
  profile_daily_bumps: ['profile', 'date', 'bumps_used'],
}

const failures = []
for (const [collectionName, requiredFields] of Object.entries(contracts)) {
  const collection = collections.get(collectionName)
  if (!collection) {
    failures.push(`coleção ausente: ${collectionName}`)
    continue
  }
  const fields = new Set((collection.schema || []).map((field) => field.name))
  for (const field of requiredFields) {
    if (!fields.has(field)) failures.push(`campo ausente: ${collectionName}.${field}`)
  }
}

const payment = collections.get('payments')
const statusField = payment?.schema?.find((field) => field.name === 'status')
const paymentStatuses = new Set(statusField?.values || [])
for (const status of ['pending', 'paid', 'failed', 'refunded']) {
  if (!paymentStatuses.has(status)) failures.push(`status de pagamento ausente: ${status}`)
}

const profiles = collections.get('profiles')
const expectedProfileCreateRule =
  'user = @request.auth.id && @request.body.status = "inactive"'
const expectedProfileUpdateRule =
  '(user = @request.auth.id && @request.body.status:changed = false) || @request.auth.role = "admin"'
if (profiles?.createRule !== expectedProfileCreateRule) {
  failures.push('regra de criação de profiles não obriga status inactive')
}
if (profiles?.updateRule !== expectedProfileUpdateRule) {
  failures.push('regra de atualização de profiles permite alteração direta de status')
}

if (failures.length) {
  console.error('[schema-contracts] falhou:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[schema-contracts] OK (${schema.exportedAt || 'sem data de exportação'})`)

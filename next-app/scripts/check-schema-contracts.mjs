#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = JSON.parse(readFileSync(join(root, 'pocketbase-schema.json'), 'utf8'))
const collections = new Map(schema.collections.map((collection) => [collection.name, collection]))

const contracts = {
  users: ['role', 'status', 'verified', 'document_verified', 'plan', 'chat_blocked'],
  profiles: [
    'user',
    'status',
    'plan',
    'last_bump_at',
    'auto_bump',
    'contact_expires_at',
    'search_expires_at',
  ],
  payments: ['user', 'plan', 'profile', 'amount', 'status', 'method', 'external_id', 'description', 'fulfilled_at', 'idempotency_key'],
  profile_daily_bumps: ['profile', 'date', 'bumps_used'],
  story_likes: ['story', 'user'],
  story_comments: ['story', 'user', 'content'],
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
const users = collections.get('users')
if (users?.authRule !== 'verified = true') {
  failures.push('users.authRule deve exigir email confirmado para todas as contas')
}
const protectedUserFields = ['role', 'status', 'verified', 'document_verified', 'plan', 'chat_blocked']
const expectedUserUpdateRule =
  `(id = @request.auth.id && ${protectedUserFields.map((field) => `@request.body.${field}:changed = false`).join(' && ')}) || @request.auth.role = 'admin'`
if (users?.updateRule !== expectedUserUpdateRule) {
  failures.push('regra de atualização de users deve bloquear alteração direta dos campos protegidos por usuários comuns')
}

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

const storyLikes = collections.get('story_likes')
if (!storyLikes?.createRule?.includes('@request.auth.id')) {
  failures.push('story_likes.createRule deve exigir autenticação do usuário')
}
if (!storyLikes?.deleteRule?.includes('@request.auth.id')) {
  failures.push('story_likes.deleteRule deve limitar exclusão ao próprio usuário')
}

const storyComments = collections.get('story_comments')
if (!storyComments?.createRule?.includes('@request.auth.id')) {
  failures.push('story_comments.createRule deve exigir autenticação do usuário')
}
if (
  storyComments?.updateRule &&
  !storyComments.updateRule.includes('@request.auth.id') &&
  !storyComments.updateRule.includes('@request.auth.role = "admin"')
) {
  failures.push('story_comments.updateRule deve limitar edição ao dono ou admin')
}
if (
  storyComments?.deleteRule &&
  !storyComments.deleteRule.includes('@request.auth.id') &&
  !storyComments.deleteRule.includes('@request.auth.role = "admin"')
) {
  failures.push('story_comments.deleteRule deve limitar exclusão ao dono ou admin')
}

if (failures.length) {
  console.error('[schema-contracts] falhou:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[schema-contracts] OK (${schema.exportedAt || 'sem data de exportação'})`)

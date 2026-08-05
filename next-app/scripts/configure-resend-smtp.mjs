#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PocketBase from 'pocketbase'
import {
  buildPocketBaseEmailTemplates,
  buildPocketBaseResendSettings,
} from '../src/lib/resend-email.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
}

loadEnv(join(root, '.env'))

const pbUrl = String(process.env.NEXT_PUBLIC_POCKETBASE_URL ?? '').replace(/\/$/, '')
const adminEmail = String(process.env.POCKETBASE_ADMIN_EMAIL ?? '').trim()
const adminPassword = String(process.env.POCKETBASE_ADMIN_PASSWORD ?? '')
const apiKey = String(process.env.RESEND_API_KEY ?? '').trim()
const appUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? 'https://cerejavip.com')
const testEmail = String(process.env.RESEND_TEST_EMAIL ?? '').trim()

if (!pbUrl || !adminEmail || !adminPassword || !apiKey) {
  console.error('Defina NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD e RESEND_API_KEY.')
  process.exit(1)
}

const pb = new PocketBase(pbUrl)

try {
  await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword)
  await pb.settings.update(buildPocketBaseResendSettings({ apiKey, appUrl }))
  const users = await pb.collections.getOne('users')
  const templates = buildPocketBaseEmailTemplates(appUrl)
  await pb.collections.update(users.id, {
    ...templates,
    otp: { ...users.otp, ...templates.otp },
    authAlert: { ...users.authAlert, ...templates.authAlert },
  })
  console.log('SMTP da Resend configurado no PocketBase.')

  if (testEmail) {
    await pb.settings.testEmail('users', testEmail, 'verification')
    console.log(`Email de teste solicitado para ${testEmail}.`)
  } else {
    console.log('Defina RESEND_TEST_EMAIL para enviar um teste de verificacao.')
  }
} catch (error) {
  console.error('Falha ao configurar SMTP da Resend:', error?.message || error)
  process.exit(1)
}

#!/usr/bin/env node
/**
 * Exporta o schema de todas as coleções do PocketBase para um JSON no repositório.
 * Use como fonte de verdade para nomes de campos e tipos ao implementar APIs.
 *
 * Uso (a partir de next-app):
 *   node scripts/export-pocketbase-schema.mjs
 *
 * Variáveis de ambiente (ou .env):
 *   NEXT_PUBLIC_POCKETBASE_URL  (ex: https://pocketbase.cerejavip.com)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import PocketBase from 'pocketbase'

const __dirname = dirname(fileURLToPath(import.meta.url))
const nextAppRoot = join(__dirname, '..')
const repoRoot = join(nextAppRoot, '..')

function loadEnv(dir) {
  const path = join(dir, '.env')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim()
      process.env[m[1]] = val
    }
  }
}

loadEnv(nextAppRoot)
loadEnv(repoRoot)

const PB_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || '').replace(/\/$/, '')
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || ''
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || ''

if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error('Defina NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD (ou .env)')
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

async function main() {
  try {
    await pb.admins.authWithPassword(EMAIL, PASSWORD)
    const collections = await pb.collections.getFullList()
    const output = {
      exportedAt: new Date().toISOString(),
      baseUrl: PB_URL,
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        authRule: c.authRule ?? null,
        listRule: c.listRule ?? null,
        viewRule: c.viewRule ?? null,
        createRule: c.createRule ?? null,
        updateRule: c.updateRule ?? null,
        deleteRule: c.deleteRule ?? null,
        schema: c.schema || c.fields || [],
      })),
    }
    const outPath = join(nextAppRoot, 'pocketbase-schema.json')
    writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')
    console.log('Schema exportado para', outPath)
    console.log('Coleções:', output.collections.map((c) => c.name).join(', '))
  } catch (err) {
    console.error('Erro:', err.message)
    if (err.response) console.error(await err.response.text?.())
    process.exit(1)
  }
}

main()

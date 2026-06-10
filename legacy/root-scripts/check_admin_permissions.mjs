import { createDirectus, rest, staticToken } from '@directus/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

let env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/)
    if (match && !match[1].startsWith('#')) {
      env[match[1]] = match[2]
    }
  })
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const API_TOKEN = env.VITE_DIRECTUS_TOKEN || ''

if (!API_TOKEN) {
  console.error('❌ VITE_DIRECTUS_TOKEN não encontrado no .env')
  process.exit(1)
}

console.log('🔍 Verificando permissões do token admin...\n')
console.log(`URL: ${DIRECTUS_URL}`)
console.log(`Token: ${API_TOKEN.substring(0, 10)}...\n`)

const collections = [
  'verification_requests',
  'subscriptions',
  'reports',
  'contacts',
  'settings',
  'plans',
  'profiles',
  'users'
]

async function checkCollection(collection) {
  try {
    const url = `${DIRECTUS_URL}/items/${collection}?limit=1`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${collection}: OK (${data.data?.length || 0} items)`)
      return true
    } else if (response.status === 403) {
      console.log(`❌ ${collection}: 403 (Sem permissão)`)
      return false
    } else if (response.status === 404) {
      console.log(`⚠️  ${collection}: 404 (Collection não existe)`)
      return false
    } else {
      console.log(`⚠️  ${collection}: ${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${collection}: Erro - ${error.message}`)
    return false
  }
}

async function main() {
  console.log('Testando acesso às collections:\n')
  
  const results = {}
  for (const collection of collections) {
    results[collection] = await checkCollection(collection)
  }

  console.log('\n📊 Resumo:')
  const ok = Object.values(results).filter(r => r).length
  const failed = Object.values(results).filter(r => !r).length
  console.log(`✅ Acessíveis: ${ok}`)
  console.log(`❌ Inacessíveis/Não existem: ${failed}`)
  
  if (failed > 0) {
    console.log('\n💡 Para corrigir:')
    console.log('1. Verifique se as collections existem no Directus')
    console.log('2. Configure permissões para o token admin nas collections')
    console.log('3. Ou crie as collections usando: node scripts/setup_collections_complete.mjs')
  }
}

main().catch(console.error)

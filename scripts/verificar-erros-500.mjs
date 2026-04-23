/**
 * Script para verificar erros 500 nas collections
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Carregar .env manualmente
let env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/)
    if (match && !match[1].startsWith('#')) {
      env[match[1].trim()] = match[2].trim()
    }
  })
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || env.DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD
const API_TOKEN = env.VITE_DIRECTUS_TOKEN

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD devem estar no .env')
  process.exit(1)
}

let adminToken = null

async function login() {
  console.log('1. Fazendo login...')
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (!response.ok) {
    throw new Error(`Login falhou: ${response.status}`)
  }

  const data = await response.json()
  adminToken = data.data.access_token
  console.log('   ✅ Login realizado\n')
}

async function verificarCollection(collectionName) {
  console.log(`2. Verificando collection ${collectionName}...\n`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Verificar se a collection existe
  const collectionResponse = await fetch(`${DIRECTUS_URL}/collections/${collectionName}`, { headers })
  
  if (!collectionResponse.ok) {
    console.log(`   ❌ Collection não existe ou erro: ${collectionResponse.status}`)
    return false
  }

  const collectionData = await collectionResponse.json()
  console.log(`   ✅ Collection existe`)
  console.log(`   Schema:`, JSON.stringify(collectionData.data.schema, null, 2))
  console.log('')

  // Verificar campos
  const fieldsResponse = await fetch(`${DIRECTUS_URL}/fields/${collectionName}`, { headers })
  if (fieldsResponse.ok) {
    const fieldsData = await fieldsResponse.json()
    console.log(`   Campos:`)
    fieldsData.data.forEach(field => {
      console.log(`      - ${field.field} (${field.type})`)
    })
    console.log('')
  }

  // Tentar buscar itens
  console.log(`   Testando busca de itens...`)
  const itemsResponse = await fetch(`${DIRECTUS_URL}/items/${collectionName}?limit=1`, { headers })
  
  if (itemsResponse.ok) {
    const itemsData = await itemsResponse.json()
    console.log(`   ✅ Busca OK (${itemsData.data?.length || 0} itens)`)
  } else {
    const errorText = await itemsResponse.text()
    console.log(`   ❌ Erro na busca: ${itemsResponse.status}`)
    console.log(`   Resposta: ${errorText.substring(0, 500)}`)
  }
  console.log('')

  return true
}

async function testarComTokenUsuario() {
  console.log(`3. Testando com token de usuário...\n`)
  
  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  }

  const collections = ['user_favorites', 'notifications', 'cities']
  
  for (const collection of collections) {
    console.log(`   Testando ${collection}...`)
    const response = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=1`, { headers })
    
    console.log(`      Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`      Erro: ${errorText.substring(0, 200)}`)
    } else {
      const data = await response.json()
      console.log(`      ✅ OK (${data.data?.length || 0} itens)`)
    }
    console.log('')
  }
}

async function main() {
  console.log('========================================')
  console.log('Verificar Erros 500')
  console.log('========================================\n')

  try {
    await login()
    await verificarCollection('user_favorites')
    await verificarCollection('notifications')
    await verificarCollection('cities')
    await testarComTokenUsuario()

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

/**
 * Script para verificar e criar collections necessárias
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

async function verificarCollections() {
  console.log('2. Verificando collections...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const collectionsToCheck = ['notifications', 'user_favorites', 'cities']
  const missing = []

  for (const collection of collectionsToCheck) {
    const response = await fetch(`${DIRECTUS_URL}/collections/${collection}`, { headers })
    
    if (response.ok) {
      console.log(`   ✅ ${collection} existe`)
    } else {
      console.log(`   ❌ ${collection} NÃO existe`)
      missing.push(collection)
    }
  }

  console.log('')
  return missing
}

async function criarCollection(name, schema) {
  console.log(`   Criando collection ${name}...`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify(schema),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (error.errors?.[0]?.message?.includes('already exists')) {
      console.log(`      ⏭️  Collection já existe`)
      return true
    }
    console.log(`      ❌ Erro: ${error.errors?.[0]?.message || JSON.stringify(error)}`)
    return false
  }

  console.log(`      ✅ Collection ${name} criada`)
  return true
}

async function criarCampo(collection, field) {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(field),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (error.errors?.[0]?.message?.includes('already exists')) {
      return true
    }
    console.log(`      ❌ Campo ${field.field}: ${error.errors?.[0]?.message || JSON.stringify(error)}`)
    return false
  }

  console.log(`      ✅ Campo ${field.field} criado`)
  return true
}

async function criarCollectionsMissing(missing) {
  if (missing.length === 0) {
    console.log('3. Todas as collections existem!\n')
    return
  }

  console.log(`3. Criando collections faltantes...\n`)

  for (const collectionName of missing) {
    if (collectionName === 'notifications') {
      await criarCollection('notifications', {
        collection: 'notifications',
        meta: {
          singleton: false,
          icon: 'notifications',
        },
        schema: {
          name: 'notifications',
        },
      })

      await criarCampo('notifications', {
        field: 'id',
        type: 'integer',
        meta: { interface: 'input', readonly: true, hidden: true },
        schema: { is_primary_key: true, has_auto_increment: true },
      })

      await criarCampo('notifications', {
        field: 'user_id',
        type: 'uuid',
        meta: { interface: 'input-uuid' },
        schema: {},
      })

      await criarCampo('notifications', {
        field: 'message',
        type: 'text',
        meta: { interface: 'input-multiline' },
        schema: {},
      })

      await criarCampo('notifications', {
        field: 'read',
        type: 'boolean',
        meta: { interface: 'boolean' },
        schema: { default_value: false },
      })

      await criarCampo('notifications', {
        field: 'read_at',
        type: 'timestamp',
        meta: { interface: 'datetime' },
        schema: {},
      })

      await criarCampo('notifications', {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', special: ['date-created'] },
        schema: {},
      })
    }

    if (collectionName === 'user_favorites') {
      await criarCollection('user_favorites', {
        collection: 'user_favorites',
        meta: {
          singleton: false,
          icon: 'favorite',
        },
        schema: {
          name: 'user_favorites',
        },
      })

      await criarCampo('user_favorites', {
        field: 'id',
        type: 'integer',
        meta: { interface: 'input', readonly: true, hidden: true },
        schema: { is_primary_key: true, has_auto_increment: true },
      })

      await criarCampo('user_favorites', {
        field: 'user_id',
        type: 'uuid',
        meta: { interface: 'input-uuid' },
        schema: {},
      })

      await criarCampo('user_favorites', {
        field: 'profile_id',
        type: 'integer',
        meta: { interface: 'input' },
        schema: {},
      })

      await criarCampo('user_favorites', {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', special: ['date-created'] },
        schema: {},
      })
    }

    if (collectionName === 'cities') {
      await criarCollection('cities', {
        collection: 'cities',
        meta: {
          singleton: false,
          icon: 'location_city',
        },
        schema: {
          name: 'cities',
        },
      })

      await criarCampo('cities', {
        field: 'id',
        type: 'integer',
        meta: { interface: 'input', readonly: true, hidden: true },
        schema: { is_primary_key: true, has_auto_increment: true },
      })

      await criarCampo('cities', {
        field: 'name',
        type: 'string',
        meta: { interface: 'input' },
        schema: {},
      })

      await criarCampo('cities', {
        field: 'state',
        type: 'string',
        meta: { interface: 'input' },
        schema: {},
      })

      await criarCampo('cities', {
        field: 'ibge_code',
        type: 'string',
        meta: { interface: 'input' },
        schema: {},
      })
    }
  }

  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar e Criar Collections')
  console.log('========================================\n')

  try {
    await login()
    const missing = await verificarCollections()
    await criarCollectionsMissing(missing)

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')
    
    if (missing.length > 0) {
      console.log('⚠️ Collections criadas. Agora execute:')
      console.log('node scripts/verificar-role-usuario.mjs')
      console.log('')
      console.log('Depois:')
      console.log('1. Reinicie o Directus no Coolify')
      console.log('2. Faça logout/login no site')
    } else {
      console.log('✅ Todas as collections já existem')
      console.log('')
      console.log('Se os erros persistem:')
      console.log('1. Reinicie o Directus no Coolify')
      console.log('2. Faça logout/login no site')
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

#!/usr/bin/env node
/**
 * Script simplificado para criar collection settings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Carregar .env
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
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD são obrigatórios no .env')
  process.exit(1)
}

console.log('========================================')
console.log('Criar Collection Settings - Directus')
console.log('========================================')
console.log('')

// 1. Login
console.log('1. Fazendo login...')
let token
try {
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  
  if (!loginRes.ok) {
    throw new Error(`Login falhou: ${loginRes.status}`)
  }
  
  const loginData = await loginRes.json()
  token = loginData.data.access_token
  console.log('   ✅ Login realizado!')
} catch (error) {
  console.error('   ❌ Erro no login:', error.message)
  process.exit(1)
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

console.log('')

// 2. Verificar collection
console.log('2. Verificando collection...')
let collectionExists = false
try {
  const collectionsRes = await fetch(`${DIRECTUS_URL}/collections`, { headers })
  const collections = await collectionsRes.json()
  collectionExists = collections.data?.some(c => c.collection === 'settings')
  
  if (collectionExists) {
    console.log('   ✅ Collection já existe!')
  }
} catch (error) {
  console.log('   ⚠️  Erro ao verificar:', error.message)
}

console.log('')

// 3. Criar collection
if (!collectionExists) {
  console.log('3. Criando collection...')
  try {
    const createRes = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: 'settings',
        meta: {
          collection: 'settings',
          icon: 'settings',
          note: 'Configurações do sistema',
          display_template: '{{key}}'
        },
        schema: { name: 'settings' }
      })
    })
    
    if (!createRes.ok) {
      const errorText = await createRes.text()
      throw new Error(`Erro ${createRes.status}: ${errorText}`)
    }
    
    console.log('   ✅ Collection criada!')
  } catch (error) {
    console.error('   ❌ Erro ao criar:', error.message)
    process.exit(1)
  }
  console.log('')
}

// 4. Criar campos
console.log('4. Criando campos...')
const fields = [
  { field: 'key', type: 'string', meta: { required: true, width: 'full' } },
  { field: 'value', type: 'json', meta: { width: 'full' } },
  { field: 'enabled', type: 'boolean', meta: { width: 'half' } },
  { field: 'message', type: 'text', meta: { width: 'full' } }
]

for (const field of fields) {
  try {
    const fieldRes = await fetch(`${DIRECTUS_URL}/fields/settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(field)
    })
    
    if (fieldRes.ok) {
      console.log(`   ✅ Campo '${field.field}' criado`)
    } else if (fieldRes.status === 403) {
      console.log(`   ⚠️  Campo '${field.field}' já existe ou sem permissão`)
    } else {
      const errorText = await fieldRes.text()
      console.log(`   ⚠️  Erro ao criar '${field.field}': ${errorText}`)
    }
  } catch (error) {
    console.log(`   ⚠️  Erro ao criar '${field.field}': ${error.message}`)
  }
}

console.log('')

// 5. Criar registro
console.log('5. Criando registro de manutenção...')
try {
  const checkRes = await fetch(`${DIRECTUS_URL}/items/settings?filter[key][_eq]=maintenance`, { headers })
  const checkData = await checkRes.json()
  
  if (checkData.data?.length > 0) {
    console.log('   ✅ Registro já existe!')
  } else {
    const createRes = await fetch(`${DIRECTUS_URL}/items/settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key: 'maintenance',
        enabled: false,
        message: 'Site em manutenção. Voltaremos em breve!',
        value: { enabled: false, message: 'Site em manutenção. Voltaremos em breve!' }
      })
    })
    
    if (createRes.ok) {
      console.log('   ✅ Registro criado!')
    } else {
      const errorText = await createRes.text()
      console.log(`   ⚠️  Erro: ${errorText}`)
    }
  }
} catch (error) {
  console.log(`   ⚠️  Erro: ${error.message}`)
}

console.log('')
console.log('========================================')
console.log('✅ Concluído!')
console.log('========================================')
console.log('')
console.log('💡 Configure as permissões manualmente:')
console.log('   Settings → Access Control → Public')
console.log('   Adicione: settings → Read')
console.log('')

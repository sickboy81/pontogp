/**
 * Script para verificar se o campo status existe na collection profiles
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

async function listarTodosCampos() {
  console.log('2. Listando todos os campos da collection profiles...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/profiles`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar campos: ${response.status}`)
    const error = await response.text()
    console.error(`   Erro: ${error}`)
    return
  }

  const data = await response.json()
  console.log(`   Total de campos: ${data.data?.length || 0}\n`)

  if (data.data && data.data.length > 0) {
    const statusField = data.data.find(f => f.field === 'status')
    
    if (statusField) {
      console.log('   ✅ Campo status encontrado:')
      console.log(`      - Field: ${statusField.field}`)
      console.log(`      - Type: ${statusField.type}`)
      console.log(`      - Meta: ${JSON.stringify(statusField.meta, null, 2)}`)
      console.log(`      - Schema: ${JSON.stringify(statusField.schema, null, 2)}`)
    } else {
      console.log('   ❌ Campo status NÃO encontrado na collection!')
      console.log('\n   📋 Campos disponíveis:')
      data.data.forEach(field => {
        console.log(`      - ${field.field} (${field.type})`)
      })
    }
  }
  console.log('')
}

async function buscarPerfilCompleto() {
  console.log('3. Buscando perfil completo com todos os campos...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/items/profiles?limit=1&fields=*`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar perfil: ${response.status}`)
    return
  }

  const data = await response.json()
  
  if (data.data && data.data.length > 0) {
    const profile = data.data[0]
    console.log(`   📋 Perfil: ${profile.name || profile.id}`)
    console.log(`   Campos retornados: ${Object.keys(profile).join(', ')}`)
    
    if ('status' in profile) {
      console.log(`   ✅ Campo status existe: ${profile.status}`)
    } else {
      console.log(`   ❌ Campo status NÃO está sendo retornado!`)
    }
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Campo Status')
  console.log('========================================\n')

  try {
    await login()
    await listarTodosCampos()
    await buscarPerfilCompleto()

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

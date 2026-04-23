/**
 * Script para verificar e criar campo schedule no Directus
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

async function verificarCampoSchedule() {
  console.log('2. Verificando campo schedule...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar todos os campos da collection profiles
  const fieldsResponse = await fetch(`${DIRECTUS_URL}/fields/profiles`, { headers })
  
  if (!fieldsResponse.ok) {
    throw new Error(`Erro ao buscar campos: ${fieldsResponse.status}`)
  }

  const fieldsData = await fieldsResponse.json()
  const fields = fieldsData.data || []
  
  const scheduleField = fields.find((f) => f.field === 'schedule')
  
  if (scheduleField) {
    console.log('   ✅ Campo schedule existe')
    console.log(`      Tipo: ${scheduleField.type}`)
    console.log(`      Interface: ${scheduleField.meta?.interface || 'N/A'}`)
    return true
  } else {
    console.log('   ❌ Campo schedule NÃO existe')
    return false
  }
}

async function criarCampoSchedule() {
  console.log('3. Criando campo schedule...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Criar campo JSON para armazenar array de horários
  const fieldData = {
    field: 'schedule',
    type: 'json',
    meta: {
      interface: 'input-code',
      options: {
        language: 'json',
      },
      note: 'Horários de atendimento por dia da semana',
    },
    schema: {
      default_value: null,
    },
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fieldData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (error.errors?.[0]?.message?.includes('already exists')) {
      console.log('   ⏭️  Campo já existe')
      return true
    }
    console.log(`   ❌ Erro: ${JSON.stringify(error)}`)
    return false
  }

  const result = await response.json()
  console.log(`   ✅ Campo criado! ID: ${result.data.field}`)
  return true
}

async function main() {
  console.log('========================================')
  console.log('Verificar Campo Schedule')
  console.log('========================================\n')

  try {
    await login()
    const exists = await verificarCampoSchedule()
    
    if (!exists) {
      await criarCampoSchedule()
    }

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')
    
    console.log('⚠️ Se o campo foi criado:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Os horários devem ser salvos e exibidos corretamente')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

/**
 * Script Rápido para Configurar R2 com Credenciais Fornecidas
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Credenciais R2 (carregadas do .env)
// NUNCA coloque credenciais reais aqui! Use o .env
const R2_CONFIG = {
  accountId: env.R2_ACCOUNT_ID || '',
  accessKeyId: env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  bucket: env.R2_BUCKET || 'pontogp-media',
  endpoint: env.R2_ENDPOINT || '',
}

// Carregar .env
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

// Credenciais R2 (carregadas do .env)
// NUNCA coloque credenciais reais aqui! Use o .env
const R2_CONFIG = {
  accountId: env.R2_ACCOUNT_ID || '',
  accessKeyId: env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  bucket: env.R2_BUCKET || 'pontogp-media',
  endpoint: env.R2_ENDPOINT || '',
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD devem estar no .env')
  process.exit(1)
}

if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
  console.error('❌ ERRO: Credenciais R2 não encontradas no .env')
  console.error('   Adicione: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY')
  process.exit(1)
}

let adminToken = null

async function login() {
  console.log('1. Fazendo login no Directus...')
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

async function getStorageLocations() {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/storage/locations`, { headers })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar storage locations: ${response.status}`)
  }

  const data = await response.json()
  return data.data || []
}

async function createR2Location() {
  console.log('2. Criando storage location R2...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const locationData = {
    name: 'R2 Storage',
    driver: 'r2',
    key: R2_CONFIG.accessKeyId,
    secret: R2_CONFIG.secretAccessKey,
    bucket: R2_CONFIG.bucket,
    endpoint: R2_CONFIG.endpoint,
    region: 'auto',
    account_id: R2_CONFIG.accountId,
  }

  const response = await fetch(`${DIRECTUS_URL}/storage/locations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(locationData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao criar storage location: ${error}`)
  }

  const data = await response.json()
  console.log(`   ✅ Storage location criada: ${data.data.name} (ID: ${data.data.id})\n`)
  return data.data
}

async function testR2Connection(locationId) {
  console.log('3. Testando conexão com R2...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
  }

  const testContent = `Test R2 connection - ${new Date().toISOString()}`
  const blob = new Blob([testContent], { type: 'text/plain' })
  const formData = new FormData()
  formData.append('file', blob, 'test-r2-connection.txt')

  const uploadResponse = await fetch(
    `${DIRECTUS_URL}/files?storage=${locationId}`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  )

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text()
    throw new Error(`Erro no teste de upload: ${error}`)
  }

  const uploadData = await uploadResponse.json()
  console.log('   ✅ Upload de teste bem-sucedido!')
  console.log(`      Arquivo ID: ${uploadData.data.id}`)
  console.log(`      URL: ${DIRECTUS_URL}/assets/${uploadData.data.id}\n`)

  // Deletar arquivo de teste
  const deleteResponse = await fetch(
    `${DIRECTUS_URL}/files/${uploadData.data.id}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  if (deleteResponse.ok) {
    console.log('   ✅ Arquivo de teste removido\n')
  }

  return true
}

async function main() {
  console.log('========================================')
  console.log('Configurar Cloudflare R2 no Directus')
  console.log('========================================\n')

  try {
    await login()

    // Verificar se já existe storage R2
    const existingLocations = await getStorageLocations()
    const existingR2 = existingLocations.find(l => l.driver === 'r2')

    if (existingR2) {
      console.log('⚠️  Já existe uma storage location R2:')
      console.log(`   Nome: ${existingR2.name}`)
      console.log(`   ID: ${existingR2.id}\n`)
      console.log('Testando conexão existente...\n')
      await testR2Connection(existingR2.id)
      return
    }

    // Criar nova storage location
    const r2Location = await createR2Location()

    // Testar conexão
    await testR2Connection(r2Location.id)

    console.log('========================================')
    console.log('✅ R2 configurado com sucesso!')
    console.log('========================================\n')
    
    console.log('📋 Próximos passos:')
    console.log('\n1. Configure as variáveis de ambiente no servidor/Coolify:')
    console.log('   STORAGE_LOCATIONS=r2')
    console.log('   STORAGE_R2_DRIVER=r2')
    console.log('   STORAGE_R2_KEY=' + R2_CONFIG.accessKeyId)
    console.log('   STORAGE_R2_SECRET=' + R2_CONFIG.secretAccessKey)
    console.log('   STORAGE_R2_BUCKET=' + R2_CONFIG.bucket)
    console.log('   STORAGE_R2_ENDPOINT=' + R2_CONFIG.endpoint)
    console.log('   STORAGE_R2_ACCOUNT_ID=' + R2_CONFIG.accountId)
    console.log('\n2. Reinicie o Directus após adicionar as variáveis')
    console.log('3. Teste fazendo upload de uma foto pelo frontend')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()

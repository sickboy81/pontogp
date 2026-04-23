/**
 * Script para Configurar Cloudflare R2 no Directus
 * 
 * Este script:
 * 1. Cria a storage location R2 no Directus
 * 2. Configura como padrão (opcional)
 * 3. Testa a conexão
 * 
 * IMPORTANTE: Configure as variáveis de ambiente R2 no servidor primeiro!
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

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

// Credenciais R2 (podem vir do .env ou ser solicitadas)
let R2_ACCOUNT_ID = env.R2_ACCOUNT_ID || ''
let R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID || ''
let R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY || ''
let R2_BUCKET = env.R2_BUCKET || 'pontogp-media'
let R2_ENDPOINT = env.R2_ENDPOINT || ''

let adminToken = null

// Função para ler input do usuário
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

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

async function createR2Location(config) {
  console.log('2. Criando storage location R2...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const locationData = {
    name: config.name || 'R2 Storage',
    driver: 'r2',
    key: config.accessKeyId,
    secret: config.secretAccessKey,
    bucket: config.bucket,
    endpoint: config.endpoint,
    region: config.region || 'auto',
    account_id: config.accountId,
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

async function setAsDefault(locationId) {
  console.log('3. Configurando como storage padrão...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar configurações de storage
  const settingsResponse = await fetch(`${DIRECTUS_URL}/settings/storage`, { headers })
  
  if (settingsResponse.ok) {
    // Atualizar storage padrão
    const updateResponse = await fetch(`${DIRECTUS_URL}/settings/storage`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        storage_default_location: locationId,
      }),
    })

    if (updateResponse.ok) {
      console.log('   ✅ Configurado como storage padrão\n')
    } else {
      console.log('   ⚠️  Não foi possível configurar como padrão (pode ser feito manualmente)\n')
    }
  } else {
    console.log('   ⚠️  Não foi possível configurar como padrão (pode ser feito manualmente)\n')
  }
}

async function testR2Connection(locationId) {
  console.log('4. Testando conexão com R2...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
  }

  // Criar um arquivo de teste pequeno
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
    // Verificar se as credenciais estão no .env
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.log('⚠️  Credenciais R2 não encontradas no .env\n')
      console.log('Por favor, forneça as credenciais do Cloudflare R2:\n')

      R2_ACCOUNT_ID = await askQuestion('Account ID: ')
      R2_ACCESS_KEY_ID = await askQuestion('Access Key ID: ')
      R2_SECRET_ACCESS_KEY = await askQuestion('Secret Access Key: ')
      R2_BUCKET = await askQuestion(`Bucket name [${R2_BUCKET}]: `) || R2_BUCKET
      
      console.log('')
    }

    // Construir endpoint se não fornecido
    if (!R2_ENDPOINT) {
      R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    }

    await login()

    // Verificar se já existe storage R2
    const existingLocations = await getStorageLocations()
    const existingR2 = existingLocations.find(l => l.driver === 'r2')

    if (existingR2) {
      console.log('⚠️  Já existe uma storage location R2:')
      console.log(`   Nome: ${existingR2.name}`)
      console.log(`   ID: ${existingR2.id}\n`)
      
      const update = await askQuestion('Deseja criar uma nova ou usar a existente? (n/u) [u]: ')
      if (update.toLowerCase() !== 'n') {
        console.log('\n✅ Usando storage location existente\n')
        await testR2Connection(existingR2.id)
        return
      }
    }

    // Criar nova storage location
    const r2Location = await createR2Location({
      name: 'R2 Storage',
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      endpoint: R2_ENDPOINT,
      region: 'auto',
      accountId: R2_ACCOUNT_ID,
    })

    // Configurar como padrão
    const setDefault = await askQuestion('Deseja configurar como storage padrão? (s/n) [s]: ')
    if (setDefault.toLowerCase() !== 'n') {
      await setAsDefault(r2Location.id)
    }

    // Testar conexão
    await testR2Connection(r2Location.id)

    console.log('========================================')
    console.log('✅ R2 configurado com sucesso!')
    console.log('========================================\n')
    
    console.log('Próximos passos:')
    console.log('1. Configure as variáveis de ambiente no servidor/Coolify:')
    console.log('   STORAGE_LOCATIONS=r2')
    console.log('   STORAGE_R2_DRIVER=r2')
    console.log('   STORAGE_R2_KEY=' + R2_ACCESS_KEY_ID)
    console.log('   STORAGE_R2_SECRET=' + R2_SECRET_ACCESS_KEY)
    console.log('   STORAGE_R2_BUCKET=' + R2_BUCKET)
    console.log('   STORAGE_R2_ENDPOINT=' + R2_ENDPOINT)
    console.log('   STORAGE_R2_ACCOUNT_ID=' + R2_ACCOUNT_ID)
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

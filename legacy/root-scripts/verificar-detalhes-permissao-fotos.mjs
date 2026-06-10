/**
 * Script para verificar detalhes da permissão de fotos
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

async function verificarPermissao() {
  console.log('2. Verificando permissão de leitura de fotos...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role Public
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  const publicRoleData = await publicRoleResponse.json()
  const publicRoleId = publicRoleData.data[0].id

  // Buscar policy
  const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRoleId}`, { headers })
  const accessData = await accessResponse.json()
  const policyId = accessData.data[0].policy

  // Buscar permissão
  const permResponse = await fetch(`${DIRECTUS_URL}/permissions/2`, { headers })
  if (!permResponse.ok) {
    console.log('   ❌ Erro ao buscar permissão')
    return
  }

  const permData = await permResponse.json()
  const perm = permData.data

  console.log(`   Permissão ID: ${perm.id}`)
  console.log(`   Collection: ${perm.collection}`)
  console.log(`   Action: ${perm.action}`)
  console.log(`   Policy: ${perm.policy}`)
  console.log(`   Permissions: ${JSON.stringify(perm.permissions, null, 2)}`)
  console.log(`   Fields: ${JSON.stringify(perm.fields, null, 2)}`)
  console.log('')
}

async function verificarStorageLocations() {
  console.log('3. Verificando storage locations...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Tentar buscar storage locations (pode não estar disponível via API)
  try {
    const storageResponse = await fetch(`${DIRECTUS_URL}/storage/locations`, { headers })
    if (storageResponse.ok) {
      const storageData = await storageResponse.json()
      console.log(`   Storage locations:`, JSON.stringify(storageData, null, 2))
    } else {
      console.log(`   ⚠️ Não foi possível buscar storage locations via API (${storageResponse.status})`)
      console.log(`   Verifique no admin do Directus: Settings → Storage`)
    }
  } catch (error) {
    console.log(`   ⚠️ Erro ao buscar storage: ${error.message}`)
  }
  console.log('')
}

async function testarArquivoEspecifico() {
  console.log('4. Testando arquivo específico...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar um arquivo
  const fileId = 'f630096e-fc16-428b-b944-ef39b4462fa3'
  const fileResponse = await fetch(`${DIRECTUS_URL}/files/${fileId}`, { headers })
  
  if (fileResponse.ok) {
    const fileData = await fileResponse.json()
    const file = fileData.data
    
    console.log(`   Arquivo ID: ${file.id}`)
    console.log(`   filename_download: ${file.filename_download}`)
    console.log(`   storage: ${file.storage}`)
    console.log(`   storage_location: ${file.storage_location}`)
    console.log(`   URL: ${DIRECTUS_URL}/assets/${file.id}`)
    console.log('')
    
    // Testar acesso público
    const publicResponse = await fetch(`${DIRECTUS_URL}/assets/${file.id}`, { method: 'HEAD' })
    console.log(`   Acesso público: ${publicResponse.status} ${publicResponse.statusText}`)
    
    // Testar com token
    const authResponse = await fetch(`${DIRECTUS_URL}/assets/${file.id}`, {
      method: 'HEAD',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    })
    console.log(`   Acesso com token: ${authResponse.status} ${authResponse.statusText}`)
  } else {
    console.log(`   ❌ Erro ao buscar arquivo: ${fileResponse.status}`)
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Detalhes da Permissão de Fotos')
  console.log('========================================\n')

  try {
    await login()
    await verificarPermissao()
    await verificarStorageLocations()
    await testarArquivoEspecifico()

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

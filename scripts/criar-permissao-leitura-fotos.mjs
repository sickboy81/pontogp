/**
 * Script para criar permissão de leitura de fotos para role Public
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

async function criarPermissaoLeituraFotos() {
  console.log('2. Criando permissão de leitura de fotos para role Public...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role Public
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  if (!publicRoleResponse.ok) {
    throw new Error(`Erro ao buscar role Public: ${publicRoleResponse.status}`)
  }

  const publicRoleData = await publicRoleResponse.json()
  if (!publicRoleData.data || publicRoleData.data.length === 0) {
    throw new Error('Role Public não encontrado')
  }

  const publicRoleId = publicRoleData.data[0].id
  console.log(`   Role Public ID: ${publicRoleId}`)

  // Buscar policy do role Public
  const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRoleId}`, { headers })
  if (!accessResponse.ok) {
    throw new Error(`Erro ao buscar access: ${accessResponse.status}`)
  }

  const accessData = await accessResponse.json()
  if (!accessData.data || accessData.data.length === 0) {
    throw new Error('Nenhuma policy encontrada para role Public')
  }

  const policyId = accessData.data[0].policy
  console.log(`   Policy ID: ${policyId}`)

  // Verificar se já existe permissão
  const existingPermsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files&filter[action][_eq]=read&filter[policy][_eq]=${policyId}`, { headers })
  if (existingPermsResponse.ok) {
    const existingPermsData = await existingPermsResponse.json()
    if (existingPermsData.data && existingPermsData.data.length > 0) {
      console.log(`   ⏭️  Permissão já existe (ID: ${existingPermsData.data[0].id})`)
      return
    }
  }

  // Criar permissão de leitura
  console.log(`   Criando permissão de leitura...`)
  const createPermResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      policy: policyId,
      collection: 'directus_files',
      action: 'read',
      permissions: {},
      fields: ['*'],
    }),
  })

  if (!createPermResponse.ok) {
    const error = await createPermResponse.json().catch(() => ({}))
    throw new Error(`Erro ao criar permissão: ${JSON.stringify(error)}`)
  }

  const permData = await createPermResponse.json()
  console.log(`   ✅ Permissão criada! ID: ${permData.data.id}`)
  console.log('')
}

async function testarAcesso() {
  console.log('3. Testando acesso às fotos...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/items/profiles?limit=1&fields=photos.*`, { headers })
  if (!response.ok) {
    console.log('   ⚠️ Erro ao buscar perfil')
    return
  }

  const data = await response.json()
  if (!data.data || data.data.length === 0 || !data.data[0].photos || data.data[0].photos.length === 0) {
    console.log('   ⚠️ Nenhuma foto encontrada para testar')
    return
  }

  const photoUrl = data.data[0].photos[0]
  console.log(`   Testando: ${photoUrl}`)
  
  // Testar sem autenticação (como navegador faria)
  const publicResponse = await fetch(photoUrl, { method: 'HEAD' })
  console.log(`   Status: ${publicResponse.status} ${publicResponse.statusText}`)
  
  if (publicResponse.ok) {
    console.log(`   ✅ Foto acessível publicamente!`)
  } else {
    console.log(`   ⚠️ Ainda retorna ${publicResponse.status}`)
    console.log(`   ⚠️ Pode ser necessário reiniciar o Directus`)
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Criar Permissão de Leitura de Fotos')
  console.log('========================================\n')

  try {
    await login()
    await criarPermissaoLeituraFotos()
    await testarAcesso()

    console.log('========================================')
    console.log('✅ Permissão criada!')
    console.log('========================================\n')
    
    console.log('⚠️ IMPORTANTE:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Limpe o cache do navegador')
    console.log('3. As fotos devem aparecer após o restart')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

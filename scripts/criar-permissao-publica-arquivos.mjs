/**
 * Script para criar permissão pública de leitura de arquivos
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

async function criarPermissaoPublicaArquivos() {
  console.log('2. Criando permissão pública para directus_files...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role Public
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  const publicRoleData = await publicRoleResponse.json()
  const publicRoleId = publicRoleData.data[0].id
  console.log(`   Role Public ID: ${publicRoleId}`)

  // Buscar policy do role Public
  const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRoleId}`, { headers })
  const accessData = await accessResponse.json()
  const publicPolicyId = accessData.data[0].policy
  console.log(`   Policy ID: ${publicPolicyId}`)

  // Verificar permissões existentes para directus_files
  const existingPerms = await fetch(
    `${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files&filter[policy][_eq]=${publicPolicyId}`,
    { headers }
  )
  const existingData = await existingPerms.json()
  console.log(`   Permissões existentes: ${existingData.data.length}`)

  // Deletar permissões antigas
  for (const perm of existingData.data) {
    await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
      method: 'DELETE',
      headers,
    })
    console.log(`      ❌ Deletada ${perm.id}`)
  }

  // Criar nova permissão
  console.log('   Criando nova permissão...')
  const response = await fetch(`${DIRECTUS_URL}/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      policy: publicPolicyId,
      collection: 'directus_files',
      action: 'read',
      permissions: null,
      fields: ['*'],
    }),
  })

  if (response.ok) {
    const result = await response.json()
    console.log(`   ✅ Permissão criada (ID: ${result.data.id})`)
  } else {
    const error = await response.json().catch(() => ({}))
    console.log(`   ❌ Erro: ${JSON.stringify(error)}`)
  }
  console.log('')
}

async function criarPermissaoUserArquivos() {
  console.log('3. Criando permissão para role User acessar arquivos...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role User
  const userRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=User`, { headers })
  const userRoleData = await userRoleResponse.json()
  const userRoleId = userRoleData.data[0].id
  console.log(`   Role User ID: ${userRoleId}`)

  // Buscar policy do role User
  const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${userRoleId}`, { headers })
  const accessData = await accessResponse.json()
  const userPolicyId = accessData.data[0].policy
  console.log(`   Policy ID: ${userPolicyId}`)

  // Verificar permissões existentes
  const existingPerms = await fetch(
    `${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files&filter[policy][_eq]=${userPolicyId}`,
    { headers }
  )
  const existingData = await existingPerms.json()
  console.log(`   Permissões existentes: ${existingData.data.length}`)

  // Deletar permissões antigas
  for (const perm of existingData.data) {
    await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
      method: 'DELETE',
      headers,
    })
    console.log(`      ❌ Deletada ${perm.id}`)
  }

  // Criar permissões de read e create
  const permissions = [
    { action: 'read', permissions: null },
    { action: 'create', permissions: null },
  ]

  for (const perm of permissions) {
    const response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: userPolicyId,
        collection: 'directus_files',
        action: perm.action,
        permissions: perm.permissions,
        fields: ['*'],
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`   ✅ directus_files.${perm.action} (ID: ${result.data.id})`)
    } else {
      const error = await response.json().catch(() => ({}))
      console.log(`   ❌ directus_files.${perm.action}: ${JSON.stringify(error)}`)
    }
  }
  console.log('')
}

async function testarAcessoArquivo() {
  console.log('4. Testando acesso a arquivo...\n')
  
  const fileId = 'f630096e-fc16-428b-b944-ef39b4462fa3'
  const fileUrl = `${DIRECTUS_URL}/assets/${fileId}`
  
  console.log(`   URL: ${fileUrl}`)
  
  // Teste público (sem autenticação)
  const publicResponse = await fetch(fileUrl, { method: 'HEAD' })
  console.log(`   Público: ${publicResponse.status} ${publicResponse.statusText}`)
  
  // Teste com token admin
  const adminResponse = await fetch(fileUrl, {
    method: 'HEAD',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  })
  console.log(`   Admin: ${adminResponse.status} ${adminResponse.statusText}`)
  
  const API_TOKEN = env.VITE_DIRECTUS_TOKEN
  if (API_TOKEN) {
    const apiResponse = await fetch(fileUrl, {
      method: 'HEAD',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    })
    console.log(`   API Token: ${apiResponse.status} ${apiResponse.statusText}`)
  }
  
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Criar Permissão Pública para Arquivos')
  console.log('========================================\n')

  try {
    await login()
    await criarPermissaoPublicaArquivos()
    await criarPermissaoUserArquivos()
    await testarAcessoArquivo()

    console.log('========================================')
    console.log('✅ Permissões criadas!')
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

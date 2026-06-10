/**
 * Script para forçar permissão de arquivos de forma mais agressiva
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

async function listarTodasPermissoesArquivos() {
  console.log('2. Listando TODAS as permissões de directus_files...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files`, { headers })
  const data = await response.json()

  console.log(`   Total: ${data.data.length} permissões`)
  
  for (const perm of data.data) {
    console.log(`\n   ID: ${perm.id}`)
    console.log(`      Action: ${perm.action}`)
    console.log(`      Policy: ${perm.policy}`)
    console.log(`      Permissions: ${JSON.stringify(perm.permissions)}`)
    console.log(`      Fields: ${JSON.stringify(perm.fields)}`)
  }
  console.log('')

  return data.data
}

async function listarTodasPolicies() {
  console.log('3. Listando todas as policies...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Listar roles
  const rolesResponse = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const rolesData = await rolesResponse.json()

  for (const role of rolesData.data) {
    console.log(`   Role: ${role.name} (ID: ${role.id})`)
    
    // Buscar access/policy
    const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${role.id}`, { headers })
    const accessData = await accessResponse.json()
    
    if (accessData.data && accessData.data.length > 0) {
      console.log(`      Policy: ${accessData.data[0].policy}`)
    } else {
      console.log(`      Policy: Nenhuma`)
    }
  }
  console.log('')
}

async function criarPermissaoEmTodasPolicies() {
  console.log('4. Criando permissão de leitura de arquivos em TODAS as policies...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar todas as policies
  const policiesResponse = await fetch(`${DIRECTUS_URL}/policies`, { headers })
  const policiesData = await policiesResponse.json()

  console.log(`   Total de policies: ${policiesData.data.length}`)

  for (const policy of policiesData.data) {
    console.log(`\n   Policy: ${policy.name || policy.id}`)
    
    // Verificar se já existe permissão
    const existingResponse = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files&filter[action][_eq]=read&filter[policy][_eq]=${policy.id}`,
      { headers }
    )
    const existingData = await existingResponse.json()

    if (existingData.data && existingData.data.length > 0) {
      console.log(`      ⏭️  Já existe permissão (ID: ${existingData.data[0].id})`)
      continue
    }

    // Criar permissão
    const createResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: policy.id,
        collection: 'directus_files',
        action: 'read',
        permissions: null,
        fields: ['*'],
      }),
    })

    if (createResponse.ok) {
      const result = await createResponse.json()
      console.log(`      ✅ Permissão criada (ID: ${result.data.id})`)
    } else {
      const error = await createResponse.json().catch(() => ({}))
      console.log(`      ❌ Erro: ${JSON.stringify(error)}`)
    }
  }
  console.log('')
}

async function testarAcesso() {
  console.log('5. Testando acesso...\n')
  
  const fileId = 'f630096e-fc16-428b-b944-ef39b4462fa3'
  
  // Público
  console.log('   Público (sem token):')
  const publicResponse = await fetch(`${DIRECTUS_URL}/assets/${fileId}`, { method: 'HEAD' })
  console.log(`      /assets: ${publicResponse.status}`)
  
  // Com API token
  const API_TOKEN = env.VITE_DIRECTUS_TOKEN
  if (API_TOKEN) {
    console.log('   Com API Token:')
    const apiResponse = await fetch(`${DIRECTUS_URL}/assets/${fileId}`, {
      method: 'HEAD',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    })
    console.log(`      /assets: ${apiResponse.status}`)
  }

  // Com admin token
  console.log('   Com Admin Token:')
  const adminResponse = await fetch(`${DIRECTUS_URL}/assets/${fileId}`, {
    method: 'HEAD',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  })
  console.log(`      /assets: ${adminResponse.status}`)
  
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Forçar Permissão de Arquivos')
  console.log('========================================\n')

  try {
    await login()
    await listarTodasPermissoesArquivos()
    await listarTodasPolicies()
    await criarPermissaoEmTodasPolicies()
    await listarTodasPermissoesArquivos()
    await testarAcesso()

    console.log('========================================')
    console.log('✅ Concluído!')
    console.log('========================================\n')
    
    console.log('⚠️ Se ainda der 403:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Verifique se PUBLIC_URL está configurado no Directus')
    console.log('3. Verifique as variáveis de ambiente do Directus')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

/**
 * Script para limpar todas as permissões duplicadas e recriar corretamente
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

async function limparPermissoesDuplicadas() {
  console.log('2. Limpando permissões duplicadas...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const collectionsParaLimpar = ['cities', 'user_favorites', 'notifications', 'settings']

  for (const collection of collectionsParaLimpar) {
    console.log(`   Limpando ${collection}...`)
    
    const permsResponse = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=${collection}`,
      { headers }
    )
    const permsData = await permsResponse.json()
    
    console.log(`      Encontradas: ${permsData.data.length} permissões`)
    
    for (const perm of permsData.data) {
      const deleteResponse = await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
        method: 'DELETE',
        headers,
      })
      
      if (deleteResponse.ok) {
        console.log(`      ❌ Deletada ${perm.id}`)
      }
    }
  }
  console.log('')
}

async function criarPermissoesLimpas() {
  console.log('3. Criando permissões limpas...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role User e sua policy
  console.log('   Buscando role User...')
  const userRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=User`, { headers })
  const userRoleData = await userRoleResponse.json()
  const userRoleId = userRoleData.data[0].id

  const userAccessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${userRoleId}`, { headers })
  const userAccessData = await userAccessResponse.json()
  const userPolicyId = userAccessData.data[0].policy
  console.log(`      Role User Policy: ${userPolicyId}`)

  // Buscar role Public e sua policy
  console.log('   Buscando role Public...')
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  const publicRoleData = await publicRoleResponse.json()
  const publicRoleId = publicRoleData.data[0].id

  const publicAccessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRoleId}`, { headers })
  const publicAccessData = await publicAccessResponse.json()
  const publicPolicyId = publicAccessData.data[0].policy
  console.log(`      Role Public Policy: ${publicPolicyId}`)
  console.log('')

  // Permissões para role User
  const userPermissions = [
    { collection: 'cities', action: 'read', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'read', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'create', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'update', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'delete', permissions: null, fields: ['*'] },
    { collection: 'notifications', action: 'read', permissions: null, fields: ['*'] },
    { collection: 'notifications', action: 'create', permissions: null, fields: ['*'] },
    { collection: 'notifications', action: 'update', permissions: null, fields: ['*'] },
    { collection: 'settings', action: 'read', permissions: null, fields: ['*'] },
  ]

  // Permissões para role Public
  const publicPermissions = [
    { collection: 'cities', action: 'read', permissions: null, fields: ['*'] },
    { collection: 'settings', action: 'read', permissions: null, fields: ['*'] },
  ]

  console.log('   Criando permissões para role User...')
  for (const perm of userPermissions) {
    const response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: userPolicyId,
        collection: perm.collection,
        action: perm.action,
        permissions: perm.permissions,
        fields: perm.fields,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`      ✅ ${perm.collection}.${perm.action} (ID: ${result.data.id})`)
    } else {
      const error = await response.json().catch(() => ({}))
      console.log(`      ❌ ${perm.collection}.${perm.action}: ${JSON.stringify(error)}`)
    }
  }

  console.log('   Criando permissões para role Public...')
  for (const perm of publicPermissions) {
    const response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: publicPolicyId,
        collection: perm.collection,
        action: perm.action,
        permissions: perm.permissions,
        fields: perm.fields,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`      ✅ ${perm.collection}.${perm.action} (ID: ${result.data.id})`)
    } else {
      const error = await response.json().catch(() => ({}))
      console.log(`      ❌ ${perm.collection}.${perm.action}: ${JSON.stringify(error)}`)
    }
  }
  console.log('')
}

async function testarPermissoes() {
  console.log('4. Testando permissões...\n')

  const API_TOKEN = env.VITE_DIRECTUS_TOKEN
  
  const collections = ['cities', 'user_favorites', 'notifications', 'settings']
  
  for (const collection of collections) {
    console.log(`   ${collection}:`)
    
    // Com API token
    const response = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=1`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    })
    console.log(`      API Token: ${response.status}`)
    
    // Com admin token
    const adminResponse = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    })
    console.log(`      Admin: ${adminResponse.status}`)
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Limpar Permissões Duplicadas')
  console.log('========================================\n')

  try {
    await login()
    await limparPermissoesDuplicadas()
    await criarPermissoesLimpas()
    await testarPermissoes()

    console.log('========================================')
    console.log('✅ Limpeza concluída!')
    console.log('========================================\n')
    
    console.log('⚠️ IMPORTANTE:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Limpe o cache do navegador')
    console.log('3. Faça logout/login no site')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

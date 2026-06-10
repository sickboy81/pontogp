/**
 * Script para verificar o role do usuário e criar permissões para esse role
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

const USER_ID = '2ea7ebb2-c6fd-4bf1-a592-08507a5fb4b9' // ID do usuário com erro

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

async function verificarUsuario() {
  console.log(`2. Verificando usuário ${USER_ID}...\n`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/users/${USER_ID}`, { headers })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar usuário: ${response.status}`)
  }

  const data = await response.json()
  const user = data.data

  console.log(`   ✅ Usuário: ${user.email}`)
  console.log(`   Role ID: ${user.role}`)
  console.log(`   Status: ${user.status}`)
  console.log('')

  return user.role
}

async function buscarRole(roleId) {
  console.log(`3. Buscando informações do role ${roleId}...\n`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/roles/${roleId}`, { headers })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar role: ${response.status}`)
  }

  const data = await response.json()
  const role = data.data

  console.log(`   ✅ Nome do Role: ${role.name}`)
  console.log(`   ID: ${role.id}`)
  console.log(`   Admin: ${role.admin_access ? 'Sim' : 'Não'}`)
  console.log(`   App Access: ${role.app_access ? 'Sim' : 'Não'}`)
  console.log('')

  return role
}

async function buscarPolicyDoRole(roleId) {
  console.log(`4. Buscando policy do role...\n`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${roleId}`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar access: ${response.status}`)
    return null
  }

  const data = await response.json()
  
  if (!data.data || data.data.length === 0) {
    console.log(`   ⚠️ Nenhuma policy/access encontrada para este role`)
    console.log(`   Isso pode significar que o role não tem permissões configuradas`)
    return null
  }

  const policyId = data.data[0].policy
  console.log(`   ✅ Policy ID: ${policyId}`)
  console.log(`   Total de access entries: ${data.data.length}`)
  console.log('')

  return policyId
}

async function criarPermissoesParaRole(policyId, roleId) {
  if (!policyId) {
    console.log('5. Criando nova policy para o role...\n')
    
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    }

    // Criar policy
    const policyResponse = await fetch(`${DIRECTUS_URL}/policies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `User Policy`,
        admin_access: false,
        app_access: true,
      }),
    })

    if (!policyResponse.ok) {
      const error = await policyResponse.text()
      throw new Error(`Erro ao criar policy: ${error}`)
    }

    const policyData = await policyResponse.json()
    policyId = policyData.data.id
    console.log(`   ✅ Policy criada: ${policyId}`)

    // Associar policy ao role
    const accessResponse = await fetch(`${DIRECTUS_URL}/access`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: roleId,
        policy: policyId,
      }),
    })

    if (!accessResponse.ok) {
      console.log(`   ⚠️ Não foi possível associar policy ao role via /access`)
    } else {
      console.log(`   ✅ Policy associada ao role`)
    }
    console.log('')
  }

  console.log(`6. Criando permissões para a policy ${policyId}...\n`)

  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const permissions = [
    { collection: 'notifications', action: 'read', permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } }, fields: ['*'] },
    { collection: 'notifications', action: 'create', presets: { user_id: '{{$CURRENT_USER.id}}' }, permissions: {}, fields: ['*'] },
    { collection: 'notifications', action: 'update', permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } }, fields: ['*'] },
    { collection: 'user_favorites', action: 'read', permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } }, fields: ['*'] },
    { collection: 'user_favorites', action: 'create', presets: { user_id: '{{$CURRENT_USER.id}}' }, permissions: {}, fields: ['*'] },
    { collection: 'user_favorites', action: 'update', permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } }, fields: ['*'] },
    { collection: 'user_favorites', action: 'delete', permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } }, fields: ['*'] },
    { collection: 'cities', action: 'read', permissions: {}, fields: ['*'] },
    { collection: 'settings', action: 'read', permissions: {}, fields: ['*'] },
    { collection: 'directus_files', action: 'create', permissions: {}, fields: ['*'] },
  ]

  for (const perm of permissions) {
    const permissionData = {
      policy: policyId,
      collection: perm.collection,
      action: perm.action,
      permissions: perm.permissions || {},
      presets: perm.presets || null,
      fields: perm.fields || ['*'],
    }

    const response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(permissionData),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`   ✅ ${perm.collection}.${perm.action} (ID: ${result.data.id})`)
    } else {
      const error = await response.json().catch(() => ({}))
      if (error.errors?.[0]?.message?.includes('already exists')) {
        console.log(`   ⏭️  ${perm.collection}.${perm.action} (já existe)`)
      } else {
        console.log(`   ❌ ${perm.collection}.${perm.action}: ${error.errors?.[0]?.message || JSON.stringify(error)}`)
      }
    }
  }

  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Role do Usuário')
  console.log('========================================\n')

  try {
    await login()
    const roleId = await verificarUsuario()
    const role = await buscarRole(roleId)
    const policyId = await buscarPolicyDoRole(roleId)
    await criarPermissoesParaRole(policyId, roleId)

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')
    
    console.log('⚠️ IMPORTANTE:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Faça logout/login no site')
    console.log('3. Os erros 403 devem desaparecer')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

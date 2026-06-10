/**
 * Script para LIMPAR todas as permissões problemáticas e recriar corretamente
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

async function getPolicyIdForAuthenticatedRole() {
  console.log('2. Buscando policy do role Authenticated...')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role Authenticated
  const roleRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Authenticated`, { headers })
  const roleData = await roleRes.json()
  
  if (!roleData.data || roleData.data.length === 0) {
    throw new Error('Role Authenticated não encontrado')
  }

  const role = roleData.data[0]
  console.log(`   ✅ Role: ${role.name} (${role.id})`)

  // Buscar policies do role
  const accessRes = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${role.id}`, { headers })
  const accessData = await accessRes.json()
  
  if (!accessData.data || accessData.data.length === 0) {
    throw new Error('Nenhum access/policy encontrado para o role')
  }

  const policyId = accessData.data[0].policy
  console.log(`   ✅ Policy ID: ${policyId}\n`)
  
  return policyId
}

async function limparPermissoesAntigas(policyId, collection) {
  console.log(`   🗑️  Limpando permissões antigas de ${collection}...`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar todas as permissões da collection para a policy
  const response = await fetch(
    `${DIRECTUS_URL}/permissions?filter[collection][_eq]=${collection}&filter[policy][_eq]=${policyId}`,
    { headers }
  )

  if (!response.ok) {
    console.log(`      ⚠️ Não foi possível buscar permissões`)
    return 0
  }

  const data = await response.json()
  const perms = data.data || []

  let deleted = 0
  for (const perm of perms) {
    const deleteRes = await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
      method: 'DELETE',
      headers,
    })

    if (deleteRes.ok) {
      deleted++
    }
  }

  console.log(`      ✅ ${deleted} permissão(ões) removida(s)`)
  return deleted
}

async function criarPermissao(policyId, collection, action, config = {}) {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const permissionData = {
    policy: policyId,
    collection,
    action,
    permissions: config.permissions || {},
    validation: config.validation || null,
    presets: config.presets || null,
    fields: config.fields || ['*'],
  }

  const response = await fetch(`${DIRECTUS_URL}/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(permissionData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.log(`      ❌ ${collection}.${action}: ${error.errors?.[0]?.message || JSON.stringify(error)}`)
    return false
  }

  const result = await response.json()
  console.log(`      ✅ ${collection}.${action} criada (ID: ${result.data.id})`)
  return true
}

async function recriarPermissoes(policyId) {
  console.log('3. Recriando permissões com sintaxe correta...\n')

  // Limpar e recriar: notifications
  console.log('   📋 notifications')
  await limparPermissoesAntigas(policyId, 'notifications')
  await criarPermissao(policyId, 'notifications', 'read', {
    permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
    fields: ['*'],
  })
  await criarPermissao(policyId, 'notifications', 'create', {
    presets: { user_id: '{{$CURRENT_USER.id}}' },
    permissions: {},
    fields: ['*'],
  })
  await criarPermissao(policyId, 'notifications', 'update', {
    permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
    fields: ['*'],
  })

  // Limpar e recriar: user_favorites
  console.log('\n   📋 user_favorites')
  await limparPermissoesAntigas(policyId, 'user_favorites')
  await criarPermissao(policyId, 'user_favorites', 'read', {
    permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
    fields: ['*'],
  })
  await criarPermissao(policyId, 'user_favorites', 'create', {
    presets: { user_id: '{{$CURRENT_USER.id}}' },
    permissions: {},
    fields: ['*'],
  })
  await criarPermissao(policyId, 'user_favorites', 'update', {
    permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
    fields: ['*'],
  })
  await criarPermissao(policyId, 'user_favorites', 'delete', {
    permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
    fields: ['*'],
  })

  // Limpar e recriar: cities
  console.log('\n   📋 cities')
  await limparPermissoesAntigas(policyId, 'cities')
  await criarPermissao(policyId, 'cities', 'read', {
    permissions: {},
    fields: ['*'],
  })

  // Limpar e recriar: settings
  console.log('\n   📋 settings')
  await limparPermissoesAntigas(policyId, 'settings')
  await criarPermissao(policyId, 'settings', 'read', {
    permissions: {},
    fields: ['*'],
  })

  // Limpar e recriar: directus_files
  console.log('\n   📋 directus_files')
  await limparPermissoesAntigas(policyId, 'directus_files')
  await criarPermissao(policyId, 'directus_files', 'create', {
    permissions: {},
    fields: ['*'],
  })

  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Limpar e Recriar Permissões')
  console.log('========================================\n')

  try {
    await login()
    const policyId = await getPolicyIdForAuthenticatedRole()
    await recriarPermissoes(policyId)

    console.log('========================================')
    console.log('✅ Permissões recriadas com sucesso!')
    console.log('========================================\n')
    
    console.log('⚠️ IMPORTANTE - Faça AGORA:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('   - Vá para o serviço Directus')
    console.log('   - Clique em "Restart"')
    console.log('   - Aguarde 1-2 minutos')
    console.log('')
    console.log('2. Faça logout/login no site')
    console.log('   - Faça logout')
    console.log('   - Faça login novamente')
    console.log('')
    console.log('3. Os erros 403 devem desaparecer')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

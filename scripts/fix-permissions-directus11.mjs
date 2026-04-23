/**
 * Script para Configurar Permissões no Directus 11
 * 
 * No Directus 11, a estrutura mudou:
 * - Roles têm Policies
 * - Permissions pertencem a Policies (não diretamente a Roles)
 * 
 * Estrutura: Role -> Policy -> Permissions
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

async function getAuthenticatedRole() {
  console.log('2. Buscando role "Authenticated"...')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const data = await response.json()
  
  const role = data.data.find(r => 
    r.name === 'Authenticated' || r.name === 'authenticated' ||
    r.name === 'User' || r.name === 'user'
  )

  if (!role) {
    throw new Error('Role "Authenticated" não encontrado')
  }

  console.log(`   ✅ Role: ${role.name} (${role.id})\n`)
  return role
}

async function getPoliciesForRole(roleId) {
  console.log('3. Buscando policies do role...')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // No Directus 11, policies são associadas aos roles via directus_access
  const response = await fetch(
    `${DIRECTUS_URL}/access?filter[role][_eq]=${roleId}`,
    { headers }
  )

  if (!response.ok) {
    // Se /access não existe, tenta buscar policies diretamente
    console.log('   ⚠️ Endpoint /access não encontrado, buscando policies...')
    
    const policiesRes = await fetch(`${DIRECTUS_URL}/policies`, { headers })
    if (policiesRes.ok) {
      const policiesData = await policiesRes.json()
      console.log(`   Total de policies: ${policiesData.data?.length || 0}`)
      
      if (policiesData.data && policiesData.data.length > 0) {
        policiesData.data.forEach(p => {
          console.log(`      - ${p.name} (${p.id})`)
        })
      }
      
      // Procurar policy do role Authenticated
      const authPolicy = policiesData.data?.find(p => 
        p.name?.toLowerCase().includes('authenticated') ||
        p.name?.toLowerCase().includes('user')
      )
      
      if (authPolicy) {
        console.log(`   ✅ Policy encontrada: ${authPolicy.name} (${authPolicy.id})\n`)
        return [authPolicy]
      }
    }
    
    return []
  }

  const data = await response.json()
  console.log(`   Encontradas: ${data.data?.length || 0} entradas de acesso`)
  
  if (data.data && data.data.length > 0) {
    const policyIds = data.data.map(a => a.policy).filter(Boolean)
    console.log(`   Policy IDs: ${policyIds.join(', ')}\n`)
    return policyIds.map(id => ({ id }))
  }
  
  return []
}

async function createPolicyForRole(roleId, roleName) {
  console.log('4. Criando nova policy para o role...')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Criar policy
  const policyResponse = await fetch(`${DIRECTUS_URL}/policies`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `${roleName} Policy`,
      admin_access: false,
      app_access: true,
    }),
  })

  if (!policyResponse.ok) {
    const error = await policyResponse.text()
    throw new Error(`Erro ao criar policy: ${error}`)
  }

  const policyData = await policyResponse.json()
  const policyId = policyData.data.id
  console.log(`   ✅ Policy criada: ${policyId}`)

  // Associar policy ao role via /access
  const accessResponse = await fetch(`${DIRECTUS_URL}/access`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      role: roleId,
      policy: policyId,
    }),
  })

  if (!accessResponse.ok) {
    const error = await accessResponse.text()
    console.log(`   ⚠️ Não foi possível associar via /access: ${error}`)
    // Tentar associar diretamente no role
    const roleUpdateRes = await fetch(`${DIRECTUS_URL}/roles/${roleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        policies: [policyId],
      }),
    })
    
    if (!roleUpdateRes.ok) {
      console.log(`   ⚠️ Não foi possível associar via /roles`)
    } else {
      console.log(`   ✅ Policy associada ao role via /roles`)
    }
  } else {
    console.log(`   ✅ Policy associada ao role via /access`)
  }

  console.log('')
  return { id: policyId }
}

async function createPermission(policyId, collection, action, config = {}) {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Verificar se permissão já existe
  const checkRes = await fetch(
    `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}`,
    { headers }
  )

  let permissionId = null
  if (checkRes.ok) {
    const checkData = await checkRes.json()
    if (checkData.data && checkData.data.length > 0) {
      permissionId = checkData.data[0].id
    }
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

  let response
  if (permissionId) {
    // Atualizar permissão existente
    response = await fetch(`${DIRECTUS_URL}/permissions/${permissionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(permissionData),
    })
  } else {
    // Criar nova permissão
    response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(permissionData),
    })
  }

  if (!response.ok) {
    const error = await response.text()
    console.log(`      ❌ ${collection}.${action}: ${error}`)
    return false
  }

  const result = await response.json()
  if (permissionId) {
    console.log(`      ✅ ${collection}.${action} atualizada (ID: ${permissionId})`)
  } else {
    console.log(`      ✅ ${collection}.${action} criada (ID: ${result.data.id})`)
  }
  return true
}

async function main() {
  console.log('========================================')
  console.log('Configurar Permissões - Directus 11')
  console.log('========================================\n')

  try {
    await login()
    
    const role = await getAuthenticatedRole()
    let policies = await getPoliciesForRole(role.id)
    
    let policyId
    
    if (policies.length === 0) {
      console.log('   ⚠️ Nenhuma policy encontrada para o role')
      const newPolicy = await createPolicyForRole(role.id, role.name)
      policyId = newPolicy.id
    } else {
      policyId = policies[0].id
      console.log(`   Usando policy: ${policyId}\n`)
    }

    console.log('5. Configurando permissões...\n')

    // Upload de arquivos
    console.log('   📁 directus_files')
    await createPermission(policyId, 'directus_files', 'create', {
      fields: ['*'],
    })

    // Notificações
    console.log('\n   🔔 notifications')
    await createPermission(policyId, 'notifications', 'read', {
      permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
      fields: ['*'],
    })
    await createPermission(policyId, 'notifications', 'create', {
      presets: { user_id: '{{$CURRENT_USER.id}}' },
      fields: ['*'],
    })
    await createPermission(policyId, 'notifications', 'update', {
      permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
      fields: ['*'],
    })

    // Favoritos
    console.log('\n   ⭐ user_favorites')
    await createPermission(policyId, 'user_favorites', 'read', {
      permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
      fields: ['*'],
    })
    await createPermission(policyId, 'user_favorites', 'create', {
      presets: { user_id: '{{$CURRENT_USER.id}}' },
      fields: ['*'],
    })
    await createPermission(policyId, 'user_favorites', 'update', {
      permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
      fields: ['*'],
    })
    await createPermission(policyId, 'user_favorites', 'delete', {
      permissions: { user_id: { _eq: '{{$CURRENT_USER.id}}' } },
      fields: ['*'],
    })

    // Cidades
    console.log('\n   🏙️  cities')
    await createPermission(policyId, 'cities', 'read', {
      fields: ['*'],
    })

    // Settings
    console.log('\n   ⚙️  settings')
    await createPermission(policyId, 'settings', 'read', {
      fields: ['*'],
    })

    console.log('\n========================================')
    console.log('✅ Permissões configuradas!')
    console.log('========================================\n')
    
    console.log('Próximos passos:')
    console.log('1. Teste fazendo login com um usuário verificado')
    console.log('2. Tente fazer upload de fotos')
    console.log('3. Os erros 403 devem desaparecer')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
  }
}

main()

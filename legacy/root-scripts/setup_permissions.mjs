#!/usr/bin/env node
/**
 * Script para configurar permissões automaticamente nas collections
 */

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

let accessToken = ''

async function login() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.data.access_token
    console.log('✅ Login realizado com sucesso!')
    return accessToken
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message)
    throw error
  }
}

async function getRoles() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/roles?fields=id,name`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get roles: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('❌ Erro ao buscar roles:', error.message)
    return []
  }
}

async function findRoleByName(roles, name) {
  return roles.find(r => r.name === name || r.name === 'Public' && name === 'Public' || r.id === 'a2c8e50d-7f4a-49b1-b6c5-8e5f3d7c9a8e' && name === 'Public')
}

async function createPermission(collection, roleId, action, permission = {}) {
  try {
    // Verifica se a permissão já existe
    const checkResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=${collection}&filter[role][_eq]=${roleId}&filter[action][_eq]=${action}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (checkResponse.ok) {
      const data = await checkResponse.json()
      if (data.data && data.data.length > 0) {
        // Atualiza a permissão existente
        const permId = data.data[0].id
        const updateResponse = await fetch(`${DIRECTUS_URL}/permissions/${permId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(permission),
        })

        if (updateResponse.ok) {
          console.log(`  ✅ Permissão "${action}" atualizada para ${collection}`)
          return true
        }
      }
    }

    // Cria nova permissão
    const createResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection,
        role: roleId,
        action,
        ...permission,
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      throw new Error(errorData.errors?.[0]?.message || `HTTP ${createResponse.status}`)
    }

    console.log(`  ✅ Permissão "${action}" criada para ${collection}`)
    return true
  } catch (error) {
    console.error(`  ❌ Erro ao criar permissão "${action}" para ${collection}:`, error.message)
    return false
  }
}

async function setupPermissionsForRole(roleName, roleId, permissions) {
  console.log(`\n📦 Configurando permissões para role: ${roleName}`)

  for (const perm of permissions) {
    await createPermission(perm.collection, roleId, perm.action, perm.permission || {})
  }
}

async function main() {
  console.log('🚀 Iniciando configuração de permissões...\n')

  try {
    await login()

    const roles = await getRoles()
    console.log(`\n📋 Roles encontradas: ${roles.map(r => r.name).join(', ')}`)

    // Encontra os IDs das roles
    const publicRole = roles.find(r => r.name === 'Public' || r.id === 'a2c8e50d-7f4a-49b1-b6c5-8e5f3d7c9a8e')
    const authenticatedRole = roles.find(r => r.name === 'Authenticated')
    const adminRole = roles.find(r => r.name === 'Administrator' || r.name === 'Administrators')

    if (!publicRole) {
      console.log('⚠️  Role "Public" não encontrada. Pulando permissões públicas.')
    } else {
      await setupPermissionsForRole('Public', publicRole.id, [
        { collection: 'profiles', action: 'read', permission: { permissions: {}, validation: { status: { _eq: 'active' } } } },
        { collection: 'plans', action: 'read', permission: { permissions: {}, validation: {} } },
      ])
    }

    if (!authenticatedRole) {
      console.log('⚠️  Role "Authenticated" não encontrada. Pulando permissões autenticadas.')
    } else {
      await setupPermissionsForRole('Authenticated', authenticatedRole.id, [
        { collection: 'profiles', action: 'read', permission: { permissions: {}, validation: {} } },
        { collection: 'profiles', action: 'create', permission: { permissions: {}, validation: { user_id: { _eq: '$CURRENT_USER.id' } } } },
        { collection: 'profiles', action: 'update', permission: { permissions: {}, validation: { user_id: { _eq: '$CURRENT_USER.id' } } } },
        { collection: 'verification_requests', action: 'create', permission: { permissions: {}, validation: { user_id: { _eq: '$CURRENT_USER.id' } } } },
        { collection: 'verification_requests', action: 'read', permission: { permissions: {}, validation: { user_id: { _eq: '$CURRENT_USER.id' } } } },
        { collection: 'contacts', action: 'create', permission: { permissions: {}, validation: {} } },
      ])
    }

    if (!adminRole) {
      console.log('⚠️  Role "Administrator" não encontrada. Pulando permissões de admin.')
    } else {
      console.log(`\n📦 Configurando permissões completas para role: Administrator`)
      const collections = ['settings', 'verification_requests', 'plans', 'subscriptions', 'reports', 'contacts', 'profiles']
      const actions = ['create', 'read', 'update', 'delete']
      
      for (const collection of collections) {
        for (const action of actions) {
          await createPermission(collection, adminRole.id, action, { permissions: {}, validation: {} })
        }
      }
    }

    console.log('\n✅ Configuração de permissões finalizada!')
    console.log('\nℹ️  Nota: Algumas permissões podem precisar de ajustes manuais no painel admin')

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error.message)
    console.log('\nℹ️  Permissões precisam ser configuradas manualmente no painel admin')
    process.exit(1)
  }
}

main()

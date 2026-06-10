#!/usr/bin/env node
/**
 * Script para configurar permissões das collections de mensagens e notificações no Directus 11
 * Executa: node scripts/setup_messages_notifications_permissions.mjs
 */

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

let headers = {}

async function login() {
  console.log('🔐 Fazendo login...')
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  
  if (!response.ok) {
    throw new Error(`Login falhou: ${response.status}`)
  }
  
  const data = await response.json()
  const token = data.data.access_token
  headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
  console.log('✅ Login realizado!\n')
  return token
}

async function findPolicyByName(name) {
  const response = await fetch(`${DIRECTUS_URL}/policies`, { headers })
  const data = await response.json()
  const policies = data.data || []
  
  const policy = policies.find(p => p.name === name)
  return policy
}

async function createOrUpdatePermission(policyId, collection, action, fields = ['*'], permissions = null) {
  // Busca permissão existente
  const searchRes = await fetch(
    `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}`,
    { headers }
  )
  const searchData = await searchRes.json()
  const existing = searchData.data?.[0]

  const body = {
    policy: policyId,
    collection: collection,
    action: action,
    fields: fields
  }
  
  if (permissions) {
    body.permissions = permissions
  }

  let response
  if (existing) {
    console.log(`  🔄 Atualizando: ${collection} (${action})`)
    response = await fetch(`${DIRECTUS_URL}/permissions/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    })
  } else {
    console.log(`  ➕ Criando: ${collection} (${action})`)
    response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  }

  if (response.ok) {
    console.log(`  ✅ Sucesso!`)
    return true
  } else {
    const err = await response.json().catch(() => ({}))
    console.error(`  ❌ Erro: ${JSON.stringify(err)}`)
    return false
  }
}

async function main() {
  console.log('🚀 Configurando permissões para mensagens e notificações\n')

  try {
    await login()
    
    // Buscar a policy "App Authenticated Access" pelo nome
    console.log('📋 Buscando policy "App Authenticated Access"...')
    let policy = await findPolicyByName('App Authenticated Access')
    
    if (!policy) {
      console.log('⚠️ "App Authenticated Access" não encontrada, tentando "Authenticated Access Policy"...')
      policy = await findPolicyByName('Authenticated Access Policy')
    }
    
    if (!policy) {
      console.log('⚠️ Nenhuma policy encontrada, tentando "User App Access"...')
      policy = await findPolicyByName('User App Access')
    }

    if (!policy) {
      throw new Error('Nenhuma policy de authenticated encontrada')
    }

    const policyId = policy.id
    console.log(`✅ Policy encontrada: ${policy.name} (${policyId})\n`)

    // Permissões para MESSAGES
    console.log('📧 Configurando "messages":')
    await createOrUpdatePermission(policyId, 'messages', 'create', ['*'], {
      sender_id: { _eq: '$CURRENT_USER.id' }
    })
    await createOrUpdatePermission(policyId, 'messages', 'read', ['*'], {
      _or: [
        { sender_id: { _eq: '$CURRENT_USER.id' } },
        { recipient_id: { _eq: '$CURRENT_USER.id' } }
      ]
    })
    await createOrUpdatePermission(policyId, 'messages', 'update', ['read', 'read_at'], {
      recipient_id: { _eq: '$CURRENT_USER.id' }
    })

    // Permissões para NOTIFICATIONS
    console.log('\n🔔 Configurando "notifications":')
    await createOrUpdatePermission(policyId, 'notifications', 'create', ['*'], {
      user_id: { _eq: '$CURRENT_USER.id' }
    })
    await createOrUpdatePermission(policyId, 'notifications', 'read', ['*'], {
      user_id: { _eq: '$CURRENT_USER.id' }
    })
    await createOrUpdatePermission(policyId, 'notifications', 'update', ['read', 'read_at'], {
      user_id: { _eq: '$CURRENT_USER.id' }
    })

    console.log('\n✅ Permissões configuradas com sucesso!')
    console.log('\n📝 Resumo:')
    console.log('- Usuários autenticados podem criar, ler e atualizar suas mensagens')
    console.log('- Usuários autenticados podem criar, ler e atualizar suas notificações')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

main()

/**
 * Script para Configurar Permissões do Role "User" ou "Authenticated"
 * 
 * Este script configura automaticamente as permissões necessárias para usuários verificados:
 * - Upload de arquivos (directus_files)
 * - Notificações (notifications)
 * - Favoritos (user_favorites)
 * - Cidades (cities)
 * - Settings (settings)
 * 
 * Uso: node scripts/fix-user-role-permissions.mjs
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
  console.error('❌ ERRO: Variáveis de ambiente não definidas!')
  console.error('   Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD no arquivo .env')
  process.exit(1)
}

let adminToken = null

// Função para fazer login
async function login() {
  console.log('1. Fazendo login...')
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
      const error = await response.json().catch(() => ({}))
      throw new Error(`Login falhou: ${response.status} - ${error?.errors?.[0]?.message || response.statusText}`)
    }

    const data = await response.json()
    adminToken = data.data.access_token
    console.log('   ✅ Login realizado com sucesso')
    return adminToken
  } catch (error) {
    console.error('   ❌ Erro no login:', error.message)
    throw error
  }
}

// Função para buscar roles
async function getRoles() {
  console.log('\n2. Buscando roles...')
  try {
    const response = await fetch(`${DIRECTUS_URL}/roles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar roles: ${response.status}`)
    }

    const data = await response.json()
    const roles = data.data || []
    
    // Procurar por "User" ou "Authenticated"
    const userRole = roles.find(r => 
      r.name === 'User' || 
      r.name === 'user' || 
      r.name === 'Authenticated' || 
      r.name === 'authenticated'
    )

    if (!userRole) {
      console.error('   ❌ Role "User" ou "Authenticated" não encontrado!')
      console.log('   Roles disponíveis:')
      roles.forEach(r => console.log(`      - ${r.name} (${r.id})`))
      throw new Error('Role não encontrado')
    }

    console.log(`   ✅ Role encontrado: ${userRole.name} (${userRole.id})`)
    return userRole
  } catch (error) {
    console.error('   ❌ Erro ao buscar roles:', error.message)
    throw error
  }
}

// Função para obter uma policy existente do role
async function getPolicyId(roleId) {
  try {
    // Buscar uma permissão existente do role para pegar a policy
    const response = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${roleId}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data && data.data.length > 0 && data.data[0].policy) {
        return data.data[0].policy
      }
    }

    // Se não encontrar, buscar de outra collection conhecida (profiles geralmente tem)
    const profilesResponse = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=profiles&filter[action][_eq]=read&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (profilesResponse.ok) {
      const profilesData = await profilesResponse.json()
      if (profilesData.data && profilesData.data.length > 0 && profilesData.data[0].policy) {
        return profilesData.data[0].policy
      }
    }

    return null
  } catch (error) {
    console.error('   ⚠️  Erro ao buscar policy:', error.message)
    return null
  }
}

// Função para criar/atualizar permissão
async function setPermission(roleId, collection, action, config = {}) {
  try {
    // Obter policy ID
    const policyId = await getPolicyId(roleId)
    if (!policyId) {
      throw new Error('Não foi possível obter policy ID. Configure permissões manualmente.')
    }

    // Buscar permissão existente
    const searchResponse = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${roleId}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    let permissionId = null
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.data && searchData.data.length > 0) {
        permissionId = searchData.data[0].id
      }
    }

    // No Directus 11, o role pode precisar ser enviado como string UUID
    const permissionData = {
      role: roleId,
      collection,
      action,
      policy: policyId,
      permissions: config.permissions || {},
      validation: config.validation || null,
      presets: config.presets || null,
      fields: config.fields || ['*'],
    }
    
    // Remover campos undefined
    Object.keys(permissionData).forEach(key => {
      if (permissionData[key] === undefined) {
        delete permissionData[key]
      }
    })

    let response
    if (permissionId) {
      // Atualizar permissão existente
      response = await fetch(`${DIRECTUS_URL}/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissionData),
      })
    } else {
      // Criar nova permissão
      response = await fetch(`${DIRECTUS_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissionData),
      })
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      let errorMessage = `Erro ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData?.errors?.[0]?.message || errorMessage
      } catch {
        if (errorText) errorMessage = errorText
      }
      console.error(`   ❌ Erro ao ${permissionId ? 'atualizar' : 'criar'} permissão:`, errorMessage)
      console.error(`   Resposta completa:`, errorText.substring(0, 500))
      throw new Error(errorMessage)
    }

    const result = await response.json().catch(() => ({}))
    if (result.data) {
      console.log(`   ✅ Permissão ${permissionId ? 'atualizada' : 'criada'} com ID: ${result.data.id}`)
      return true
    }
    
    // Se não tem data mas status é 204 (No Content), também é sucesso
    if (response.status === 204) {
      console.log(`   ✅ Permissão ${permissionId ? 'atualizada' : 'criada'} (204 No Content)`)
      return true
    }
    
    console.error(`   ⚠️  Resposta inesperada:`, JSON.stringify(result).substring(0, 200))
    throw new Error('Resposta inválida do servidor')
  } catch (error) {
    console.error(`   ❌ Erro ao configurar permissão ${collection}.${action}:`, error.message)
    throw error // Re-throw para parar o script
  }
}

// Função principal
async function main() {
  console.log('========================================')
  console.log('Configurar Permissões do Role User')
  console.log('========================================\n')

  try {
    // 1. Login
    await login()

    // 2. Buscar role
    const userRole = await getRoles()

    console.log(`\n3. Configurando permissões para role "${userRole.name}"...\n`)

    // 3. Configurar permissões

    // 3.1. directus_files - Create (upload de arquivos)
    console.log('   📁 directus_files - Create (upload)')
    try {
      await setPermission(userRole.id, 'directus_files', 'create', {
        permissions: {},
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    // 3.2. notifications - Read/Write (apenas próprias)
    console.log('\n   🔔 notifications - Read')
    try {
      await setPermission(userRole.id, 'notifications', 'read', {
        permissions: {
          user_id: {
            _eq: '{{$CURRENT_USER.id}}',
          },
        },
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    console.log('   🔔 notifications - Create')
    try {
      await setPermission(userRole.id, 'notifications', 'create', {
        permissions: {},
        validation: {},
        presets: {
          user_id: '{{$CURRENT_USER.id}}',
        },
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    console.log('   🔔 notifications - Update')
    try {
      await setPermission(userRole.id, 'notifications', 'update', {
        permissions: {
          user_id: {
            _eq: '{{$CURRENT_USER.id}}',
          },
        },
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    // 3.3. user_favorites - Read/Write/Delete (apenas próprias)
    console.log('\n   ⭐ user_favorites - Read')
    try {
      await setPermission(userRole.id, 'user_favorites', 'read', {
        permissions: {
          user_id: {
            _eq: '{{$CURRENT_USER.id}}',
          },
        },
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    console.log('   ⭐ user_favorites - Create')
    try {
      await setPermission(userRole.id, 'user_favorites', 'create', {
        permissions: {},
        validation: {},
        presets: {
          user_id: '{{$CURRENT_USER.id}}',
        },
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    console.log('   ⭐ user_favorites - Update')
    try {
      await setPermission(userRole.id, 'user_favorites', 'update', {
        permissions: {
          user_id: {
            _eq: '{{$CURRENT_USER.id}}',
          },
        },
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    console.log('   ⭐ user_favorites - Delete')
    try {
      await setPermission(userRole.id, 'user_favorites', 'delete', {
        permissions: {
          user_id: {
            _eq: '{{$CURRENT_USER.id}}',
          },
        },
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    // 3.4. cities - Read (público)
    console.log('\n   🏙️  cities - Read')
    try {
      await setPermission(userRole.id, 'cities', 'read', {
        permissions: {},
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`)
      throw error
    }

    // 3.5. settings - Read (público, opcional)
    console.log('\n   ⚙️  settings - Read')
    try {
      await setPermission(userRole.id, 'settings', 'read', {
        permissions: {},
        validation: {},
        presets: {},
        fields: ['*'],
      })
      console.log('      ✅ Configurado')
    } catch (error) {
      console.log(`      ⚠️  Falhou (opcional): ${error.message}`)
      // Não lança erro para settings pois é opcional
    }

    console.log('\n========================================')
    console.log('✅ Permissões configuradas com sucesso!')
    console.log('========================================\n')
    console.log('As seguintes permissões foram configuradas:')
    console.log('  ✅ Upload de arquivos (directus_files)')
    console.log('  ✅ Notificações (notifications) - apenas próprias')
    console.log('  ✅ Favoritos (user_favorites) - apenas próprios')
    console.log('  ✅ Cidades (cities) - leitura pública')
    console.log('  ✅ Settings (settings) - leitura pública')
    console.log('\n🎉 Os erros 403 devem estar resolvidos agora!')
    console.log('   Teste fazendo login e tentando fazer upload de fotos.')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
  }
}

// Executar
main()

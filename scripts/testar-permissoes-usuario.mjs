/**
 * Script para testar permissões com um usuário real
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
  console.log('1. Fazendo login como admin...')
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

async function buscarUsuario(userId) {
  console.log(`2. Buscando usuário ${userId}...\n`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/users/${userId}`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar usuário: ${response.status}`)
    return null
  }

  const data = await response.json()
  console.log(`   ✅ Usuário encontrado: ${data.data.email}`)
  console.log(`   Role: ${data.data.role?.name || data.data.role || 'N/A'}`)
  console.log('')
  return data.data
}

async function testarPermissoesComUsuario(userId) {
  console.log(`3. Testando permissões com token do usuário ${userId}...\n`)
  
  // Primeiro, precisamos fazer login como esse usuário
  // Mas não temos a senha, então vamos usar o token admin para criar um token temporário
  // Ou melhor, vamos verificar as permissões diretamente via API admin
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar permissões do role Authenticated
  const roleRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Authenticated`, { headers })
  if (!roleRes.ok) {
    console.error('   ❌ Erro ao buscar role')
    return
  }

  const roleData = await roleRes.json()
  if (!roleData.data || roleData.data.length === 0) {
    console.error('   ❌ Role Authenticated não encontrado')
    return
  }

  const role = roleData.data[0]
  console.log(`   Role ID: ${role.id}`)

  // Buscar policies do role
  const accessRes = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${role.id}`, { headers })
  if (!accessRes.ok) {
    console.error('   ❌ Erro ao buscar access')
    return
  }

  const accessData = await accessRes.json()
  console.log(`   Policies encontradas: ${accessData.data?.length || 0}`)

  if (accessData.data && accessData.data.length > 0) {
    const policyIds = accessData.data.map(a => a.policy).filter(Boolean)
    console.log(`   Policy IDs: ${policyIds.join(', ')}`)

    // Para cada policy, buscar permissões
    for (const policyId of policyIds) {
      console.log(`\n   📋 Verificando permissões da policy ${policyId}...`)
      
      const permRes = await fetch(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}`, { headers })
      if (permRes.ok) {
        const permData = await permRes.json()
        
        // Filtrar permissões relevantes
        const relevantPerms = permData.data?.filter(p => 
          ['notifications', 'user_favorites', 'cities'].includes(p.collection)
        ) || []

        if (relevantPerms.length > 0) {
          relevantPerms.forEach(perm => {
            console.log(`      ✅ ${perm.collection}.${perm.action}`)
            console.log(`         Fields: ${JSON.stringify(perm.fields)}`)
            console.log(`         Permissions: ${JSON.stringify(perm.permissions)}`)
          })
        }
      }
    }
  }
  console.log('')
}

async function testarRequisicaoComTokenUsuario(userId) {
  console.log(`4. Tentando simular requisição como usuário...\n`)
  
  // Não podemos fazer login como o usuário sem a senha
  // Mas podemos verificar se as permissões estão configuradas corretamente
  // verificando a sintaxe dos filtros
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Verificar permissões específicas
  const collections = ['notifications', 'user_favorites', 'cities']
  
  for (const collection of collections) {
    console.log(`   📋 Verificando permissões de ${collection}...`)
    
    const permRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=${collection}&filter[action][_eq]=read`,
      { headers }
    )
    
    if (permRes.ok) {
      const permData = await permRes.json()
      const authPerms = permData.data?.filter(p => {
        // Verificar se a permissão está associada ao role Authenticated
        // Isso é complicado sem saber qual policy pertence ao Authenticated
        return true // Por enquanto, mostrar todas
      }) || []

      if (authPerms.length > 0) {
        authPerms.forEach(perm => {
          console.log(`      ✅ ${perm.collection}.${perm.action} (ID: ${perm.id})`)
          console.log(`         Policy: ${perm.policy}`)
          console.log(`         Permissions filter: ${JSON.stringify(perm.permissions)}`)
          
          // Verificar se o filtro está correto
          if (perm.permissions && Object.keys(perm.permissions).length > 0) {
            const filter = JSON.stringify(perm.permissions)
            if (filter.includes('$CURRENT_USER') || filter.includes('{{$CURRENT_USER')) {
              console.log(`         ⚠️ Filtro pode estar com sintaxe incorreta`)
              console.log(`         Deve usar: {{$CURRENT_USER.id}}`)
            }
          }
        })
      } else {
        console.log(`      ❌ Nenhuma permissão READ encontrada para ${collection}`)
      }
    }
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Testar Permissões de Usuário')
  console.log('========================================\n')

  // ID do usuário dos erros
  const userId = '2ea7ebb2-c6fd-4bf1-a592-08507a5fb4b9'

  try {
    await login()
    await buscarUsuario(userId)
    await testarPermissoesComUsuario(userId)
    await testarRequisicaoComTokenUsuario(userId)

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')
    
    console.log('⚠️ IMPORTANTE:')
    console.log('1. O usuário precisa fazer LOGOUT e LOGIN novamente')
    console.log('2. O Directus pode precisar ser reiniciado')
    console.log('3. Verifique se os filtros de permissão estão usando {{$CURRENT_USER.id}}')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

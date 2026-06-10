/**
 * Script para verificar e corrigir permissão de cities
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

async function verificarPermissoesCities() {
  console.log('2. Verificando permissões de cities...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar TODAS as permissões para cities
  const permsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=cities`, { headers })
  const permsData = await permsResponse.json()

  console.log(`   Total de permissões para cities: ${permsData.data.length}`)
  
  for (const perm of permsData.data) {
    console.log(`\n   📋 cities.${perm.action}`)
    console.log(`      ID: ${perm.id}`)
    console.log(`      Policy: ${perm.policy}`)
    console.log(`      Role: ${perm.role}`)
    console.log(`      Permissions: ${JSON.stringify(perm.permissions)}`)
  }
  console.log('')

  return permsData.data
}

async function criarPermissaoPublicaCities() {
  console.log('3. Criando permissão pública para cities (role null = público)...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar policy do role Public
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  const publicRoleData = await publicRoleResponse.json()
  
  if (!publicRoleData.data || publicRoleData.data.length === 0) {
    console.log('   ⚠️ Role Public não encontrado')
  } else {
    const publicRoleId = publicRoleData.data[0].id
    console.log(`   Role Public ID: ${publicRoleId}`)

    // Buscar policy do role Public
    const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRoleId}`, { headers })
    const accessData = await accessResponse.json()
    
    if (accessData.data && accessData.data.length > 0) {
      const policyId = accessData.data[0].policy
      console.log(`   Policy ID: ${policyId}`)

      // Verificar se já existe permissão para cities nessa policy
      const existingPerms = await fetch(
        `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=cities`,
        { headers }
      )
      const existingData = await existingPerms.json()

      if (existingData.data && existingData.data.length > 0) {
        console.log(`   ⏭️  Permissão pública já existe`)
      } else {
        // Criar permissão
        const response = await fetch(`${DIRECTUS_URL}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            policy: policyId,
            collection: 'cities',
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
      }
    }
  }
  console.log('')
}

async function testarCities() {
  console.log('4. Testando acesso a cities...\n')
  
  // Teste sem autenticação (acesso público)
  console.log('   Teste sem token (público):')
  const publicResponse = await fetch(`${DIRECTUS_URL}/items/cities?limit=1`)
  console.log(`      Status: ${publicResponse.status} ${publicResponse.statusText}`)
  
  // Teste com token admin
  console.log('   Teste com token admin:')
  const adminResponse = await fetch(`${DIRECTUS_URL}/items/cities?limit=1`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  })
  console.log(`      Status: ${adminResponse.status} ${adminResponse.statusText}`)

  // Teste com API token
  const API_TOKEN = env.VITE_DIRECTUS_TOKEN
  if (API_TOKEN) {
    console.log('   Teste com API token:')
    const apiResponse = await fetch(`${DIRECTUS_URL}/items/cities?limit=1`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    })
    console.log(`      Status: ${apiResponse.status} ${apiResponse.statusText}`)
  }
  
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Permissão Cities')
  console.log('========================================\n')

  try {
    await login()
    await verificarPermissoesCities()
    await criarPermissaoPublicaCities()
    await testarCities()

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

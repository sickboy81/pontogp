/**
 * Script para Verificar Permissões do Role "User" ou "Authenticated"
 * 
 * Verifica se as permissões foram configuradas corretamente
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
  const data = await response.json()
  adminToken = data.data.access_token
  console.log('   ✅ Login realizado\n')
}

async function verifyPermissions() {
  console.log('2. Verificando permissões do role "Authenticated"...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role
  const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const rolesData = await rolesRes.json()
  const userRole = rolesData.data.find(r => 
    r.name === 'User' || r.name === 'user' || 
    r.name === 'Authenticated' || r.name === 'authenticated'
  )

  if (!userRole) {
    console.error('❌ Role não encontrado!')
    return
  }

  console.log(`   Role: ${userRole.name} (${userRole.id})\n`)

  // Verificar permissões
  const collections = [
    { name: 'directus_files', action: 'create', required: true },
    { name: 'notifications', action: 'read', required: true },
    { name: 'notifications', action: 'create', required: true },
    { name: 'notifications', action: 'update', required: true },
    { name: 'user_favorites', action: 'read', required: true },
    { name: 'user_favorites', action: 'create', required: true },
    { name: 'user_favorites', action: 'update', required: true },
    { name: 'user_favorites', action: 'delete', required: true },
    { name: 'cities', action: 'read', required: true },
    { name: 'settings', action: 'read', required: false },
  ]

  const permsRes = await fetch(
    `${DIRECTUS_URL}/permissions?filter[role][_eq]=${userRole.id}`,
    { headers }
  )
  const permsData = await permsRes.json()
  const permissions = permsData.data || []

  console.log(`   Total de permissões encontradas: ${permissions.length}\n`)
  
  if (permissions.length > 0) {
    console.log('   Primeiras 5 permissões:')
    permissions.slice(0, 5).forEach(p => {
      console.log(`      - ${p.collection}.${p.action} (ID: ${p.id})`)
    })
    console.log('')
  }

  console.log('   Verificando permissões necessárias:\n')

  let allOk = true
  for (const { name, action, required } of collections) {
    const perm = permissions.find(p => 
      p.collection === name && p.action === action
    )

    if (perm) {
      console.log(`   ✅ ${name}.${action} - Configurada (ID: ${perm.id})`)
    } else {
      if (required) {
        console.log(`   ❌ ${name}.${action} - FALTANDO (obrigatória)`)
        allOk = false
      } else {
        console.log(`   ⚠️  ${name}.${action} - Faltando (opcional)`)
      }
    }
  }

  console.log('')
  if (allOk) {
    console.log('✅ Todas as permissões obrigatórias estão configuradas!')
  } else {
    console.log('❌ Algumas permissões estão faltando. Execute o script fix-user-role-permissions.mjs novamente.')
  }
}

async function main() {
  try {
    await login()
    await verifyPermissions()
  } catch (error) {
    console.error('❌ ERRO:', error.message)
    process.exit(1)
  }
}

main()

/**
 * Verificar Permissões no Directus 11
 * 
 * No Directus 11: Role -> Access -> Policy -> Permissions
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

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

let adminToken = null

async function login() {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const data = await response.json()
  adminToken = data.data.access_token
}

async function verify() {
  await login()
  console.log('✅ Login realizado\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role Authenticated
  const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const rolesData = await rolesRes.json()
  const authRole = rolesData.data.find(r => 
    r.name === 'Authenticated' || r.name === 'authenticated'
  )
  
  if (!authRole) {
    console.error('❌ Role Authenticated não encontrado')
    return
  }
  
  console.log(`Role: ${authRole.name} (${authRole.id})\n`)

  // Buscar policies do role via /access
  const accessRes = await fetch(
    `${DIRECTUS_URL}/access?filter[role][_eq]=${authRole.id}`,
    { headers }
  )
  const accessData = await accessRes.json()
  
  if (!accessData.data || accessData.data.length === 0) {
    console.error('❌ Nenhuma policy associada ao role')
    return
  }

  const policyIds = accessData.data.map(a => a.policy).filter(Boolean)
  console.log(`Policies associadas: ${policyIds.length}`)
  policyIds.forEach(p => console.log(`   - ${p}`))
  console.log('')

  // Buscar permissões de todas as policies
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

  // Buscar todas as permissões das policies
  let allPermissions = []
  for (const policyId of policyIds) {
    const permsRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}`,
      { headers }
    )
    const permsData = await permsRes.json()
    if (permsData.data) {
      allPermissions = allPermissions.concat(permsData.data)
    }
  }

  console.log(`Total de permissões: ${allPermissions.length}\n`)
  console.log('Verificando permissões necessárias:\n')

  let allOk = true
  for (const { name, action, required } of collections) {
    const perm = allPermissions.find(p => 
      p.collection === name && p.action === action
    )

    if (perm) {
      console.log(`   ✅ ${name}.${action} - OK (ID: ${perm.id})`)
    } else {
      if (required) {
        console.log(`   ❌ ${name}.${action} - FALTANDO`)
        allOk = false
      } else {
        console.log(`   ⚠️  ${name}.${action} - Faltando (opcional)`)
      }
    }
  }

  console.log('')
  if (allOk) {
    console.log('✅ Todas as permissões obrigatórias estão configuradas!')
    console.log('\nOs erros 403 devem estar resolvidos. Teste fazendo login e upload de fotos.')
  } else {
    console.log('❌ Algumas permissões estão faltando.')
    console.log('Execute: node scripts/fix-permissions-directus11.mjs')
  }
}

verify().catch(console.error)

/**
 * Script para debugar permissões criadas
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

async function debug() {
  await login()
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar todas as permissões criadas recentemente (IDs 120-129)
  console.log('Buscando permissões com IDs 120-129...\n')
  
  for (let id = 120; id <= 129; id++) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/permissions/${id}`, { headers })
      if (res.ok) {
        const perm = await res.json()
        console.log(`ID ${id}:`, {
          collection: perm.data?.collection,
          action: perm.data?.action,
          role: perm.data?.role,
          policy: perm.data?.policy,
        })
      } else {
        console.log(`ID ${id}: Não encontrado (${res.status})`)
      }
    } catch (error) {
      console.log(`ID ${id}: Erro - ${error.message}`)
    }
  }

  // Buscar role Authenticated
  console.log('\n\nBuscando role Authenticated...')
  const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const rolesData = await rolesRes.json()
  const authRole = rolesData.data.find(r => r.name === 'Authenticated' || r.name === 'authenticated')
  
  if (authRole) {
    console.log(`Role ID: ${authRole.id}`)
    
    // Buscar todas as permissões deste role
    console.log('\nBuscando todas as permissões do role Authenticated...')
    const permsRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${authRole.id}`,
      { headers }
    )
    const permsData = await permsRes.json()
    console.log(`Total encontradas: ${permsData.data?.length || 0}`)
    
    if (permsData.data && permsData.data.length > 0) {
      permsData.data.forEach(p => {
        console.log(`  - ${p.collection}.${p.action} (ID: ${p.id}, Role: ${p.role}, Policy: ${p.policy})`)
      })
    }
    
    // Buscar uma permissão existente de outro role para ver a estrutura
    console.log('\nBuscando permissão existente de outro role (profiles read)...')
    const exampleRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=profiles&filter[action][_eq]=read&limit=1`,
      { headers }
    )
    const exampleData = await exampleRes.json()
    if (exampleData.data && exampleData.data.length > 0) {
      const example = exampleData.data[0]
      console.log('Estrutura de permissão existente:')
      console.log(JSON.stringify(example, null, 2))
    }
  }
}

debug().catch(console.error)

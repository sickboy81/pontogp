/**
 * Testar permissões com um token de usuário real
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

async function checkPermissionDetails() {
  await login()
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar permissões criadas
  const perms = [
    { id: 140, name: 'directus_files.create' },
    { id: 141, name: 'notifications.read' },
    { id: 144, name: 'user_favorites.read' },
    { id: 148, name: 'cities.read' },
  ]

  console.log('Verificando detalhes das permissões:\n')
  
  for (const perm of perms) {
    const res = await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, { headers })
    if (res.ok) {
      const data = await res.json()
      console.log(`${perm.name} (ID: ${perm.id}):`)
      console.log(`  Policy: ${data.data.policy}`)
      console.log(`  Permissions: ${JSON.stringify(data.data.permissions)}`)
      console.log(`  Fields: ${JSON.stringify(data.data.fields)}`)
      console.log('')
    }
  }

  // Verificar uma permissão existente que funciona (profiles)
  console.log('Comparando com permissão existente (profiles.read):\n')
  const profilesRes = await fetch(
    `${DIRECTUS_URL}/permissions?filter[collection][_eq]=profiles&filter[action][_eq]=read&limit=1`,
    { headers }
  )
  if (profilesRes.ok) {
    const profilesData = await profilesRes.json()
    if (profilesData.data && profilesData.data.length > 0) {
      const p = profilesData.data[0]
      console.log('profiles.read:')
      console.log(`  Policy: ${p.policy}`)
      console.log(`  Permissions: ${JSON.stringify(p.permissions)}`)
      console.log(`  Fields: ${JSON.stringify(p.fields)}`)
    }
  }
}

checkPermissionDetails().catch(console.error)

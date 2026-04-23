/**
 * Script para testar atualização de status de um anúncio específico
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

async function listarAnuncios() {
  console.log('2. Listando todos os anúncios...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/items/profiles?fields=id,name,status&limit=100`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar anúncios: ${response.status}`)
    return []
  }

  const data = await response.json()
  
  if (data.data && data.data.length > 0) {
    console.log(`   Total de anúncios: ${data.data.length}\n`)
    data.data.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.name || profile.id}`)
      console.log(`      ID: ${profile.id}`)
      console.log(`      Status: ${profile.status || 'NÃO DEFINIDO'}`)
      console.log('')
    })
    return data.data
  }
  
  return []
}

async function atualizarStatus(profileId, newStatus) {
  console.log(`3. Atualizando status do anúncio ${profileId} para "${newStatus}"...\n`)
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/items/profiles/${profileId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: newStatus }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error(`   ❌ Erro ao atualizar: ${response.status}`)
    console.error(`   Erro: ${JSON.stringify(errorData, null, 2)}`)
    return false
  }

  const result = await response.json()
  console.log(`   ✅ Status atualizado com sucesso!`)
  console.log(`   Novo status: ${result.data.status}`)
  console.log('')
  return true
}

async function main() {
  console.log('========================================')
  console.log('Testar Atualização de Status')
  console.log('========================================\n')

  try {
    await login()
    const anuncios = await listarAnuncios()
    
    if (anuncios.length === 0) {
      console.log('   ⚠️ Nenhum anúncio encontrado')
      return
    }

    // Se houver argumento na linha de comando, usar ele
    const args = process.argv.slice(2)
    if (args.length > 0) {
      const profileId = args[0]
      const newStatus = args[1] || 'active'
      
      await atualizarStatus(profileId, newStatus)
    } else {
      console.log('========================================')
      console.log('Para atualizar um anúncio específico, use:')
      console.log('node scripts/testar-atualizacao-status.mjs <ID_DO_ANUNCIO> [active|inactive|suspended]')
      console.log('========================================\n')
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

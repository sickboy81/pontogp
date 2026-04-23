/**
 * Script para verificar como as fotos estão sendo retornadas pelo Directus
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
const API_TOKEN = env.VITE_DIRECTUS_TOKEN

if (!API_TOKEN) {
  console.error('❌ ERRO: VITE_DIRECTUS_TOKEN deve estar no .env')
  process.exit(1)
}

let adminToken = null

async function login() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('⚠️ Usando apenas API token (sem login admin)\n')
    return
  }

  console.log('1. Fazendo login...')
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (!response.ok) {
    console.log('   ⚠️ Login falhou, usando apenas API token\n')
    return
  }

  const data = await response.json()
  adminToken = data.data.access_token
  console.log('   ✅ Login realizado\n')
}

async function verificarPerfil() {
  console.log('2. Buscando primeiro perfil...\n')
  
  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/items/profiles?limit=1&fields=*,photos.*`, { headers })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao buscar perfil: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  if (!data.data || data.data.length === 0) {
    console.log('   ⚠️ Nenhum perfil encontrado')
    return
  }

  const profile = data.data[0]
  
  console.log(`   ✅ Perfil encontrado: ${profile.name} (ID: ${profile.id})`)
  console.log(`   Campo photos:`, profile.photos)
  console.log(`   Tipo de photos:`, typeof profile.photos)
  console.log(`   É array?`, Array.isArray(profile.photos))
  
  if (profile.photos && profile.photos.length > 0) {
    console.log(`\n   📸 Primeira foto:`)
    console.log(`      Tipo:`, typeof profile.photos[0])
    console.log(`      Valor:`, profile.photos[0])
    
    if (typeof profile.photos[0] === 'string') {
      // Pode ser ID ou URL
      if (profile.photos[0].startsWith('http')) {
        console.log(`      ✅ É uma URL`)
      } else {
        console.log(`      ⚠️ Parece ser um ID de arquivo`)
        
        // Tentar buscar o arquivo
        const fileResponse = await fetch(`${DIRECTUS_URL}/files/${profile.photos[0]}`, { headers })
        if (fileResponse.ok) {
          const fileData = await fileResponse.json()
          console.log(`      📁 Dados do arquivo:`)
          console.log(`         ID: ${fileData.data.id}`)
          console.log(`         filename_download: ${fileData.data.filename_download}`)
          console.log(`         storage: ${fileData.data.storage}`)
          console.log(`         storage_location: ${fileData.data.storage_location}`)
          console.log(`         URL direta: ${DIRECTUS_URL}/assets/${fileData.data.id}`)
          
          // Verificar se tem R2 configurado
          const r2PublicUrl = env.VITE_R2_PUBLIC_URL
          if (r2PublicUrl) {
            console.log(`         R2 Public URL: ${r2PublicUrl}`)
          } else {
            console.log(`         ⚠️ VITE_R2_PUBLIC_URL não configurado`)
          }
        } else {
          console.log(`      ❌ Erro ao buscar arquivo: ${fileResponse.status}`)
        }
      }
    } else if (typeof profile.photos[0] === 'object') {
      console.log(`      📁 É um objeto (relação do Directus):`)
      console.log(`         ID: ${profile.photos[0].id}`)
      console.log(`         filename_download: ${profile.photos[0].filename_download}`)
      console.log(`         storage: ${profile.photos[0].storage}`)
    }
  } else {
    console.log(`   ⚠️ Perfil não tem fotos`)
  }

  console.log('')
}

async function verificarPermissoesArquivos() {
  console.log('3. Verificando permissões de leitura de arquivos...\n')
  
  if (!adminToken) {
    console.log('   ⚠️ Não foi possível verificar permissões (sem token admin)')
    return
  }

  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Verificar permissões para role "Public"
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  if (publicRoleResponse.ok) {
    const publicRoleData = await publicRoleResponse.json()
    if (publicRoleData.data && publicRoleData.data.length > 0) {
      const publicRoleId = publicRoleData.data[0].id
      console.log(`   Role Public ID: ${publicRoleId}`)
      
      const permissionsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files&filter[role][_eq]=${publicRoleId}`, { headers })
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log(`   Permissões para directus_files (Public):`, permissionsData.data)
      }
    }
  }

  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Fotos de Perfil')
  console.log('========================================\n')

  try {
    await login()
    await verificarPerfil()
    await verificarPermissoesArquivos()

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

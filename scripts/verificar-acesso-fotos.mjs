/**
 * Script para verificar se as URLs de fotos estão acessíveis
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

async function verificarAcessoFotos() {
  console.log('2. Buscando perfil e testando acesso às fotos...\n')
  
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
  
  console.log(`   ✅ Perfil: ${profile.name}`)
  console.log(`   Total de fotos: ${profile.photos?.length || 0}\n`)

  if (profile.photos && profile.photos.length > 0) {
    for (let i = 0; i < Math.min(3, profile.photos.length); i++) {
      const photoUrl = profile.photos[i]
      console.log(`   📸 Foto ${i + 1}: ${photoUrl}`)
      
      // Testar acesso sem autenticação (como um navegador faria)
      const publicResponse = await fetch(photoUrl, { method: 'HEAD' })
      console.log(`      Status: ${publicResponse.status} ${publicResponse.statusText}`)
      
      if (publicResponse.ok) {
        console.log(`      ✅ Acessível publicamente`)
      } else {
        console.log(`      ❌ NÃO acessível (${publicResponse.status})`)
        
        // Tentar com token
        const authResponse = await fetch(photoUrl, {
          method: 'HEAD',
          headers: { 'Authorization': `Bearer ${API_TOKEN}` },
        })
        console.log(`      Com token: ${authResponse.status} ${authResponse.statusText}`)
      }
      console.log('')
    }
  }
}

async function verificarPermissoesPublic() {
  console.log('3. Verificando permissões de leitura para role Public...\n')
  
  if (!adminToken) {
    console.log('   ⚠️ Não foi possível verificar (sem token admin)')
    return
  }

  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role Public
  const publicRoleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, { headers })
  if (!publicRoleResponse.ok) {
    console.log('   ❌ Erro ao buscar role Public')
    return
  }

  const publicRoleData = await publicRoleResponse.json()
  if (!publicRoleData.data || publicRoleData.data.length === 0) {
    console.log('   ⚠️ Role Public não encontrado')
    return
  }

  const publicRoleId = publicRoleData.data[0].id
  console.log(`   Role Public ID: ${publicRoleId}`)

  // Buscar permissões para directus_files
  const permissionsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=directus_files&filter[role][_eq]=${publicRoleId}`, { headers })
  if (!permissionsResponse.ok) {
    console.log('   ❌ Erro ao buscar permissões')
    return
  }

  const permissionsData = await permissionsResponse.json()
  console.log(`   Permissões encontradas: ${permissionsData.data?.length || 0}`)
  
  if (!permissionsData.data || permissionsData.data.length === 0) {
    console.log('   ⚠️ NENHUMA permissão de leitura para directus_files no role Public!')
    console.log('   Isso explica por que as fotos não aparecem.')
    console.log('')
    console.log('   Criando permissão de leitura...')
    
    // Buscar policy do role Public
    const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${publicRoleId}`, { headers })
    if (accessResponse.ok) {
      const accessData = await accessResponse.json()
      if (accessData.data && accessData.data.length > 0) {
        const policyId = accessData.data[0].policy
        console.log(`   Policy ID: ${policyId}`)
        
        // Criar permissão de leitura
        const createPermResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            policy: policyId,
            collection: 'directus_files',
            action: 'read',
            permissions: {},
            fields: ['*'],
          }),
        })

        if (createPermResponse.ok) {
          const permData = await createPermResponse.json()
          console.log(`   ✅ Permissão criada! ID: ${permData.data.id}`)
        } else {
          const error = await createPermResponse.json().catch(() => ({}))
          console.log(`   ❌ Erro ao criar permissão: ${JSON.stringify(error)}`)
        }
      }
    }
  } else {
    console.log('   ✅ Permissões existem:')
    permissionsData.data.forEach((perm) => {
      console.log(`      - ${perm.action} (ID: ${perm.id})`)
    })
  }

  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Acesso às Fotos')
  console.log('========================================\n')

  try {
    await login()
    await verificarAcessoFotos()
    await verificarPermissoesPublic()

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')
    
    console.log('⚠️ Se as fotos não estão aparecendo:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Limpe o cache do navegador')
    console.log('3. Verifique se VITE_R2_PUBLIC_URL está configurado (se usar R2)')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

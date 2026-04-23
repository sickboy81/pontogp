/**
 * Script para verificar permissões do campo status na collection profiles
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

async function verificarPermissoes() {
  console.log('2. Verificando permissões da collection profiles...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar todas as permissões para profiles
  const response = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=profiles`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar permissões: ${response.status}`)
    return
  }

  const data = await response.json()
  console.log(`   Total de permissões encontradas: ${data.data?.length || 0}\n`)

  if (data.data && data.data.length > 0) {
    data.data.forEach(perm => {
      console.log(`   📋 Permissão ID: ${perm.id}`)
      console.log(`      - Collection: ${perm.collection}`)
      console.log(`      - Action: ${perm.action}`)
      console.log(`      - Policy: ${perm.policy}`)
      console.log(`      - Fields: ${JSON.stringify(perm.fields)}`)
      console.log(`      - Permissions: ${JSON.stringify(perm.permissions)}`)
      console.log(`      - Validation: ${JSON.stringify(perm.validation)}`)
      console.log('')
    })
  }
}

async function verificarCampoStatus() {
  console.log('3. Verificando campo status na collection profiles...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/profiles/status`, { headers })
  
  if (!response.ok) {
    console.error(`   ❌ Erro ao buscar campo status: ${response.status}`)
    const error = await response.text()
    console.error(`   Erro: ${error}`)
    return
  }

  const data = await response.json()
  console.log('   ✅ Campo status encontrado:')
  console.log(`      - Nome: ${data.data?.field || 'N/A'}`)
  console.log(`      - Tipo: ${data.data?.type || 'N/A'}`)
  console.log(`      - Meta: ${JSON.stringify(data.data?.meta, null, 2)}`)
  console.log(`      - Schema: ${JSON.stringify(data.data?.schema, null, 2)}`)
  console.log('')
}

async function testarAtualizacaoStatus() {
  console.log('4. Testando atualização de status...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar primeiro perfil
  const profilesRes = await fetch(`${DIRECTUS_URL}/items/profiles?limit=1`, { headers })
  
  if (!profilesRes.ok) {
    console.error(`   ❌ Erro ao buscar perfis: ${profilesRes.status}`)
    return
  }

  const profilesData = await profilesRes.json()
  
  if (!profilesData.data || profilesData.data.length === 0) {
    console.log('   ⚠️ Nenhum perfil encontrado para testar')
    return
  }

  const profile = profilesData.data[0]
  console.log(`   📋 Testando com perfil: ${profile.id} (${profile.name})`)
  console.log(`   Status atual: ${profile.status}`)

  // Tentar atualizar apenas o status
  const newStatus = profile.status === 'active' ? 'inactive' : 'active'
  console.log(`   Tentando alterar para: ${newStatus}`)

  const updateRes = await fetch(`${DIRECTUS_URL}/items/profiles/${profile.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: newStatus }),
  })

  if (!updateRes.ok) {
    const errorData = await updateRes.json().catch(() => ({}))
    console.error(`   ❌ Erro ao atualizar: ${updateRes.status}`)
    console.error(`   Erro: ${JSON.stringify(errorData, null, 2)}`)
    
    // Reverter se possível
    if (updateRes.status !== 404) {
      console.log(`   🔄 Tentando reverter para status original...`)
      const revertRes = await fetch(`${DIRECTUS_URL}/items/profiles/${profile.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: profile.status }),
      })
      if (revertRes.ok) {
        console.log(`   ✅ Status revertido`)
      }
    }
  } else {
    const updateData = await updateRes.json()
    console.log(`   ✅ Status atualizado com sucesso!`)
    console.log(`   Novo status: ${updateData.data.status}`)
    
    // Reverter para não deixar alterado
    console.log(`   🔄 Revertendo para status original...`)
    const revertRes = await fetch(`${DIRECTUS_URL}/items/profiles/${profile.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: profile.status }),
    })
    if (revertRes.ok) {
      console.log(`   ✅ Status revertido`)
    }
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Verificar Permissões - Campo Status')
  console.log('========================================\n')

  try {
    await login()
    await verificarPermissoes()
    await verificarCampoStatus()
    await testarAtualizacaoStatus()

    console.log('========================================')
    console.log('✅ Verificação concluída!')
    console.log('========================================\n')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

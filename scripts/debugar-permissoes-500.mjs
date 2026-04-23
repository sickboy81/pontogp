/**
 * Script para debugar erros 500 nas permissões
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

const USER_ID = '2ea7ebb2-c6fd-4bf1-a592-08507a5fb4b9'

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

async function buscarTodasPermissoesRole() {
  console.log('2. Buscando todas as permissões do role User...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar role User
  const roleResponse = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=User`, { headers })
  const roleData = await roleResponse.json()
  const roleId = roleData.data[0].id

  // Buscar policy do role
  const accessResponse = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${roleId}`, { headers })
  const accessData = await accessResponse.json()
  const policyId = accessData.data[0].policy

  console.log(`   Role ID: ${roleId}`)
  console.log(`   Policy ID: ${policyId}`)
  console.log('')

  // Buscar TODAS as permissões desta policy
  const permsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}`, { headers })
  const permsData = await permsResponse.json()

  console.log(`   Total de permissões: ${permsData.data.length}`)
  console.log('')
  
  // Mostrar detalhes de cada permissão
  const collectionsComProblema = ['user_favorites', 'notifications', 'cities']
  
  for (const perm of permsData.data) {
    if (collectionsComProblema.includes(perm.collection)) {
      console.log(`   📋 ${perm.collection}.${perm.action}`)
      console.log(`      ID: ${perm.id}`)
      console.log(`      Policy: ${perm.policy}`)
      console.log(`      Permissions (filtro): ${JSON.stringify(perm.permissions)}`)
      console.log(`      Presets: ${JSON.stringify(perm.presets)}`)
      console.log(`      Fields: ${JSON.stringify(perm.fields)}`)
      console.log('')
    }
  }

  return { roleId, policyId, permissions: permsData.data }
}

async function corrigirPermissoes(policyId) {
  console.log('3. Corrigindo permissões problemáticas...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Deletar permissões antigas para as collections problemáticas
  const collectionsParaCorrigir = ['user_favorites', 'notifications', 'cities']
  
  for (const collection of collectionsParaCorrigir) {
    console.log(`   Removendo permissões antigas de ${collection}...`)
    
    const existingPerms = await fetch(
      `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}`,
      { headers }
    )
    const existingData = await existingPerms.json()
    
    for (const perm of existingData.data || []) {
      await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
        method: 'DELETE',
        headers,
      })
      console.log(`      ❌ Deletada permissão ${perm.id}`)
    }
  }
  console.log('')

  // Criar novas permissões com sintaxe corrigida
  const novasPermissoes = [
    // user_favorites - sem filtro para read (usuário pode ver todos os favoritos dele via filtro no frontend)
    { collection: 'user_favorites', action: 'read', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'create', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'update', permissions: null, fields: ['*'] },
    { collection: 'user_favorites', action: 'delete', permissions: null, fields: ['*'] },
    
    // notifications - sem filtro para read
    { collection: 'notifications', action: 'read', permissions: null, fields: ['*'] },
    { collection: 'notifications', action: 'create', permissions: null, fields: ['*'] },
    { collection: 'notifications', action: 'update', permissions: null, fields: ['*'] },
    
    // cities - leitura pública
    { collection: 'cities', action: 'read', permissions: null, fields: ['*'] },
  ]

  console.log('   Criando novas permissões...')
  for (const perm of novasPermissoes) {
    const response = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: policyId,
        collection: perm.collection,
        action: perm.action,
        permissions: perm.permissions,
        fields: perm.fields,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`      ✅ ${perm.collection}.${perm.action} (ID: ${result.data.id})`)
    } else {
      const error = await response.json().catch(() => ({}))
      console.log(`      ❌ ${perm.collection}.${perm.action}: ${JSON.stringify(error)}`)
    }
  }
  console.log('')
}

async function testarAposCorrecao() {
  console.log('4. Testando após correção...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const collections = ['user_favorites', 'notifications', 'cities']
  
  for (const collection of collections) {
    console.log(`   Testando ${collection}...`)
    const response = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=1`, { headers })
    
    console.log(`      Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`      Erro: ${errorText.substring(0, 200)}`)
    } else {
      console.log(`      ✅ OK`)
    }
  }
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Debugar e Corrigir Erros 500')
  console.log('========================================\n')

  try {
    await login()
    const { policyId } = await buscarTodasPermissoesRole()
    await corrigirPermissoes(policyId)
    await testarAposCorrecao()

    console.log('========================================')
    console.log('✅ Correção concluída!')
    console.log('========================================\n')
    
    console.log('⚠️ IMPORTANTE:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Limpe o cache do navegador')
    console.log('3. Faça logout/login no site')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

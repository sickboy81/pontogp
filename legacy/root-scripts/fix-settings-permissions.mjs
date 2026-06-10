#!/usr/bin/env node
/**
 * Script para configurar permissões da collection settings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Carregar .env
let env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/)
    if (match && !match[1].startsWith('#')) {
      env[match[1]] = match[2]
    }
  })
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: Credenciais não encontradas no .env')
  process.exit(1)
}

console.log('========================================')
console.log('Configurar Permissões Settings')
console.log('========================================')
console.log('')

// 1. Login
console.log('1. Fazendo login...')
let token
try {
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  
  if (!loginRes.ok) {
    throw new Error(`Login falhou: ${loginRes.status}`)
  }
  
  const loginData = await loginRes.json()
  token = loginData.data.access_token
  console.log('   ✅ Login realizado!')
} catch (error) {
  console.error('   ❌ Erro no login:', error.message)
  process.exit(1)
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

console.log('')

// 2. Obter role Public
console.log('2. Buscando role Public...')
let publicRoleId
try {
  const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const roles = await rolesRes.json()
  const publicRole = roles.data?.find(r => r.name === 'Public' || r.id === '2f24211d-5d52-4b1f-9328-c5f8c89b5a5a')
  
  if (publicRole) {
    publicRoleId = publicRole.id
    console.log(`   ✅ Role Public encontrada: ${publicRoleId}`)
  } else {
    console.error('   ❌ Role Public não encontrada')
    process.exit(1)
  }
} catch (error) {
  console.error('   ❌ Erro ao buscar roles:', error.message)
  process.exit(1)
}

console.log('')

// 3. Verificar permissão existente
console.log('3. Verificando permissões existentes...')
try {
  const permRes = await fetch(`${DIRECTUS_URL}/permissions?filter[role][_eq]=${publicRoleId}&filter[collection][_eq]=settings&filter[action][_eq]=read`, { headers })
  const perms = await permRes.json()
  
  if (perms.data?.length > 0) {
    console.log('   ✅ Permissão de leitura já existe!')
    console.log('')
    console.log('========================================')
    console.log('✅ Tudo configurado!')
    console.log('========================================')
    process.exit(0)
  }
} catch (error) {
  console.log('   ⚠️  Nenhuma permissão encontrada, será criada...')
}

console.log('')

// 4. Criar permissão
console.log('4. Criando permissão de leitura...')
try {
  // Buscar uma permissão existente da role Public para usar como modelo
  const examplePermRes = await fetch(`${DIRECTUS_URL}/permissions?filter[role][_eq]=${publicRoleId}&limit=1`, { headers })
  const examplePerms = await examplePermRes.json()
  
  // Obter o policy ID de uma permissão existente da role Public
  let policyId = null
  if (examplePerms.data?.length > 0) {
    policyId = examplePerms.data[0].policy
    console.log(`   📋 Usando policy ID: ${policyId}`)
  } else {
    // Se não houver exemplo, buscar de outra role (profiles para Public geralmente usa "5cf94c8c-1d1d-41da-b85f-19cc1f9935a4")
    const profilesPermRes = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=profiles&filter[action][_eq]=read&limit=1`, { headers })
    const profilesPerms = await profilesPermRes.json()
    if (profilesPerms.data?.length > 0) {
      policyId = profilesPerms.data[0].policy
      console.log(`   📋 Usando policy ID de profiles: ${policyId}`)
    }
  }
  
  if (!policyId) {
    throw new Error('Não foi possível determinar o policy ID. Configure manualmente.')
  }
  
  const permissionBody = {
    role: publicRoleId,
    collection: 'settings',
    action: 'read',
    policy: policyId,
    permissions: {},
    validation: null,
    presets: null,
    fields: ['*']
  }
  
  const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(permissionBody)
  })
  
  if (createRes.ok) {
    console.log('   ✅ Permissão criada com sucesso!')
  } else {
    const errorText = await createRes.text()
    throw new Error(`Erro ${createRes.status}: ${errorText}`)
  }
} catch (error) {
  console.error('   ❌ Erro ao criar permissão:', error.message)
  console.log('')
  console.log('💡 Configure manualmente:')
  console.log('   Settings → Access Control → Public')
  console.log('   Adicione: settings → Read → Acesso Total')
  process.exit(1)
}

console.log('')
console.log('========================================')
console.log('✅ Permissões configuradas!')
console.log('========================================')
console.log('')
console.log('🎉 O erro 403 deve estar resolvido agora!')
console.log('')

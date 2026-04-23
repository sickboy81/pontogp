/**
 * Script para corrigir sintaxe de permissões
 * Corrige $CURRENT_USER.id para {{$CURRENT_USER.id}}
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

function corrigirSintaxe(permissions) {
  if (!permissions || typeof permissions !== 'object') {
    return permissions
  }

  const corrected = JSON.parse(JSON.stringify(permissions))
  
  function corrigirRecursivo(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (obj[key]._eq === '$CURRENT_USER.id') {
          obj[key]._eq = '{{$CURRENT_USER.id}}'
          console.log(`      🔧 Corrigido: $CURRENT_USER.id → {{$CURRENT_USER.id}}`)
        } else {
          corrigirRecursivo(obj[key])
        }
      }
    }
  }

  corrigirRecursivo(corrected)
  return corrected
}

async function corrigirPermissoes() {
  console.log('2. Corrigindo sintaxe das permissões...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const collections = ['notifications', 'user_favorites']
  let corrigidas = 0

  for (const collection of collections) {
    console.log(`   📋 Verificando ${collection}...`)
    
    const response = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=${collection}`,
      { headers }
    )

    if (!response.ok) {
      console.error(`      ❌ Erro ao buscar permissões: ${response.status}`)
      continue
    }

    const data = await response.json()
    const perms = data.data || []

    for (const perm of perms) {
      if (perm.permissions) {
        const original = JSON.stringify(perm.permissions)
        const corrected = corrigirSintaxe(perm.permissions)
        const correctedStr = JSON.stringify(corrected)

        if (original !== correctedStr) {
          console.log(`      🔧 Corrigindo permissão ID ${perm.id} (${perm.collection}.${perm.action})...`)
          
          const updateResponse = await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              permissions: corrected,
            }),
          })

          if (updateResponse.ok) {
            console.log(`      ✅ Permissão ${perm.id} corrigida`)
            corrigidas++
          } else {
            const error = await updateResponse.json().catch(() => ({}))
            console.error(`      ❌ Erro ao corrigir: ${JSON.stringify(error)}`)
          }
        }
      }
    }
  }

  console.log(`\n   ✅ Total de permissões corrigidas: ${corrigidas}\n`)
}

async function main() {
  console.log('========================================')
  console.log('Corrigir Sintaxe de Permissões')
  console.log('========================================\n')

  try {
    await login()
    await corrigirPermissoes()

    console.log('========================================')
    console.log('✅ Correção concluída!')
    console.log('========================================\n')
    
    console.log('Próximos passos:')
    console.log('1. Reinicie o Directus no Coolify')
    console.log('2. Faça logout/login no site')
    console.log('3. Os erros 403 devem desaparecer')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

/**
 * Script para criar o campo status na collection profiles
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

async function criarCampoStatus() {
  console.log('2. Criando campo status na collection profiles...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const fieldData = {
    field: 'status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Ativo', value: 'active' },
          { text: 'Inativo', value: 'inactive' },
          { text: 'Suspenso', value: 'suspended' }
        ]
      },
      required: false,
      readonly: false,
      hidden: false,
      width: 'full'
    },
    schema: {
      default_value: 'inactive',
      is_nullable: true
    }
  }

  try {
    const response = await fetch(`${DIRECTUS_URL}/fields/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      if (error.errors?.[0]?.message?.includes('already exists') || response.status === 400) {
        console.log('   ⚠️ Campo status já existe ou houve erro na criação')
        console.log(`   Erro: ${JSON.stringify(error, null, 2)}`)
        
        // Tentar atualizar o campo existente
        console.log('   🔄 Tentando atualizar campo existente...')
        const updateResponse = await fetch(`${DIRECTUS_URL}/fields/profiles/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(fieldData),
        })
        
        if (updateResponse.ok) {
          console.log('   ✅ Campo status atualizado com sucesso!')
        } else {
          const updateError = await updateResponse.json().catch(() => ({}))
          console.log(`   ❌ Erro ao atualizar: ${JSON.stringify(updateError, null, 2)}`)
        }
      } else {
        throw new Error(`Erro ao criar campo: ${response.status} - ${JSON.stringify(error)}`)
      }
    } else {
      const result = await response.json()
      console.log('   ✅ Campo status criado com sucesso!')
      console.log(`   ID: ${result.data?.field || 'N/A'}`)
    }
  } catch (error) {
    console.error('   ❌ Erro:', error.message)
    throw error
  }
  console.log('')
}

async function verificarCampo() {
  console.log('3. Verificando se o campo foi criado...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/fields/profiles/status`, { headers })
  
  if (response.ok) {
    const data = await response.json()
    console.log('   ✅ Campo status encontrado:')
    console.log(`      - Field: ${data.data?.field || 'N/A'}`)
    console.log(`      - Type: ${data.data?.type || 'N/A'}`)
    console.log(`      - Default: ${data.data?.schema?.default_value || 'N/A'}`)
  } else {
    console.log('   ❌ Campo status ainda não existe')
  }
  console.log('')
}

async function atualizarPerfisExistentes() {
  console.log('4. Atualizando perfis existentes com status padrão...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  // Buscar todos os perfis sem status
  const response = await fetch(`${DIRECTUS_URL}/items/profiles?fields=id,status&limit=1000`, { headers })
  
  if (!response.ok) {
    console.log('   ⚠️ Não foi possível buscar perfis para atualizar')
    return
  }

  const data = await response.json()
  
  if (!data.data || data.data.length === 0) {
    console.log('   ℹ️ Nenhum perfil encontrado')
    return
  }

  let updated = 0
  let skipped = 0

  for (const profile of data.data) {
    // Se o perfil não tem status definido, definir como 'active' (ou 'inactive' se preferir)
    if (!profile.status) {
      try {
        const updateResponse = await fetch(`${DIRECTUS_URL}/items/profiles/${profile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'active' }),
        })
        
        if (updateResponse.ok) {
          updated++
        } else {
          skipped++
        }
      } catch (error) {
        skipped++
      }
    } else {
      skipped++
    }
  }

  console.log(`   ✅ ${updated} perfil(is) atualizado(s)`)
  console.log(`   ⏭️ ${skipped} perfil(is) já tinha status ou não foi possível atualizar`)
  console.log('')
}

async function main() {
  console.log('========================================')
  console.log('Criar Campo Status')
  console.log('========================================\n')

  try {
    await login()
    await criarCampoStatus()
    await verificarCampo()
    await atualizarPerfisExistentes()

    console.log('========================================')
    console.log('✅ Campo status criado e configurado!')
    console.log('========================================\n')
    
    console.log('Próximos passos:')
    console.log('1. Teste alterar o status de um perfil no AdminPage')
    console.log('2. Verifique se o status aparece corretamente')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

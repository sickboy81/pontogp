#!/usr/bin/env node
/**
 * Script para criar e configurar a collection settings no Directus
 * 
 * Uso:
 *   node scripts/create_settings_collection.mjs
 * 
 * Requer:
 *   - DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD no .env
 *   - Ou passar como variáveis de ambiente
 */

import { createDirectus, rest, authentication } from '@directus/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Carregar variáveis de ambiente do .env
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

// Configuração
const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || env.DIRECTUS_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD são obrigatórios!')
  console.error('   Defina no arquivo .env ou como variáveis de ambiente')
  process.exit(1)
}

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication())

// Helper para fazer requisições raw
async function rawRequest(path, method = 'GET', body = null) {
  const token = await directus.getToken()
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
  const url = `${DIRECTUS_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`)
  }
  return res.json()
}

async function main() {
  console.log('========================================')
  console.log('Criar Collection Settings - Directus')
  console.log('========================================')
  console.log('')

  try {
    // 1. Login
    console.log('1. Fazendo login...')
    await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('   ✅ Login realizado com sucesso!')
    console.log('')

    // 2. Verificar se collection já existe
    console.log('2. Verificando se collection settings existe...')
    let collectionExists = false
    try {
      const collections = await rawRequest('/collections')
      collectionExists = collections.data.some(c => c.collection === 'settings')
    } catch (error) {
      console.log('   ⚠️  Erro ao verificar collections:', error.message)
    }

    if (collectionExists) {
      console.log('   ✅ Collection settings já existe!')
      console.log('')
    } else {
      // 3. Criar collection
      console.log('3. Criando collection settings...')
      await rawRequest('/collections', 'POST', {
        collection: 'settings',
        meta: {
          collection: 'settings',
          icon: 'settings',
          note: 'Configurações do sistema',
          display_template: '{{key}}',
          hidden: false,
          singleton: false,
          translations: null,
          archive_field: null,
          archive_app_filter: true,
          archive_value: null,
          unarchive_value: null,
          sort_field: null
        },
        schema: {
          name: 'settings'
        }
      })
      console.log('   ✅ Collection criada com sucesso!')
      console.log('')
    }

    // 4. Verificar e criar campos
    console.log('4. Verificando campos...')
    let fields
    try {
      const fieldsResponse = await rawRequest('/fields/settings')
      fields = fieldsResponse.data || []
    } catch (error) {
      fields = []
    }

    const requiredFields = [
      { field: 'id', type: 'uuid', meta: { required: true, hidden: true, readonly: true } },
      { field: 'key', type: 'string', meta: { required: true, width: 'full', note: 'Chave única da configuração' } },
      { field: 'value', type: 'json', meta: { width: 'full', note: 'Valor da configuração (JSON)' } },
      { field: 'enabled', type: 'boolean', meta: { width: 'half', note: 'Se a configuração está ativa' } },
      { field: 'message', type: 'text', meta: { width: 'full', note: 'Mensagem (para manutenção)' } },
      { field: 'updated_at', type: 'timestamp', meta: { required: true, readonly: true, special: ['date-updated'] } }
    ]

    for (const fieldConfig of requiredFields) {
      const fieldExists = fields.some(f => f.field === fieldConfig.field)
      
      if (fieldExists) {
        console.log(`   ✅ Campo '${fieldConfig.field}' já existe`)
      } else {
        console.log(`   📝 Criando campo '${fieldConfig.field}'...`)
        try {
          await rawRequest('/fields/settings', 'POST', {
            field: fieldConfig.field,
            type: fieldConfig.type,
            meta: fieldConfig.meta,
            schema: fieldConfig.schema || {}
          })
          console.log(`   ✅ Campo '${fieldConfig.field}' criado!`)
        } catch (error) {
          console.log(`   ⚠️  Erro ao criar campo '${fieldConfig.field}':`, error.message)
        }
      }
    }
    console.log('')

    // 5. Configurar permissões para Public
    console.log('5. Configurando permissões para Public...')
    try {
      // Obter role Public
      const rolesResponse = await rawRequest('/roles')
      const publicRole = rolesResponse.data.find(r => r.name === 'Public' || r.id === '2f24211d-5d52-4b1f-9328-c5f8c89b5a5a')
      
      if (publicRole) {
        // Verificar permissões existentes
        const permissionsResponse = await rawRequest(`/permissions?filter[role][_eq]=${publicRole.id}&filter[collection][_eq]=settings`)
        const existingPermissions = permissionsResponse.data || []
        
        // Criar/atualizar permissão de leitura
        const readPermission = existingPermissions.find(p => p.action === 'read')
        if (readPermission) {
          console.log('   ✅ Permissão de leitura já existe para Public')
        } else {
          await rawRequest('/permissions', 'POST', {
            role: publicRole.id,
            collection: 'settings',
            action: 'read',
            permissions: {},
            validation: {},
            presets: {},
            fields: ['*']
          })
          console.log('   ✅ Permissão de leitura criada para Public')
        }
      } else {
        console.log('   ⚠️  Role Public não encontrada')
      }
    } catch (error) {
      console.log('   ⚠️  Erro ao configurar permissões:', error.message)
      console.log('   💡 Configure manualmente em Settings → Access Control → Public')
    }
    console.log('')

    // 6. Criar registro de manutenção se não existir
    console.log('6. Verificando registro de manutenção...')
    try {
      const maintenanceResponse = await rawRequest('/items/settings?filter[key][_eq]=maintenance')
      if (maintenanceResponse.data && maintenanceResponse.data.length > 0) {
        console.log('   ✅ Registro de manutenção já existe')
      } else {
        console.log('   📝 Criando registro de manutenção...')
        await rawRequest('/items/settings', 'POST', {
          key: 'maintenance',
          enabled: false,
          message: 'Site em manutenção. Voltaremos em breve!',
          value: {
            enabled: false,
            message: 'Site em manutenção. Voltaremos em breve!'
          }
        })
        console.log('   ✅ Registro de manutenção criado!')
      }
    } catch (error) {
      console.log('   ⚠️  Erro ao criar registro de manutenção:', error.message)
      console.log('   💡 Crie manualmente em Content → Settings')
    }
    console.log('')

    console.log('========================================')
    console.log('✅ Configuração concluída com sucesso!')
    console.log('========================================')
    console.log('')
    console.log('📋 Próximos passos:')
    console.log('   1. Verifique a collection em: Settings → Data Model → settings')
    console.log('   2. Verifique as permissões em: Settings → Access Control → Public')
    console.log('   3. Teste acessando: /items/settings?filter[key][_eq]=maintenance')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ ERRO:', error.message)
    console.error('')
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('💡 Dica: Verifique se as credenciais estão corretas')
    }
    process.exit(1)
  }
}

main()

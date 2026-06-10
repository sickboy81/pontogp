#!/usr/bin/env node
/**
 * Script para criar as collections de mensagens e notificações no Directus
 * Executa: node scripts/create_messages_notifications_collections.mjs
 */

import { createDirectus, rest, authentication } from '@directus/sdk'

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

if (!ADMIN_PASSWORD) {
  console.error('❌ Erro: Variável de ambiente DIRECTUS_ADMIN_PASSWORD não configurada')
  console.log('Configure a senha do admin do Directus antes de executar este script.')
  process.exit(1)
}

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication())

async function login() {
  try {
    await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    const token = await directus.getToken()
    console.log('✅ Login realizado com sucesso!')
    return token
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message)
    throw error
  }
}

async function createCollection(collectionName, fields, meta = {}) {
  try {
    const token = await directus.getToken()
    if (!token) throw new Error('Não autenticado')

    // Verifica se a collection já existe
    const checkResponse = await fetch(`${DIRECTUS_URL}/collections/${collectionName}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (checkResponse.ok) {
      console.log(`⚠️  Collection "${collectionName}" já existe, pulando criação...`)
      // Verifica campos faltantes
      const existingFieldsResponse = await fetch(`${DIRECTUS_URL}/fields/${collectionName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (existingFieldsResponse.ok) {
        const existingFields = await existingFieldsResponse.json()
        const existingFieldNames = existingFields.data?.map(f => f.field) || []
        
        for (const field of fields) {
          if (!existingFieldNames.includes(field.field)) {
            console.log(`  ➕ Adicionando campo faltante: ${field.field}`)
            await createField(collectionName, field)
          }
        }
      }
      return false
    }

    // Cria a collection
    const createResponse = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection: collectionName,
        meta: {
          collection: collectionName,
          icon: meta.icon || null,
          note: meta.note || null,
          display_template: meta.displayTemplate || null,
          hidden: meta.hidden || false,
          singleton: meta.singleton || false,
          translations: null,
          archive_field: null,
          archive_app_filter: true,
          archive_value: null,
          unarchive_value: null,
          sort_field: null,
        },
        schema: {
          name: collectionName,
        },
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      throw new Error(errorData.errors?.[0]?.message || `HTTP ${createResponse.status}`)
    }

    console.log(`✅ Collection "${collectionName}" criada!`)

    // Cria os campos
    for (const field of fields) {
      await createField(collectionName, field)
    }

    return true
  } catch (error) {
    console.error(`❌ Erro ao criar collection "${collectionName}":`, error.message)
    return false
  }
}

async function createField(collectionName, fieldConfig) {
  try {
    const token = await directus.getToken()
    if (!token) throw new Error('Não autenticado')

    // Verifica se o campo já existe
    const checkResponse = await fetch(`${DIRECTUS_URL}/fields/${collectionName}/${fieldConfig.field}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (checkResponse.ok) {
      console.log(`  ⚠️  Campo "${fieldConfig.field}" já existe, pulando...`)
      return false
    }

    // Cria o campo
    const createResponse = await fetch(`${DIRECTUS_URL}/fields/${collectionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldConfig),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      // Ignora erros de campo já existente
      if (!errorData.errors?.[0]?.message?.includes('already exists')) {
        console.error(`  ❌ Erro ao criar campo "${fieldConfig.field}":`, errorData.errors?.[0]?.message || `HTTP ${createResponse.status}`)
      }
      return false
    }

    console.log(`  ✅ Campo "${fieldConfig.field}" criado!`)
    return true
  } catch (error) {
    console.error(`  ❌ Erro ao criar campo "${fieldConfig.field}":`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Criando collections de mensagens e notificações...\n')

  try {
    await login()

    // 1. Collection: messages
    console.log('\n📦 Criando collection: messages')
    await createCollection(
      'messages',
      [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: true,
            interface: 'input',
            readonly: true,
          },
          schema: {
            is_primary_key: true,
            has_auto_increment: false,
          },
        },
        {
          field: 'sender_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'half',
            special: ['m2o'],
          },
          schema: {
            foreign_key_table: 'directus_users',
            foreign_key_column: 'id',
          },
        },
        {
          field: 'recipient_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'half',
            special: ['m2o'],
          },
          schema: {
            foreign_key_table: 'directus_users',
            foreign_key_column: 'id',
          },
        },
        {
          field: 'subject',
          type: 'string',
          meta: {
            interface: 'input',
            width: 'full',
          },
          schema: {
            is_nullable: true,
          },
        },
        {
          field: 'content',
          type: 'text',
          meta: {
            required: true,
            interface: 'input-multiline',
            width: 'full',
          },
        },
        {
          field: 'read',
          type: 'boolean',
          meta: {
            interface: 'boolean',
            width: 'half',
          },
          schema: {
            default_value: false,
          },
        },
        {
          field: 'read_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            width: 'half',
          },
          schema: {
            is_nullable: true,
          },
        },
        {
          field: 'created_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            readonly: true,
            width: 'half',
          },
          schema: {
            default_value: 'CURRENT_TIMESTAMP',
          },
        },
      ],
      {
        note: 'Mensagens entre usuários',
        icon: 'mail',
      }
    )

    // 2. Collection: notifications
    console.log('\n📦 Criando collection: notifications')
    await createCollection(
      'notifications',
      [
        {
          field: 'id',
          type: 'uuid',
          meta: {
            hidden: true,
            interface: 'input',
            readonly: true,
          },
          schema: {
            is_primary_key: true,
            has_auto_increment: false,
          },
        },
        {
          field: 'user_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'half',
            special: ['m2o'],
          },
          schema: {
            foreign_key_table: 'directus_users',
            foreign_key_column: 'id',
          },
        },
        {
          field: 'title',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'full',
          },
        },
        {
          field: 'message',
          type: 'text',
          meta: {
            required: true,
            interface: 'input-multiline',
            width: 'full',
          },
        },
        {
          field: 'type',
          type: 'string',
          meta: {
            required: true,
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Mensagem', value: 'message' },
                { text: 'Contato', value: 'contact' },
                { text: 'Sistema', value: 'system' },
                { text: 'Aviso', value: 'warning' },
                { text: 'Informação', value: 'info' },
              ],
            },
          },
          schema: {
            default_value: 'info',
          },
        },
        {
          field: 'read',
          type: 'boolean',
          meta: {
            interface: 'boolean',
            width: 'half',
          },
          schema: {
            default_value: false,
          },
        },
        {
          field: 'read_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            width: 'half',
          },
          schema: {
            is_nullable: true,
          },
        },
        {
          field: 'link',
          type: 'string',
          meta: {
            interface: 'input',
            width: 'full',
          },
          schema: {
            is_nullable: true,
          },
        },
        {
          field: 'related_id',
          type: 'string',
          meta: {
            interface: 'input',
            width: 'full',
          },
          schema: {
            is_nullable: true,
          },
        },
        {
          field: 'created_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            readonly: true,
            width: 'half',
          },
          schema: {
            default_value: 'CURRENT_TIMESTAMP',
          },
        },
      ],
      {
        note: 'Notificações do sistema para usuários',
        icon: 'notifications',
      }
    )

    console.log('\n✅ Collections criadas com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Configure as permissões para as collections "messages" e "notifications" no painel admin do Directus')
    console.log('2. Usuários autenticados devem poder criar e ler suas próprias mensagens/notificações')
    console.log('3. Teste o sistema de comunicação interna')

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error.message)
    process.exit(1)
  }
}

main()

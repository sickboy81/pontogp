#!/usr/bin/env node
/**
 * Script para criar as collections faltantes no Directus
 * Executa: node scripts/create_missing_collections.mjs
 */

import { createDirectus, rest, authentication, staticToken } from '@directus/sdk'

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@pontogp.com'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || ''

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
      console.log(`⚠️  Collection "${collectionName}" já existe, pulando...`)
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
          ...meta,
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
  console.log('🚀 Iniciando criação de collections...\n')

  try {
    await login()

    // 1. Collection: settings
    console.log('\n📦 Criando collection: settings')
    await createCollection(
      'settings',
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
          field: 'key',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'full',
          },
          schema: {
            is_unique: true,
          },
        },
        {
          field: 'enabled',
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
          field: 'message',
          type: 'text',
          meta: {
            interface: 'input-multiline',
            width: 'full',
          },
        },
        {
          field: 'value',
          type: 'json',
          meta: {
            interface: 'input-code',
            width: 'full',
          },
        },
      ],
      {
        note: 'Configurações globais do sistema',
        singleton: false,
      }
    )

    // 2. Collection: verification_requests
    console.log('\n📦 Criando collection: verification_requests')
    await createCollection(
      'verification_requests',
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
          },
        },
        {
          field: 'user_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'full',
          },
          schema: {
            foreign_key_table: 'directus_users',
          },
        },
        {
          field: 'document_front',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'file-image',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'directus_files',
          },
        },
        {
          field: 'document_back',
          type: 'uuid',
          meta: {
            interface: 'file-image',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'directus_files',
            is_nullable: true,
          },
        },
        {
          field: 'selfie',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'file-image',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'directus_files',
          },
        },
        {
          field: 'status',
          type: 'string',
          meta: {
            required: true,
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Pendente', value: 'pending' },
                { text: 'Em Revisão', value: 'under_review' },
                { text: 'Aprovado', value: 'approved' },
                { text: 'Rejeitado', value: 'rejected' },
              ],
            },
          },
          schema: {
            default_value: 'pending',
          },
        },
        {
          field: 'rejection_reason',
          type: 'text',
          meta: {
            interface: 'input-multiline',
            width: 'full',
          },
          schema: {
            is_nullable: true,
          },
        },
        {
          field: 'reviewed_by',
          type: 'uuid',
          meta: {
            interface: 'select-dropdown-m2o',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'directus_users',
            is_nullable: true,
          },
        },
        {
          field: 'reviewed_at',
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
        {
          field: 'updated_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            readonly: true,
            width: 'half',
          },
          schema: {
            default_value: 'CURRENT_TIMESTAMP',
            on_update: 'CURRENT_TIMESTAMP',
          },
        },
      ],
      {
        note: 'Solicitações de verificação de perfis',
      }
    )

    // 3. Collection: plans
    console.log('\n📦 Criando collection: plans')
    await createCollection(
      'plans',
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
          },
        },
        {
          field: 'name',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'full',
          },
        },
        {
          field: 'slug',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'full',
          },
          schema: {
            is_unique: true,
          },
        },
        {
          field: 'price',
          type: 'decimal',
          meta: {
            required: true,
            interface: 'input',
            width: 'half',
          },
          schema: {
            default_value: 0,
          },
        },
        {
          field: 'features',
          type: 'json',
          meta: {
            interface: 'input-code',
            width: 'full',
          },
        },
        {
          field: 'max_photos',
          type: 'integer',
          meta: {
            interface: 'input',
            width: 'half',
          },
          schema: {
            default_value: 5,
          },
        },
        {
          field: 'max_videos',
          type: 'integer',
          meta: {
            interface: 'input',
            width: 'half',
          },
          schema: {
            default_value: 2,
          },
        },
        {
          field: 'featured',
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
          field: 'verified_badge',
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
          field: 'analytics',
          type: 'boolean',
          meta: {
            interface: 'boolean',
            width: 'half',
          },
          schema: {
            default_value: false,
          },
        },
      ],
      {
        note: 'Planos de assinatura',
      }
    )

    // 4. Collection: subscriptions
    console.log('\n📦 Criando collection: subscriptions')
    await createCollection(
      'subscriptions',
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
          },
        },
        {
          field: 'user_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'directus_users',
          },
        },
        {
          field: 'plan_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'plans',
          },
        },
        {
          field: 'status',
          type: 'string',
          meta: {
            required: true,
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Ativa', value: 'active' },
                { text: 'Cancelada', value: 'cancelled' },
                { text: 'Expirada', value: 'expired' },
              ],
            },
          },
          schema: {
            default_value: 'active',
          },
        },
        {
          field: 'starts_at',
          type: 'timestamp',
          meta: {
            required: true,
            interface: 'datetime',
            width: 'half',
          },
        },
        {
          field: 'expires_at',
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
        {
          field: 'updated_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            readonly: true,
            width: 'half',
          },
          schema: {
            default_value: 'CURRENT_TIMESTAMP',
            on_update: 'CURRENT_TIMESTAMP',
          },
        },
      ],
      {
        note: 'Assinaturas dos usuários',
      }
    )

    // 5. Collection: reports
    console.log('\n📦 Criando collection: reports')
    await createCollection(
      'reports',
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
          },
        },
        {
          field: 'reported_profile_id',
          type: 'uuid',
          meta: {
            required: true,
            interface: 'select-dropdown-m2o',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'profiles',
          },
        },
        {
          field: 'reporter_id',
          type: 'uuid',
          meta: {
            interface: 'select-dropdown-m2o',
            width: 'half',
          },
          schema: {
            foreign_key_table: 'directus_users',
            is_nullable: true,
          },
        },
        {
          field: 'reason',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'full',
          },
        },
        {
          field: 'description',
          type: 'text',
          meta: {
            required: true,
            interface: 'input-multiline',
            width: 'full',
          },
        },
        {
          field: 'status',
          type: 'string',
          meta: {
            required: true,
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Pendente', value: 'pending' },
                { text: 'Revisado', value: 'reviewed' },
                { text: 'Resolvido', value: 'resolved' },
              ],
            },
          },
          schema: {
            default_value: 'pending',
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
        {
          field: 'updated_at',
          type: 'timestamp',
          meta: {
            interface: 'datetime',
            readonly: true,
            width: 'half',
          },
          schema: {
            default_value: 'CURRENT_TIMESTAMP',
            on_update: 'CURRENT_TIMESTAMP',
          },
        },
      ],
      {
        note: 'Denúncias de perfis',
      }
    )

    // 6. Collection: contacts
    console.log('\n📦 Criando collection: contacts')
    await createCollection(
      'contacts',
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
          },
        },
        {
          field: 'name',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'half',
          },
        },
        {
          field: 'email',
          type: 'string',
          meta: {
            required: true,
            interface: 'input',
            width: 'half',
          },
        },
        {
          field: 'subject',
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
        note: 'Mensagens de contato',
      }
    )

    console.log('\n✅ Todas as collections foram processadas!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Configure as permissões para cada collection no painel admin do Directus')
    console.log('2. Crie planos iniciais (free, premium, vip) na collection "plans"')
    console.log('3. Teste as funcionalidades do painel admin')

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error.message)
    process.exit(1)
  }
}

main()

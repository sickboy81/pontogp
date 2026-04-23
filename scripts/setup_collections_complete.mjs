#!/usr/bin/env node
/**
 * Script completo para configurar todas as collections do Directus
 * Cria campos, configura permissões básicas e cria dados iniciais
 */

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

let accessToken = ''

async function login() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.data.access_token
    console.log('✅ Login realizado com sucesso!')
    return accessToken
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message)
    throw error
  }
}

async function createField(collection, fieldConfig) {
  try {
    const checkResponse = await fetch(`${DIRECTUS_URL}/fields/${collection}/${fieldConfig.field}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (checkResponse.ok) {
      console.log(`  ⚠️  Campo "${fieldConfig.field}" já existe, pulando...`)
      return false
    }

    const createResponse = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldConfig),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      if (errorData.errors?.[0]?.message?.includes('already exists')) {
        console.log(`  ⚠️  Campo "${fieldConfig.field}" já existe, pulando...`)
        return false
      }
      throw new Error(errorData.errors?.[0]?.message || `HTTP ${createResponse.status}`)
    }

    console.log(`  ✅ Campo "${fieldConfig.field}" criado!`)
    return true
  } catch (error) {
    console.error(`  ❌ Erro ao criar campo "${fieldConfig.field}":`, error.message)
    return false
  }
}

async function setupSettingsFields() {
  console.log('\n📦 Configurando campos da collection: settings')
  
  const fields = [
    {
      field: 'key',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'full', note: 'Chave única da configuração' },
      schema: { is_unique: true, is_nullable: false },
    },
    {
      field: 'enabled',
      type: 'boolean',
      meta: { interface: 'boolean', width: 'half', note: 'Ativo/Inativo' },
      schema: { default_value: false, is_nullable: true },
    },
    {
      field: 'message',
      type: 'text',
      meta: { interface: 'input-multiline', width: 'full', note: 'Mensagem de manutenção' },
      schema: { is_nullable: true },
    },
    {
      field: 'value',
      type: 'json',
      meta: { interface: 'input-code', width: 'full', note: 'Valor JSON da configuração' },
      schema: { is_nullable: true },
    },
  ]

  for (const field of fields) {
    await createField('settings', field)
  }
}

async function setupVerificationRequestsFields() {
  console.log('\n📦 Configurando campos da collection: verification_requests')
  
  const fields = [
    {
      field: 'user_id',
      type: 'uuid',
      meta: { required: true, interface: 'select-dropdown-m2o', width: 'full', note: 'Usuário solicitante' },
      schema: { foreign_key_table: 'directus_users', is_nullable: false },
    },
    {
      field: 'document_front',
      type: 'uuid',
      meta: { required: true, interface: 'file-image', width: 'half', note: 'Frente do documento' },
      schema: { foreign_key_table: 'directus_files', is_nullable: false },
    },
    {
      field: 'document_back',
      type: 'uuid',
      meta: { interface: 'file-image', width: 'half', note: 'Verso do documento (opcional)' },
      schema: { foreign_key_table: 'directus_files', is_nullable: true },
    },
    {
      field: 'selfie',
      type: 'uuid',
      meta: { required: true, interface: 'file-image', width: 'half', note: 'Selfie com documento' },
      schema: { foreign_key_table: 'directus_files', is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        required: true,
        interface: 'select-dropdown',
        width: 'half',
        note: 'Status da solicitação',
        options: {
          choices: [
            { text: 'Pendente', value: 'pending' },
            { text: 'Em Revisão', value: 'under_review' },
            { text: 'Aprovado', value: 'approved' },
            { text: 'Rejeitado', value: 'rejected' },
          ],
        },
      },
      schema: { default_value: 'pending', is_nullable: false },
    },
    {
      field: 'rejection_reason',
      type: 'text',
      meta: { interface: 'input-multiline', width: 'full', note: 'Motivo da rejeição' },
      schema: { is_nullable: true },
    },
    {
      field: 'reviewed_by',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', width: 'half', note: 'Revisor' },
      schema: { foreign_key_table: 'directus_users', is_nullable: true },
    },
    {
      field: 'reviewed_at',
      type: 'timestamp',
      meta: { interface: 'datetime', width: 'half', note: 'Data da revisão' },
      schema: { is_nullable: true },
    },
  ]

  for (const field of fields) {
    await createField('verification_requests', field)
  }
}

async function setupPlansFields() {
  console.log('\n📦 Configurando campos da collection: plans')
  
  const fields = [
    {
      field: 'name',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'full', note: 'Nome do plano' },
      schema: { is_nullable: false },
    },
    {
      field: 'slug',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'full', note: 'Slug único do plano' },
      schema: { is_unique: true, is_nullable: false },
    },
    {
      field: 'price',
      type: 'decimal',
      meta: { required: true, interface: 'input', width: 'half', note: 'Preço do plano' },
      schema: { default_value: 0, is_nullable: false },
    },
    {
      field: 'features',
      type: 'json',
      meta: { interface: 'input-code', width: 'full', note: 'Lista de recursos do plano (JSON)' },
      schema: { is_nullable: true },
    },
    {
      field: 'max_photos',
      type: 'integer',
      meta: { interface: 'input', width: 'half', note: 'Máximo de fotos' },
      schema: { default_value: 5, is_nullable: true },
    },
    {
      field: 'max_videos',
      type: 'integer',
      meta: { interface: 'input', width: 'half', note: 'Máximo de vídeos' },
      schema: { default_value: 2, is_nullable: true },
    },
    {
      field: 'featured',
      type: 'boolean',
      meta: { interface: 'boolean', width: 'half', note: 'Permite destaque' },
      schema: { default_value: false, is_nullable: true },
    },
    {
      field: 'verified_badge',
      type: 'boolean',
      meta: { interface: 'boolean', width: 'half', note: 'Permite badge verificado' },
      schema: { default_value: false, is_nullable: true },
    },
    {
      field: 'analytics',
      type: 'boolean',
      meta: { interface: 'boolean', width: 'half', note: 'Inclui analytics' },
      schema: { default_value: false, is_nullable: true },
    },
  ]

  for (const field of fields) {
    await createField('plans', field)
  }
}

async function setupSubscriptionsFields() {
  console.log('\n📦 Configurando campos da collection: subscriptions')
  
  const fields = [
    {
      field: 'user_id',
      type: 'uuid',
      meta: { required: true, interface: 'select-dropdown-m2o', width: 'half', note: 'Usuário' },
      schema: { foreign_key_table: 'directus_users', is_nullable: false },
    },
    {
      field: 'plan_id',
      type: 'uuid',
      meta: { required: true, interface: 'select-dropdown-m2o', width: 'half', note: 'Plano' },
      schema: { foreign_key_table: 'plans', is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        required: true,
        interface: 'select-dropdown',
        width: 'half',
        note: 'Status da assinatura',
        options: {
          choices: [
            { text: 'Ativa', value: 'active' },
            { text: 'Cancelada', value: 'cancelled' },
            { text: 'Expirada', value: 'expired' },
          ],
        },
      },
      schema: { default_value: 'active', is_nullable: false },
    },
    {
      field: 'starts_at',
      type: 'timestamp',
      meta: { required: true, interface: 'datetime', width: 'half', note: 'Data de início' },
      schema: { is_nullable: false },
    },
    {
      field: 'expires_at',
      type: 'timestamp',
      meta: { interface: 'datetime', width: 'half', note: 'Data de expiração' },
      schema: { is_nullable: true },
    },
  ]

  for (const field of fields) {
    await createField('subscriptions', field)
  }
}

async function setupReportsFields() {
  console.log('\n📦 Configurando campos da collection: reports')
  
  const fields = [
    {
      field: 'reported_profile_id',
      type: 'uuid',
      meta: { required: true, interface: 'select-dropdown-m2o', width: 'half', note: 'Perfil denunciado' },
      schema: { foreign_key_table: 'profiles', is_nullable: false },
    },
    {
      field: 'reporter_id',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', width: 'half', note: 'Usuário que denunciou' },
      schema: { foreign_key_table: 'directus_users', is_nullable: true },
    },
    {
      field: 'reason',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'full', note: 'Motivo da denúncia' },
      schema: { is_nullable: false },
    },
    {
      field: 'description',
      type: 'text',
      meta: { required: true, interface: 'input-multiline', width: 'full', note: 'Descrição detalhada' },
      schema: { is_nullable: false },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        required: true,
        interface: 'select-dropdown',
        width: 'half',
        note: 'Status da denúncia',
        options: {
          choices: [
            { text: 'Pendente', value: 'pending' },
            { text: 'Revisado', value: 'reviewed' },
            { text: 'Resolvido', value: 'resolved' },
          ],
        },
      },
      schema: { default_value: 'pending', is_nullable: false },
    },
  ]

  for (const field of fields) {
    await createField('reports', field)
  }
}

async function setupContactsFields() {
  console.log('\n📦 Configurando campos da collection: contacts')
  
  const fields = [
    {
      field: 'name',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'half', note: 'Nome do contato' },
      schema: { is_nullable: false },
    },
    {
      field: 'email',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'half', note: 'Email do contato' },
      schema: { is_nullable: false },
    },
    {
      field: 'subject',
      type: 'string',
      meta: { required: true, interface: 'input', width: 'full', note: 'Assunto' },
      schema: { is_nullable: false },
    },
    {
      field: 'message',
      type: 'text',
      meta: { required: true, interface: 'input-multiline', width: 'full', note: 'Mensagem' },
      schema: { is_nullable: false },
    },
  ]

  for (const field of fields) {
    await createField('contacts', field)
  }
}

async function createInitialPlans() {
  console.log('\n📦 Criando planos iniciais...')
  
  const plans = [
    {
      name: 'Grátis',
      slug: 'free',
      price: 0,
      features: ['Perfil básico', 'Até 3 fotos', 'Sem destaque'],
      max_photos: 3,
      max_videos: 0,
      featured: false,
      verified_badge: false,
      analytics: false,
    },
    {
      name: 'Premium',
      slug: 'premium',
      price: 49.90,
      features: ['Perfil completo', 'Até 10 fotos', 'Até 2 vídeos', 'Destaque mensal'],
      max_photos: 10,
      max_videos: 2,
      featured: true,
      verified_badge: false,
      analytics: true,
    },
    {
      name: 'VIP',
      slug: 'vip',
      price: 99.90,
      features: ['Perfil completo', 'Fotos ilimitadas', 'Vídeos ilimitados', 'Destaque permanente', 'Badge verificado', 'Analytics avançado'],
      max_photos: 999,
      max_videos: 999,
      featured: true,
      verified_badge: true,
      analytics: true,
    },
  ]

  for (const plan of plans) {
    try {
      // Verifica se o plano já existe
      const checkResponse = await fetch(`${DIRECTUS_URL}/items/plans?filter[slug][_eq]=${plan.slug}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (checkResponse.ok) {
        const data = await checkResponse.json()
        if (data.data && data.data.length > 0) {
          console.log(`  ⚠️  Plano "${plan.name}" já existe, pulando...`)
          continue
        }
      }

      // Cria o plano
      const createResponse = await fetch(`${DIRECTUS_URL}/items/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        throw new Error(errorData.errors?.[0]?.message || `HTTP ${createResponse.status}`)
      }

      console.log(`  ✅ Plano "${plan.name}" criado!`)
    } catch (error) {
      console.error(`  ❌ Erro ao criar plano "${plan.name}":`, error.message)
    }
  }
}

async function setupPermissions() {
  console.log('\n📦 Configurando permissões básicas...')
  console.log('  ℹ️  Permissões precisam ser configuradas manualmente no painel admin do Directus')
  console.log('  ℹ️  Acesse: Settings → Roles & Permissions')
}

async function main() {
  console.log('🚀 Iniciando configuração completa das collections...\n')

  try {
    await login()

    // Configurar campos de todas as collections
    await setupSettingsFields()
    await setupVerificationRequestsFields()
    await setupPlansFields()
    await setupSubscriptionsFields()
    await setupReportsFields()
    await setupContactsFields()

    // Criar planos iniciais
    await createInitialPlans()

    // Setup de permissões
    await setupPermissions()

    console.log('\n✅ Configuração completa finalizada!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Configure as permissões manualmente no painel admin: Settings → Roles & Permissions')
    console.log('2. Teste as funcionalidades do painel admin')
    console.log('3. Crie uma configuração de manutenção inicial se necessário')

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error.message)
    process.exit(1)
  }
}

main()

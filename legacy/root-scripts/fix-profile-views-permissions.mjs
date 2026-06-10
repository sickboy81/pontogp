/**
 * Script para configurar permissões da collection profile_views no Directus 11
 * Permite que usuários públicos e autenticados criem registros de visualização
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis do .env
const envPath = path.join(__dirname, '..', '.env')
const env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    }
  })
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD

async function main() {
  console.log('🔧 Configurando permissões para profile_views...\n')
  
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Credenciais de admin não encontradas no .env')
    console.error('   Adicione: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD')
    process.exit(1)
  }

  // 1. Login como admin
  console.log('🔐 Fazendo login como admin...')
  const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  })

  if (!loginResponse.ok) {
    console.error('❌ Falha no login:', await loginResponse.text())
    process.exit(1)
  }

  const { data: authData } = await loginResponse.json()
  const token = authData.access_token
  console.log('✅ Login realizado com sucesso\n')

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  // 2. Verificar se a collection profile_views existe
  console.log('📋 Verificando collection profile_views...')
  const collectionsResponse = await fetch(`${DIRECTUS_URL}/collections/profile_views`, { headers })
  
  if (!collectionsResponse.ok) {
    console.log('⚠️ Collection profile_views não existe. Criando...')
    
    // Criar a collection
    const createCollectionResponse = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: 'profile_views',
        meta: {
          collection: 'profile_views',
          icon: 'visibility',
          note: 'Analytics de visualizações de perfil',
          hidden: false,
          singleton: false
        },
        schema: {
          name: 'profile_views'
        }
      })
    })

    if (!createCollectionResponse.ok) {
      const error = await createCollectionResponse.text()
      console.error('❌ Erro ao criar collection:', error)
      process.exit(1)
    }
    console.log('✅ Collection profile_views criada')

    // Criar campos
    const fields = [
      {
        field: 'profile_id',
        type: 'uuid',
        meta: { interface: 'input', note: 'ID do perfil visualizado' },
        schema: {}
      },
      {
        field: 'ip_address',
        type: 'string',
        meta: { interface: 'input', note: 'IP do visitante' },
        schema: { max_length: 45 }
      },
      {
        field: 'user_agent',
        type: 'text',
        meta: { interface: 'input-multiline', note: 'User agent do navegador' },
        schema: {}
      },
      {
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', special: ['date-created'] },
        schema: {}
      }
    ]

    for (const field of fields) {
      const createFieldResponse = await fetch(`${DIRECTUS_URL}/fields/profile_views`, {
        method: 'POST',
        headers,
        body: JSON.stringify(field)
      })
      
      if (createFieldResponse.ok) {
        console.log(`   ✅ Campo ${field.field} criado`)
      } else {
        console.log(`   ⚠️ Campo ${field.field}: ${await createFieldResponse.text()}`)
      }
    }
  } else {
    console.log('✅ Collection profile_views já existe')
  }

  // 3. Buscar policy do role "Public"
  console.log('\n🔍 Buscando policy do role Public...')
  
  // Buscar o role Public (geralmente tem ID null ou é um role específico)
  const rolesResponse = await fetch(`${DIRECTUS_URL}/roles`, { headers })
  const rolesData = await rolesResponse.json()
  
  // Public role geralmente não está listado, precisamos buscar policies sem role
  const policiesResponse = await fetch(`${DIRECTUS_URL}/policies`, { headers })
  const policiesData = await policiesResponse.json()
  
  let publicPolicyId = null
  let authenticatedPolicyId = null
  
  if (policiesData.data) {
    for (const policy of policiesData.data) {
      const policyName = policy.name?.toLowerCase() || ''
      if (policyName.includes('public') || policy.id === 'abf8a154-5b1c-4a46-ac9c-7300570f4f17') {
        publicPolicyId = policy.id
        console.log(`   ✅ Policy Public encontrada: ${policy.id}`)
      }
      if (policyName.includes('authenticated') || policyName.includes('user')) {
        authenticatedPolicyId = policy.id
        console.log(`   ✅ Policy Authenticated encontrada: ${policy.id}`)
      }
    }
  }

  // Se não encontrou, buscar a policy através dos access
  if (!publicPolicyId || !authenticatedPolicyId) {
    console.log('   Buscando policies através de access...')
    const accessResponse = await fetch(`${DIRECTUS_URL}/access?fields=*,policy.*`, { headers })
    const accessData = await accessResponse.json()
    
    if (accessData.data) {
      for (const access of accessData.data) {
        if (access.role === null && access.policy) {
          publicPolicyId = access.policy.id || access.policy
          console.log(`   ✅ Policy Public (via access): ${publicPolicyId}`)
        }
        if (access.role && access.policy) {
          // Buscar info do role
          const roleId = access.role
          const roleInfo = rolesData.data?.find(r => r.id === roleId)
          if (roleInfo?.name?.toLowerCase().includes('authenticated') || 
              roleInfo?.name?.toLowerCase().includes('user')) {
            authenticatedPolicyId = access.policy.id || access.policy
            console.log(`   ✅ Policy Authenticated (via access): ${authenticatedPolicyId}`)
          }
        }
      }
    }
  }

  // 4. Criar permissões para profile_views
  console.log('\n📝 Configurando permissões para profile_views...')
  
  const policiesToConfigure = []
  if (publicPolicyId) policiesToConfigure.push({ id: publicPolicyId, name: 'Public' })
  if (authenticatedPolicyId) policiesToConfigure.push({ id: authenticatedPolicyId, name: 'Authenticated' })
  
  // Se não encontrou nenhuma policy, criar permissão sem policy (fallback)
  if (policiesToConfigure.length === 0) {
    console.log('   ⚠️ Nenhuma policy encontrada. Criando permissão global...')
    policiesToConfigure.push({ id: null, name: 'Global' })
  }

  for (const policyInfo of policiesToConfigure) {
    // Verificar se já existe permissão CREATE
    const existingPermsResponse = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=profile_views&filter[action][_eq]=create${policyInfo.id ? `&filter[policy][_eq]=${policyInfo.id}` : ''}`,
      { headers }
    )
    const existingPerms = await existingPermsResponse.json()
    
    if (existingPerms.data && existingPerms.data.length > 0) {
      console.log(`   ✅ Permissão CREATE já existe para ${policyInfo.name}`)
      continue
    }

    // Criar permissão CREATE
    const permPayload = {
      collection: 'profile_views',
      action: 'create',
      fields: ['*']
    }
    
    if (policyInfo.id) {
      permPayload.policy = policyInfo.id
    }

    const createPermResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(permPayload)
    })

    if (createPermResponse.ok) {
      console.log(`   ✅ Permissão CREATE criada para ${policyInfo.name}`)
    } else {
      const error = await createPermResponse.text()
      console.log(`   ⚠️ Erro ao criar permissão para ${policyInfo.name}: ${error}`)
    }
  }

  // 5. Também configurar permissões para profile_clicks (mesmo problema pode ocorrer)
  console.log('\n📝 Configurando permissões para profile_clicks...')
  
  // Verificar se a collection existe
  const clicksCollectionResponse = await fetch(`${DIRECTUS_URL}/collections/profile_clicks`, { headers })
  
  if (!clicksCollectionResponse.ok) {
    console.log('   ⚠️ Collection profile_clicks não existe. Criando...')
    
    const createClicksResponse = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: 'profile_clicks',
        meta: {
          collection: 'profile_clicks',
          icon: 'mouse',
          note: 'Analytics de cliques em contatos',
          hidden: false,
          singleton: false
        },
        schema: {
          name: 'profile_clicks'
        }
      })
    })

    if (createClicksResponse.ok) {
      console.log('   ✅ Collection profile_clicks criada')
      
      // Criar campos
      const clickFields = [
        {
          field: 'profile_id',
          type: 'uuid',
          meta: { interface: 'input' },
          schema: {}
        },
        {
          field: 'contact_type',
          type: 'string',
          meta: { 
            interface: 'select-dropdown',
            options: { choices: [
              { text: 'WhatsApp', value: 'whatsapp' },
              { text: 'Telegram', value: 'telegram' },
              { text: 'Phone', value: 'phone' },
              { text: 'Instagram', value: 'instagram' },
              { text: 'Twitter', value: 'twitter' }
            ]}
          },
          schema: { max_length: 20 }
        },
        {
          field: 'created_at',
          type: 'timestamp',
          meta: { interface: 'datetime', special: ['date-created'] },
          schema: {}
        }
      ]

      for (const field of clickFields) {
        await fetch(`${DIRECTUS_URL}/fields/profile_clicks`, {
          method: 'POST',
          headers,
          body: JSON.stringify(field)
        })
      }
    }
  }

  // Criar permissões para profile_clicks
  for (const policyInfo of policiesToConfigure) {
    const existingPermsResponse = await fetch(
      `${DIRECTUS_URL}/permissions?filter[collection][_eq]=profile_clicks&filter[action][_eq]=create${policyInfo.id ? `&filter[policy][_eq]=${policyInfo.id}` : ''}`,
      { headers }
    )
    const existingPerms = await existingPermsResponse.json()
    
    if (existingPerms.data && existingPerms.data.length === 0) {
      const permPayload = {
        collection: 'profile_clicks',
        action: 'create',
        fields: ['*']
      }
      
      if (policyInfo.id) {
        permPayload.policy = policyInfo.id
      }

      const createPermResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(permPayload)
      })

      if (createPermResponse.ok) {
        console.log(`   ✅ Permissão CREATE criada para profile_clicks (${policyInfo.name})`)
      }
    } else {
      console.log(`   ✅ Permissão CREATE já existe para profile_clicks (${policyInfo.name})`)
    }
  }

  console.log('\n✅ Configuração concluída!')
  console.log('\n📋 Resumo:')
  console.log('   - profile_views: Permissão CREATE configurada')
  console.log('   - profile_clicks: Permissão CREATE configurada')
  console.log('\n⚠️ Reinicie o Directus para garantir que as permissões sejam aplicadas')
}

main().catch(console.error)

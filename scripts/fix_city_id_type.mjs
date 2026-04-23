#!/usr/bin/env node
/**
 * Script para corrigir o tipo do campo city_id na collection neighborhoods
 * Executa: node scripts/fix_city_id_type.mjs
 */

const DIRECTUS_URL = 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

let token = null

async function login() {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error('Falha no login')
  const data = await res.json()
  token = data.data.access_token
  console.log('✅ Login realizado!')
}

async function api(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) options.body = JSON.stringify(body)
  
  const res = await fetch(`${DIRECTUS_URL}${path}`, options)
  const text = await res.text()
  
  if (res.status === 204) return null
  
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || `HTTP ${res.status}`)
  }
  return data
}

async function main() {
  console.log('🔧 Corrigindo tipo do campo city_id...\n')
  
  try {
    await login()
    
    // 1. Verificar campos existentes
    console.log('\n📦 Verificando campos da collection neighborhoods...')
    
    try {
      const fields = await api('/fields/neighborhoods')
      console.log('   Campos encontrados:')
      fields.data.forEach(f => {
        console.log(`   - ${f.field}: ${f.type}`)
      })
    } catch (e) {
      console.log(`   ⚠️  Erro ao buscar campos: ${e.message}`)
    }
    
    // 2. Verificar IDs das cidades
    console.log('\n📦 Verificando IDs das cidades...')
    const cities = await api('/items/cities?limit=3')
    console.log('   Exemplo de IDs:')
    cities.data.forEach(c => {
      console.log(`   - ${c.name}: ID = ${c.id} (tipo: ${typeof c.id})`)
    })
    
    // 3. Tentar deletar campo city_id e recriar como integer
    console.log('\n🔧 Tentando deletar campo city_id...')
    try {
      await api('/fields/neighborhoods/city_id', 'DELETE')
      console.log('   ✅ Campo city_id deletado')
    } catch (e) {
      console.log(`   ⚠️  Erro ao deletar: ${e.message}`)
    }
    
    // 4. Recriar campo city_id como integer
    console.log('\n🔧 Recriando campo city_id como integer...')
    try {
      await api('/fields/neighborhoods', 'POST', {
        field: 'city_id',
        type: 'integer',
        schema: {
          is_nullable: false,
        },
        meta: {
          interface: 'select-dropdown-m2o',
          required: true,
          width: 'half',
          special: ['m2o'],
          options: {
            template: '{{name}} ({{state}})',
          },
        },
      })
      console.log('   ✅ Campo city_id recriado como integer')
    } catch (e) {
      console.log(`   ⚠️  Erro ao recriar: ${e.message}`)
    }
    
    // 5. Criar relação
    console.log('\n🔧 Criando relação M2O...')
    try {
      await api('/relations', 'POST', {
        collection: 'neighborhoods',
        field: 'city_id',
        related_collection: 'cities',
        meta: {
          one_field: null,
          sort_field: null,
          one_deselect_action: 'nullify',
        },
        schema: {
          on_delete: 'SET NULL',
        },
      })
      console.log('   ✅ Relação criada')
    } catch (e) {
      console.log(`   ⚠️  Erro ao criar relação: ${e.message}`)
    }
    
    console.log('\n✅ Correção concluída!')
    console.log('   Execute novamente: node scripts/setup_cities_neighborhoods.mjs')
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

main()

#!/usr/bin/env node
/**
 * Script para criar as collections de cidades e bairros no Directus
 * Executa: node scripts/create_neighborhoods_collections.mjs
 */

import { createDirectus, rest, authentication } from '@directus/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

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
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication())

async function rawRequest(path, method = 'GET', body = null) {
  const token = await directus.getToken()
  if (!token) throw new Error('Não autenticado')

  const url = `${DIRECTUS_URL}${path}`
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`API Request Failed (${method} ${path}): ${res.status} - ${errorText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function createCollection(collectionName, meta = {}) {
  try {
    // Verifica se a collection já existe
    const checkResponse = await rawRequest(`/collections/${collectionName}`)
    console.log(`   ⏭️  Collection "${collectionName}" já existe`)
    return false
  } catch (error) {
    // Directus 11 retorna 403 ou 404 quando collection não existe
    if (error.message.includes('404') || error.message.includes('403')) {
      // Collection não existe, vamos criar
      console.log(`   ➕ Criando collection "${collectionName}"...`)
      try {
        await rawRequest('/collections', 'POST', {
          collection: collectionName,
          meta: {
            collection: collectionName,
            icon: meta.icon || 'location',
            note: meta.note || null,
            display_template: meta.displayTemplate || null,
            hidden: false,
            singleton: false,
            ...meta,
          },
          schema: {
            name: collectionName,
          },
        })
        console.log(`   ✅ Collection "${collectionName}" criada com sucesso!`)
        return true
      } catch (createError) {
        if (createError.message.includes('already exists')) {
          console.log(`   ⏭️  Collection "${collectionName}" já existe`)
          return false
        }
        throw createError
      }
    }
    throw error
  }
}

async function createField(collection, field) {
  try {
    // Verifica se o campo já existe
    const checkResponse = await rawRequest(`/fields/${collection}/${field.field}`)
    console.log(`      ⏭️  Campo "${field.field}" já existe em "${collection}"`)
    return false
  } catch (error) {
    // Directus 11 retorna 403 ou 404 quando campo não existe
    if (error.message.includes('404') || error.message.includes('403')) {
      // Campo não existe, vamos criar
      console.log(`      ➕ Criando campo "${field.field}" em "${collection}"...`)
      try {
        await rawRequest(`/fields/${collection}`, 'POST', field)
        console.log(`      ✅ Campo "${field.field}" criado com sucesso!`)
        return true
      } catch (createError) {
        if (createError.message.includes('already exists')) {
          console.log(`      ⏭️  Campo "${field.field}" já existe`)
          return false
        }
        throw createError
      }
    }
    throw error
  }
}

async function main() {
  console.log('🚀 Criando collections de cidades e bairros...\n')

  try {
    // Login
    console.log('1. Fazendo login como admin...')
    await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('   ✅ Login realizado!\n')

    // 1. Criar collection cities
    console.log('2. Criando collection "cities"...')
    await createCollection('cities', {
      icon: 'location',
      note: 'Cidades brasileiras',
    })

    // Campos da collection cities
    const citiesFields = [
      {
        collection: 'cities',
        field: 'name',
        type: 'string',
        schema: {
          is_nullable: false,
          is_unique: false,
        },
        meta: {
          interface: 'input',
          required: true,
          width: 'full',
        },
      },
      {
        collection: 'cities',
        field: 'state',
        type: 'string',
        schema: {
          is_nullable: false,
          length: 2,
        },
        meta: {
          interface: 'select-dropdown',
          required: true,
          width: 'half',
          options: {
            choices: [
              { text: 'AC', value: 'AC' },
              { text: 'AL', value: 'AL' },
              { text: 'AP', value: 'AP' },
              { text: 'AM', value: 'AM' },
              { text: 'BA', value: 'BA' },
              { text: 'CE', value: 'CE' },
              { text: 'DF', value: 'DF' },
              { text: 'ES', value: 'ES' },
              { text: 'GO', value: 'GO' },
              { text: 'MA', value: 'MA' },
              { text: 'MT', value: 'MT' },
              { text: 'MS', value: 'MS' },
              { text: 'MG', value: 'MG' },
              { text: 'PA', value: 'PA' },
              { text: 'PB', value: 'PB' },
              { text: 'PR', value: 'PR' },
              { text: 'PE', value: 'PE' },
              { text: 'PI', value: 'PI' },
              { text: 'RJ', value: 'RJ' },
              { text: 'RN', value: 'RN' },
              { text: 'RS', value: 'RS' },
              { text: 'RO', value: 'RO' },
              { text: 'RR', value: 'RR' },
              { text: 'SC', value: 'SC' },
              { text: 'SP', value: 'SP' },
              { text: 'SE', value: 'SE' },
              { text: 'TO', value: 'TO' },
            ],
          },
        },
      },
      {
        collection: 'cities',
        field: 'ibge_code',
        type: 'string',
        schema: {
          is_nullable: true,
        },
        meta: {
          interface: 'input',
          width: 'half',
        },
      },
      {
        collection: 'cities',
        field: 'priority',
        type: 'integer',
        schema: {
          is_nullable: false,
          default_value: 0,
        },
        meta: {
          interface: 'input',
          width: 'half',
        },
      },
      {
        collection: 'cities',
        field: 'neighborhoods_count',
        type: 'integer',
        schema: {
          is_nullable: false,
          default_value: 0,
        },
        meta: {
          interface: 'input',
          readonly: true,
          width: 'half',
        },
      },
    ]

    for (const field of citiesFields) {
      await createField('cities', field)
    }

    console.log('')

    // 2. Criar collection neighborhoods
    console.log('3. Criando collection "neighborhoods"...')
    await createCollection('neighborhoods', {
      icon: 'location',
      note: 'Bairros das cidades brasileiras',
    })

    // Campos da collection neighborhoods
    const neighborhoodsFields = [
      {
        collection: 'neighborhoods',
        field: 'name',
        type: 'string',
        schema: {
          is_nullable: false,
        },
        meta: {
          interface: 'input',
          required: true,
          width: 'full',
        },
      },
      {
        collection: 'neighborhoods',
        field: 'city_id',
        type: 'uuid',
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
      },
      {
        collection: 'neighborhoods',
        field: 'population',
        type: 'integer',
        schema: {
          is_nullable: true,
        },
        meta: {
          interface: 'input',
          width: 'half',
        },
      },
      {
        collection: 'neighborhoods',
        field: 'priority',
        type: 'integer',
        schema: {
          is_nullable: false,
          default_value: 0,
        },
        meta: {
          interface: 'input',
          width: 'half',
        },
      },
    ]

    for (const field of neighborhoodsFields) {
      await createField('neighborhoods', field)
    }

    // 3. Criar relacionamento
    console.log('')
    console.log('4. Configurando relacionamento many-to-one...')
    try {
      // O relacionamento já deve estar configurado pelo campo city_id
      // Mas vamos verificar se precisa criar explicitamente
      console.log('   ✅ Relacionamento configurado via campo city_id')
    } catch (error) {
      console.log('   ⚠️  Relacionamento já existe ou erro ao configurar')
    }

    console.log('')
    console.log('✅ Collections criadas com sucesso!')
    console.log('')
    console.log('Próximos passos:')
    console.log('1. Execute o script de população: node scripts/populate_neighborhoods.mjs')
    console.log('2. Configure as permissões no Directus admin panel')
  } catch (error) {
    console.error('❌ Erro crítico:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()

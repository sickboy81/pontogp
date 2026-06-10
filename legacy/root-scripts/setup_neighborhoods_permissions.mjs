#!/usr/bin/env node
/**
 * Script para configurar permissões das collections cities e neighborhoods
 * Executa: node scripts/setup_neighborhoods_permissions.mjs
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

async function main() {
  console.log('🚀 Configurando permissões para cities e neighborhoods...\n')

  try {
    // Login
    console.log('1. Fazendo login como admin...')
    await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('   ✅ Login realizado!\n')

    // 1. Buscar políticas
    console.log('2. Buscando políticas...')
    const policiesResponse = await rawRequest('/policies')
    const policies = policiesResponse.data || []
    
    const publicPolicy = policies.find(p => p.name === 'App Public Access')
    const authenticatedPolicy = policies.find(p => p.name === 'App Authenticated Access')

    if (!publicPolicy) {
      throw new Error('Política "App Public Access" não encontrada')
    }
    if (!authenticatedPolicy) {
      throw new Error('Política "App Authenticated Access" não encontrada')
    }

    console.log(`   ✅ Política Public encontrada: ${publicPolicy.id}`)
    console.log(`   ✅ Política Authenticated encontrada: ${authenticatedPolicy.id}\n`)

    // 2. Buscar permissões existentes
    console.log('3. Verificando permissões existentes...')
    const existingPermsResponse = await rawRequest('/permissions')
    const existingPerms = existingPermsResponse.data || []

    // 3. Definir permissões necessárias
    const requiredPermissions = [
      {
        policy: publicPolicy.id,
        collection: 'cities',
        action: 'read',
        fields: ['*'],
      },
      {
        policy: publicPolicy.id,
        collection: 'neighborhoods',
        action: 'read',
        fields: ['*'],
      },
      {
        policy: authenticatedPolicy.id,
        collection: 'cities',
        action: 'read',
        fields: ['*'],
      },
      {
        policy: authenticatedPolicy.id,
        collection: 'neighborhoods',
        action: 'read',
        fields: ['*'],
      },
    ]

    // 4. Criar/Atualizar permissões
    console.log('4. Configurando permissões...\n')
    
    for (const req of requiredPermissions) {
      const existing = existingPerms.find(
        p => p.policy === req.policy &&
             p.collection === req.collection &&
             p.action === req.action
      )

      if (existing) {
        console.log(`   ⏭️  Permissão já existe: ${req.collection} (${req.action}) na política ${req.policy === publicPolicy.id ? 'Public' : 'Authenticated'}`)
        
        // Atualizar campos se necessário
        try {
          await rawRequest(`/permissions/${existing.id}`, 'PATCH', {
            fields: req.fields,
          })
          console.log(`      ✅ Campos atualizados`)
        } catch (error) {
          console.log(`      ⚠️  Erro ao atualizar campos: ${error.message}`)
        }
      } else {
        console.log(`   ➕ Criando permissão: ${req.collection} (${req.action}) na política ${req.policy === publicPolicy.id ? 'Public' : 'Authenticated'}`)
        try {
          await rawRequest('/permissions', 'POST', req)
          console.log(`      ✅ Permissão criada com sucesso!`)
        } catch (error) {
          console.error(`      ❌ Erro ao criar permissão: ${error.message}`)
        }
      }
    }

    console.log('')
    console.log('✅ Permissões configuradas com sucesso!')
    console.log('')
    console.log('Resumo:')
    console.log('- Public: leitura de cities e neighborhoods')
    console.log('- Authenticated: leitura de cities e neighborhoods')
    console.log('- Admin: leitura e escrita completa (já configurado por padrão)')
  } catch (error) {
    console.error('❌ Erro crítico:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()

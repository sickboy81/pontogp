/**
 * Script para adicionar código a perfis que não têm
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ler variáveis do .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env não encontrado')
  }
  
  const content = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  })
  
  return env
}

// Gerar código alfanumérico de 7 dígitos
function generateProfileCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function main() {
  console.log('🔧 Adicionando código aos perfis existentes...\n')
  
  const env = loadEnv()
  
  const directusUrl = env.VITE_DIRECTUS_URL || env.DIRECTUS_URL || 'https://base.pontogp.com'
  const adminEmail = env.DIRECTUS_ADMIN_EMAIL || env.ADMIN_EMAIL
  const adminPassword = env.DIRECTUS_ADMIN_PASSWORD || env.ADMIN_PASSWORD
  const apiToken = env.VITE_DIRECTUS_TOKEN || env.DIRECTUS_TOKEN
  
  if (!adminEmail || !adminPassword) {
    console.error('❌ ERRO: Credenciais de admin não encontradas no .env')
    process.exit(1)
  }
  
  // Login como admin
  console.log('🔐 Fazendo login como administrador...')
  const loginResponse = await fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  })
  
  if (!loginResponse.ok) {
    const error = await loginResponse.text()
    console.error(`❌ ERRO ao fazer login: ${loginResponse.status}`)
    console.error(error)
    process.exit(1)
  }
  
  const loginData = await loginResponse.json()
  const accessToken = loginData.data.access_token
  console.log('✅ Login realizado com sucesso!\n')
  
  // Buscar todos os perfis
  console.log('📋 Buscando perfis...')
  const profilesResponse = await fetch(`${directusUrl}/items/profiles?fields=id,code,name`, {
    headers: {
      'Authorization': `Bearer ${apiToken || accessToken}`,
    }
  })
  
  if (!profilesResponse.ok) {
    console.error('❌ ERRO ao buscar perfis')
    process.exit(1)
  }
  
  const profilesData = await profilesResponse.json()
  const profiles = profilesData.data || []
  
  // Filtrar perfis sem código
  const profilesWithoutCode = profiles.filter(p => !p.code)
  
  console.log(`\n📊 Total de perfis: ${profiles.length}`)
  console.log(`   Com código: ${profiles.length - profilesWithoutCode.length}`)
  console.log(`   Sem código: ${profilesWithoutCode.length}\n`)
  
  if (profilesWithoutCode.length === 0) {
    console.log('✅ Todos os perfis já têm código!')
    process.exit(0)
  }
  
  // Adicionar código aos perfis que não têm
  console.log(`🔄 Adicionando código a ${profilesWithoutCode.length} perfil(is)...\n`)
  
  let updated = 0
  let errors = 0
  
  for (const profile of profilesWithoutCode) {
    try {
      const code = generateProfileCode()
      
      console.log(`   Perfil: ${profile.name} (ID: ${profile.id})`)
      console.log(`   Código gerado: ${code}`)
      
      const updateResponse = await fetch(`${directusUrl}/items/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken || accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })
      
      if (updateResponse.ok) {
        console.log(`   ✅ Código adicionado com sucesso!\n`)
        updated++
      } else {
        const error = await updateResponse.json()
        console.log(`   ❌ Erro ao atualizar: ${updateResponse.status}`)
        console.log(`   ${JSON.stringify(error).slice(0, 100)}\n`)
        errors++
      }
      
      // Pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`)
      errors++
    }
  }
  
  console.log('='.repeat(50))
  console.log('📊 RESUMO:')
  console.log('='.repeat(50))
  console.log(`   ✅ Atualizados: ${updated}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log('')
  
  if (updated > 0) {
    console.log('✅ Códigos adicionados com sucesso!')
    console.log('\n💡 Os perfis agora têm códigos únicos:')
    console.log('   - Código: Identificador alfanumérico de 7 dígitos')
    console.log('   - Data de criação: Automática (created_at)')
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})

/**
 * Script para criar os campos faltantes na collection profiles do Directus
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

async function main() {
  console.log('🔧 Criando campos faltantes na collection profiles...\n')
  
  const env = loadEnv()
  
  const directusUrl = env.VITE_DIRECTUS_URL || env.DIRECTUS_URL || 'https://base.pontogp.com'
  const adminEmail = env.DIRECTUS_ADMIN_EMAIL || env.ADMIN_EMAIL
  const adminPassword = env.DIRECTUS_ADMIN_PASSWORD || env.ADMIN_PASSWORD
  
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
  
  // Campos a serem criados
  const fieldsToCreate = [
    { field: 'code', type: 'string', meta: { interface: 'input', required: false } },
    { field: 'verified', type: 'boolean', meta: { interface: 'boolean', required: false } },
    { field: 'special_services', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'massage_types', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'other_services', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'online_services', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'virtual_fantasies', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'for_sale', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'hair_color', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'height', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'body_type', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'breast_type', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'pubis_type', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'service_locations', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'service_to', type: 'json', meta: { interface: 'tags', required: false } },
    { field: 'certified', type: 'boolean', meta: { interface: 'boolean', required: false } },
    { field: 'prices', type: 'json', meta: { interface: 'json', required: false } },
  ]
  
  console.log(`📝 Criando ${fieldsToCreate.length} campos...\n`)
  
  let created = 0
  let skipped = 0
  let errors = 0
  
  for (const fieldConfig of fieldsToCreate) {
    try {
      console.log(`   Criando campo: ${fieldConfig.field}...`)
      
      const response = await fetch(`${directusUrl}/fields/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldConfig)
      })
      
      if (response.ok) {
        console.log(`   ✅ ${fieldConfig.field} criado com sucesso!`)
        created++
      } else if (response.status === 409) {
        // Campo já existe
        console.log(`   ⚠️ ${fieldConfig.field} já existe, pulando...`)
        skipped++
      } else {
        const error = await response.text()
        console.log(`   ❌ Erro ao criar ${fieldConfig.field}: ${response.status}`)
        console.log(`      ${error.slice(0, 200)}`)
        errors++
      }
    } catch (error) {
      console.log(`   ❌ Erro ao criar ${fieldConfig.field}: ${error.message}`)
      errors++
    }
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMO:')
  console.log('='.repeat(50))
  console.log(`   ✅ Criados: ${created}`)
  console.log(`   ⚠️ Já existiam: ${skipped}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log('')
  
  if (created > 0 || skipped > 0) {
    console.log('✅ Campos criados com sucesso!')
    console.log('\n💡 Agora você pode:')
    console.log('   1. Recarregar a página do perfil')
    console.log('   2. Preencher os campos no Dashboard')
    console.log('   3. Os campos devem aparecer na página do perfil')
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})

/**
 * Script para verificar quais campos existem na collection profiles do Directus
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
  console.log('🔍 Verificando campos da collection profiles...\n')
  
  const env = loadEnv()
  
  const directusUrl = env.VITE_DIRECTUS_URL || env.DIRECTUS_URL || 'https://base.pontogp.com'
  const adminEmail = env.DIRECTUS_ADMIN_EMAIL || env.ADMIN_EMAIL
  const adminPassword = env.DIRECTUS_ADMIN_PASSWORD || env.ADMIN_PASSWORD
  const apiToken = env.VITE_DIRECTUS_TOKEN || env.DIRECTUS_TOKEN
  
  if (!adminEmail || !adminPassword) {
    console.error('❌ ERRO: Credenciais de admin não encontradas no .env')
    console.log('   Adicione DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD ao .env')
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
  
  // Buscar campos da collection profiles
  console.log('📋 Buscando campos da collection profiles...')
  const fieldsResponse = await fetch(`${directusUrl}/fields/profiles`, {
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!fieldsResponse.ok) {
    console.error(`❌ Erro ao buscar campos: ${fieldsResponse.status}`)
    process.exit(1)
  }
  
  const fieldsData = await fieldsResponse.json()
  const fields = fieldsData.data || {}
  
  console.log(`\n✅ Total de campos encontrados: ${Object.keys(fields).length}\n`)
  
  // Listar todos os campos
  console.log('📝 Campos existentes na collection profiles:')
  Object.keys(fields).sort().forEach(fieldName => {
    const field = fields[fieldName]
    const type = field.type || 'unknown'
    const meta = field.meta || {}
    const interfaceType = meta.interface || 'unknown'
    console.log(`   - ${fieldName} (${type}, interface: ${interfaceType})`)
  })
  
  // Verificar campos necessários
  console.log('\n🔍 Verificando campos necessários:\n')
  
  const requiredFields = [
    { name: 'special_services', type: 'json', interfaceType: 'tags' },
    { name: 'massage_types', type: 'json', interfaceType: 'tags' },
    { name: 'other_services', type: 'json', interfaceType: 'tags' },
    { name: 'online_services', type: 'json', interfaceType: 'tags' },
    { name: 'virtual_fantasies', type: 'json', interfaceType: 'tags' },
    { name: 'for_sale', type: 'json', interfaceType: 'tags' },
    { name: 'hair_color', type: 'json', interfaceType: 'tags' },
    { name: 'height', type: 'json', interfaceType: 'tags' },
    { name: 'body_type', type: 'json', interfaceType: 'tags' },
    { name: 'breast_type', type: 'json', interfaceType: 'tags' },
    { name: 'pubis_type', type: 'json', interfaceType: 'tags' },
    { name: 'service_locations', type: 'json', interfaceType: 'tags' },
    { name: 'service_to', type: 'json', interfaceType: 'tags' },
    { name: 'certified', type: 'boolean', interfaceType: 'boolean' },
    { name: 'prices', type: 'json', interfaceType: 'json' },
  ]
  
  const missingFields = []
  
  requiredFields.forEach(required => {
    if (fields[required.name]) {
      console.log(`   ✅ ${required.name} - existe`)
    } else {
      console.log(`   ❌ ${required.name} - FALTANDO (${required.type})`)
      missingFields.push(required)
    }
  })
  
  if (missingFields.length > 0) {
    console.log(`\n⚠️ ${missingFields.length} campos estão faltando!\n`)
    console.log('📝 Para criar os campos faltantes:')
    console.log('   1. Acesse: https://base.pontogp.com/admin')
    console.log('   2. Vá em: Settings → Data Model → profiles')
    console.log('   3. Clique em: Create Field')
    console.log('   4. Crie cada campo faltante:\n')
    
    missingFields.forEach(field => {
      console.log(`   Campo: ${field.name}`)
      console.log(`   - Type: ${field.type}`)
      console.log(`   - Interface: ${field.interfaceType}`)
      console.log(`   - Key: ${field.name}`)
      console.log(`   - Field: ${field.name}`)
      console.log('')
    })
    
    console.log('\n💡 Ou execute o script: scripts/criar-campos-profile.mjs')
  } else {
    console.log('\n✅ Todos os campos necessários existem!')
    console.log('\n💡 Se os campos ainda não aparecem, verifique se eles estão preenchidos no perfil.')
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})

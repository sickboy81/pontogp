/**
 * Script para configurar R2 Storage no Directus 11.14.0
 * Usa o driver S3 (R2 é compatível com S3)
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
  console.log('🔧 Configurando R2 Storage no Directus 11.14.0...\n')
  
  const env = loadEnv()
  
  // Verificar credenciais necessárias
  const directusUrl = env.VITE_DIRECTUS_URL || env.DIRECTUS_URL || 'https://base.pontogp.com'
  const adminEmail = env.DIRECTUS_ADMIN_EMAIL || env.ADMIN_EMAIL
  const adminPassword = env.DIRECTUS_ADMIN_PASSWORD || env.ADMIN_PASSWORD
  
  // Credenciais R2
  const r2AccountId = env.R2_ACCOUNT_ID || env.STORAGE_R2_ACCOUNT_ID
  const r2AccessKeyId = env.R2_ACCESS_KEY_ID || env.STORAGE_R2_KEY
  const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || env.STORAGE_R2_SECRET
  const r2Bucket = env.R2_BUCKET || env.STORAGE_R2_BUCKET || 'pontogp-media'
  
  console.log('📋 Configurações encontradas:')
  console.log(`  - Directus URL: ${directusUrl}`)
  console.log(`  - Admin Email: ${adminEmail ? '✅' : '❌ Não encontrado'}`)
  console.log(`  - Admin Password: ${adminPassword ? '✅' : '❌ Não encontrado'}`)
  console.log(`  - R2 Account ID: ${r2AccountId ? '✅' : '❌ Não encontrado'}`)
  console.log(`  - R2 Access Key ID: ${r2AccessKeyId ? '✅' : '❌ Não encontrado'}`)
  console.log(`  - R2 Secret Access Key: ${r2SecretAccessKey ? '✅' : '❌ Não encontrado'}`)
  console.log(`  - R2 Bucket: ${r2Bucket}`)
  console.log('')
  
  if (!adminEmail || !adminPassword) {
    console.error('❌ ERRO: Credenciais de admin não encontradas no .env')
    console.log('   Adicione DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD ao .env')
    process.exit(1)
  }
  
  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    console.error('❌ ERRO: Credenciais R2 não encontradas no .env')
    console.log('   Adicione R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY ao .env')
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
  
  // Verificar se já existe storage location
  console.log('🔍 Verificando storage locations existentes...')
  const storageResponse = await fetch(`${directusUrl}/settings`, {
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (storageResponse.ok) {
    const settingsData = await storageResponse.json()
    console.log('📊 Configurações atuais do projeto obtidas')
    
    // Verificar storage_default_folder
    if (settingsData.data?.storage_default_folder) {
      console.log(`   Storage default folder: ${settingsData.data.storage_default_folder}`)
    }
  }
  
  // Gerar configuração para o servidor
  const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`
  
  console.log('\n📝 CONFIGURAÇÃO PARA O SERVIDOR (Coolify/Docker):')
  console.log('=' .repeat(60))
  console.log('')
  console.log('Adicione estas variáveis de ambiente no seu servidor:\n')
  
  const envConfig = `# Storage Configuration - R2 via S3 Compatible
STORAGE_LOCATIONS=local,r2
STORAGE_LOCAL_DRIVER=local
STORAGE_LOCAL_ROOT=./uploads

# R2 Storage (usando driver S3)
STORAGE_R2_DRIVER=s3
STORAGE_R2_KEY=(seu R2_ACCESS_KEY_ID)
STORAGE_R2_SECRET=(seu R2_SECRET_ACCESS_KEY)
STORAGE_R2_BUCKET=${r2Bucket}
STORAGE_R2_REGION=auto
STORAGE_R2_ENDPOINT=${r2Endpoint}
STORAGE_R2_S3_FORCE_PATH_STYLE=false
STORAGE_R2_ACL=

# Definir R2 como storage padrão (opcional)
# STORAGE_DEFAULT=r2`

  console.log(envConfig)
  
  console.log('\n🔐 VALORES REAIS (copie do seu .env):')
  console.log(`   STORAGE_R2_KEY = seu R2_ACCESS_KEY_ID`)
  console.log(`   STORAGE_R2_SECRET = seu R2_SECRET_ACCESS_KEY`)
  console.log('')
  console.log('=' .repeat(60))
  
  // Salvar configuração em arquivo
  const envR2Path = path.join(__dirname, '..', 'ENV_VARIAVEIS_R2_SERVIDOR.txt')
  fs.writeFileSync(envR2Path, envConfig)
  console.log(`\n✅ Configuração salva em: ENV_VARIAVEIS_R2_SERVIDOR.txt`)
  
  console.log('\n📌 PRÓXIMOS PASSOS:')
  console.log('1. Copie as variáveis acima')
  console.log('2. Adicione no Coolify (Environment Variables do serviço Directus)')
  console.log('3. Reinicie o Directus')
  console.log('4. Após reiniciar, o R2 estará disponível automaticamente!')
  
  console.log('\n⚠️ IMPORTANTE:')
  console.log('No Directus 11.14.0, o storage é configurado via variáveis de ambiente,')
  console.log('NÃO via interface administrativa. As variáveis acima configuram tudo.')
  
  console.log('\n🔧 Para definir R2 como padrão, adicione também:')
  console.log('STORAGE_DEFAULT=r2')
  
  console.log('\n✅ Script concluído!')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})

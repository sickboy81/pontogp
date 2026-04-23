/**
 * Script para verificar configuração do R2 storage
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Carregar .env manualmente
let env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/)
    if (match && !match[1].startsWith('#')) {
      env[match[1].trim()] = match[2].trim()
    }
  })
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || env.DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD devem estar no .env')
  process.exit(1)
}

let adminToken = null

async function login() {
  console.log('1. Fazendo login...')
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (!response.ok) {
    throw new Error(`Login falhou: ${response.status}`)
  }

  const data = await response.json()
  adminToken = data.data.access_token
  console.log('   ✅ Login realizado\n')
}

async function verificarArquivo() {
  console.log('2. Verificando detalhes do arquivo...\n')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const fileId = 'f630096e-fc16-428b-b944-ef39b4462fa3'
  const response = await fetch(`${DIRECTUS_URL}/files/${fileId}`, { headers })
  
  if (!response.ok) {
    console.log(`   ❌ Erro ao buscar arquivo: ${response.status}`)
    return null
  }

  const data = await response.json()
  const file = data.data

  console.log(`   ID: ${file.id}`)
  console.log(`   filename_download: ${file.filename_download}`)
  console.log(`   filename_disk: ${file.filename_disk}`)
  console.log(`   storage: ${file.storage}`)
  console.log(`   storage_location: ${file.storage_location}`)
  console.log(`   type: ${file.type}`)
  console.log('')

  return file
}

async function testarUrlsDiferentes(file) {
  console.log('3. Testando diferentes URLs...\n')

  if (!file) return

  // URLs a testar
  const urls = [
    {
      name: 'Directus /assets/',
      url: `${DIRECTUS_URL}/assets/${file.id}`,
    },
    {
      name: 'R2 Public (se configurado)',
      url: `https://pub-${env.R2_ACCOUNT_ID || 'xxxx'}.r2.dev/${file.id}`,
    },
  ]

  // Se tiver VITE_R2_PUBLIC_URL
  if (env.VITE_R2_PUBLIC_URL) {
    urls.push({
      name: 'VITE_R2_PUBLIC_URL',
      url: `${env.VITE_R2_PUBLIC_URL.replace(/\/$/, '')}/${file.id}`,
    })
  }

  // Se o arquivo tem filename_disk diferente do id
  if (file.filename_disk && file.filename_disk !== file.id) {
    urls.push({
      name: 'R2 com filename_disk',
      url: `${env.VITE_R2_PUBLIC_URL || 'https://pub-xxxx.r2.dev'}/${file.filename_disk}`,
    })
  }

  for (const test of urls) {
    console.log(`   ${test.name}:`)
    console.log(`      URL: ${test.url}`)
    
    try {
      const response = await fetch(test.url, { method: 'HEAD' })
      console.log(`      Status: ${response.status} ${response.statusText}`)
    } catch (error) {
      console.log(`      Erro: ${error.message}`)
    }
    console.log('')
  }
}

async function main() {
  console.log('========================================')
  console.log('Verificar R2 Storage')
  console.log('========================================\n')

  console.log('Variáveis de ambiente:')
  console.log(`   VITE_R2_PUBLIC_URL: ${env.VITE_R2_PUBLIC_URL || '❌ NÃO CONFIGURADO'}`)
  console.log(`   R2_ACCOUNT_ID: ${env.R2_ACCOUNT_ID ? '***' : '❌ NÃO CONFIGURADO'}`)
  console.log(`   STORAGE_R2_BUCKET: ${env.STORAGE_R2_BUCKET || '❌ NÃO CONFIGURADO'}`)
  console.log('')

  try {
    await login()
    const file = await verificarArquivo()
    await testarUrlsDiferentes(file)

    console.log('========================================')
    console.log('Recomendação:')
    console.log('========================================\n')
    
    console.log('Para as fotos aparecerem, você precisa:')
    console.log('')
    console.log('1. Habilitar Public Access no R2:')
    console.log('   - Cloudflare Dashboard → R2 → Bucket → Settings')
    console.log('   - Ativar "Public Development URL"')
    console.log('   - Copiar a URL (ex: https://pub-xxx.r2.dev)')
    console.log('')
    console.log('2. Configurar no Coolify (frontend):')
    console.log('   VITE_R2_PUBLIC_URL=https://pub-xxx.r2.dev')
    console.log('')
    console.log('3. Fazer deploy do frontend')
    console.log('')
    console.log('OU')
    console.log('')
    console.log('Reiniciar o Directus no Coolify para as permissões')
    console.log('de acesso público a arquivos serem aplicadas.')

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

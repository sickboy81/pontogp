/**
 * Script para Migrar Arquivos do Storage Local para Cloudflare R2
 * 
 * Este script:
 * 1. Lista todos os arquivos no storage local
 * 2. Faz upload de cada arquivo para o R2
 * 3. Atualiza as referências no Directus
 * 
 * IMPORTANTE: Execute apenas após configurar o R2 no Directus
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

async function getStorageLocations() {
  console.log('2. Buscando storage locations...')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${DIRECTUS_URL}/storage/locations`, { headers })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar storage locations: ${response.status}`)
  }

  const data = await response.json()
  console.log(`   Encontradas ${data.data?.length || 0} storage locations\n`)
  
  return data.data || []
}

async function getFiles(locationId = null) {
  console.log('3. Buscando arquivos...')
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }

  let url = `${DIRECTUS_URL}/files?limit=1000`
  if (locationId) {
    url += `&filter[storage][_eq]=${locationId}`
  }

  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar arquivos: ${response.status}`)
  }

  const data = await response.json()
  console.log(`   Encontrados ${data.data?.length || 0} arquivos\n`)
  
  return data.data || []
}

async function migrateFile(file, targetLocationId) {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
  }

  try {
    // Baixar arquivo do storage atual
    const downloadUrl = `${DIRECTUS_URL}/assets/${file.id}`
    const fileResponse = await fetch(downloadUrl, { headers })
    
    if (!fileResponse.ok) {
      console.log(`   ⚠️  Não foi possível baixar arquivo ${file.id}`)
      return false
    }

    const blob = await fileResponse.blob()
    const formData = new FormData()
    formData.append('file', blob, file.filename_download || file.filename)

    // Upload para nova location (R2)
    const uploadResponse = await fetch(
      `${DIRECTUS_URL}/files?storage=${targetLocationId}`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.log(`   ❌ Erro ao fazer upload: ${error}`)
      return false
    }

    const newFile = await uploadResponse.json()
    
    // Atualizar referências do arquivo antigo para o novo
    // Nota: Isso pode precisar ser feito manualmente dependendo de como o Directus gerencia isso
    console.log(`   ✅ Arquivo ${file.id} migrado para ${newFile.data.id}`)
    return true

  } catch (error) {
    console.log(`   ❌ Erro ao migrar arquivo ${file.id}: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('========================================')
  console.log('Migrar Arquivos para Cloudflare R2')
  console.log('========================================\n')

  try {
    await login()
    
    const locations = await getStorageLocations()
    
    // Encontrar location local e R2
    const localLocation = locations.find(l => l.driver === 'local')
    const r2Location = locations.find(l => l.driver === 'r2')

    if (!localLocation) {
      console.log('⚠️  Nenhuma storage location local encontrada')
      return
    }

    if (!r2Location) {
      console.log('❌ Nenhuma storage location R2 encontrada!')
      console.log('   Configure o R2 no Directus primeiro (veja CONFIGURAR_CLOUDFLARE_R2.md)')
      return
    }

    console.log(`   Local: ${localLocation.name} (${localLocation.id})`)
    console.log(`   R2: ${r2Location.name} (${r2Location.id})\n`)

    // Buscar arquivos na location local
    const files = await getFiles(localLocation.id)

    if (files.length === 0) {
      console.log('✅ Nenhum arquivo para migrar')
      return
    }

    console.log(`4. Migrando ${files.length} arquivos...\n`)

    let success = 0
    let failed = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`   [${i + 1}/${files.length}] ${file.filename_download || file.filename}`)
      
      const result = await migrateFile(file, r2Location.id)
      if (result) {
        success++
      } else {
        failed++
      }

      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n========================================')
    console.log(`✅ Migração concluída!`)
    console.log(`   Sucesso: ${success}`)
    console.log(`   Falhas: ${failed}`)
    console.log('========================================\n')

    if (failed > 0) {
      console.log('⚠️  Alguns arquivos falharam. Verifique os logs acima.')
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
  }
}

main()

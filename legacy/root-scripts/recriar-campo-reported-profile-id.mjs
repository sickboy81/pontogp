/**
 * Script para recriar o campo reported_profile_id como integer
 * ATENÇÃO: Isso vai deletar o campo atual e todos os dados relacionados!
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
      env[match[1].trim()] = match[2].trim().replace(/^[\"']|[\"']$/g, '')
    }
  })
  
  return env
}

async function recreateReportedProfileIdField() {
  try {
    const env = loadEnv()
    const directusUrl = env.VITE_DIRECTUS_URL || 'http://localhost:3001/api'
    const token = env.VITE_DIRECTUS_TOKEN
    
    if (!token) {
      throw new Error('VITE_DIRECTUS_TOKEN não encontrado em .env')
    }
    
    console.log('⚠️  ATENÇÃO: Este script vai deletar o campo reported_profile_id e recriá-lo como integer!')
    console.log('⚠️  Todos os dados de denúncias existentes serão perdidos!')
    console.log('')
    
    // Fazer backup dos reports existentes
    console.log('📦 Fazendo backup dos reports existentes...')
    const backupResponse = await fetch(`${directusUrl}/items/reports?fields=*&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    let reportsBackup = []
    if (backupResponse.ok) {
      const backupData = await backupResponse.json()
      reportsBackup = backupData.data || []
      console.log(`✅ ${reportsBackup.length} reports encontrados para backup`)
    }
    
    // Deletar o campo
    console.log('\n🗑️  Deletando campo reported_profile_id...')
    const deleteResponse = await fetch(`${directusUrl}/fields/reports/reported_profile_id`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorData = await deleteResponse.json().catch(() => ({}))
      console.error('❌ Erro ao deletar campo:', errorData)
      throw new Error(`Erro ao deletar campo: ${deleteResponse.status}`)
    }
    
    console.log('✅ Campo deletado')
    
    // Aguardar um pouco para garantir que a deleção foi processada
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Recriar o campo como integer
    console.log('\n🔨 Recriando campo reported_profile_id como integer...')
    const createResponse = await fetch(`${directusUrl}/fields/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collection: 'reports',
        field: 'reported_profile_id',
        type: 'integer',
        schema: {
          data_type: 'integer',
          foreign_key_table: 'profiles',
          foreign_key_column: 'id',
          is_nullable: false
        },
        meta: {
          interface: 'select-dropdown-m2o',
          width: 'half',
          note: 'Perfil denunciado',
          required: true,
          searchable: true
        }
      })
    })
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      console.error('❌ Erro ao recriar campo:', errorData)
      throw new Error(`Erro ao recriar campo: ${createResponse.status}`)
    }
    
    const createdField = await createResponse.json()
    console.log('✅ Campo recriado com sucesso!')
    console.log('📋 Campo criado:', JSON.stringify(createdField.data, null, 2))
    
    console.log('\n✅ Processo concluído!')
    if (reportsBackup.length > 0) {
      console.log(`\n⚠️  ${reportsBackup.length} reports foram perdidos.`)
      console.log('   Você pode recriá-los manualmente se necessário.')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

recreateReportedProfileIdField()

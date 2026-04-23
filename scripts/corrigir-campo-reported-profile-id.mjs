/**
 * Script para corrigir o tipo do campo reported_profile_id de UUID para integer
 * Isso é necessário porque profiles usa integer IDs, não UUIDs
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

async function fixReportedProfileIdField() {
  try {
    const env = loadEnv()
    const directusUrl = env.VITE_DIRECTUS_URL || 'http://localhost:3001/api'
    const token = env.VITE_DIRECTUS_TOKEN
    
    if (!token) {
      throw new Error('VITE_DIRECTUS_TOKEN não encontrado em .env')
    }
    
    console.log('🔄 Corrigindo tipo do campo reported_profile_id...')
    
    // Primeiro, verificar o campo atual
    const getFieldResponse = await fetch(`${directusUrl}/fields/reports/reported_profile_id`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!getFieldResponse.ok) {
      throw new Error(`Erro ao buscar campo: ${getFieldResponse.status}`)
    }
    
    const currentField = await getFieldResponse.json()
    console.log('📋 Campo atual:', JSON.stringify(currentField.data, null, 2))
    
    // Atualizar o campo para integer
    const updateResponse = await fetch(`${directusUrl}/fields/reports/reported_profile_id`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'integer',
        schema: {
          data_type: 'integer',
          foreign_key_table: 'profiles',
          foreign_key_column: 'id',
          is_nullable: false
        },
        meta: {
          ...currentField.data.meta,
          interface: 'select-dropdown-m2o',
          required: true
        }
      })
    })
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}))
      console.error('❌ Erro ao atualizar campo:', errorData)
      throw new Error(`Erro ao atualizar campo: ${updateResponse.status}`)
    }
    
    const updatedField = await updateResponse.json()
    console.log('✅ Campo atualizado com sucesso!')
    console.log('📋 Campo atualizado:', JSON.stringify(updatedField.data, null, 2))
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('\n💡 Nota: Se o erro persistir, você pode precisar:')
    console.error('   1. Deletar o campo reported_profile_id no Directus')
    console.error('   2. Recriar o campo como integer com relação M2O para profiles')
    process.exit(1)
  }
}

fixReportedProfileIdField()

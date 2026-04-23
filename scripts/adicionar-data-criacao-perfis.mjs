/**
 * Script para adicionar data de criação a perfis que não têm
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

async function addCreatedAtToProfiles() {
  try {
    const env = loadEnv()
    const directusUrl = env.VITE_DIRECTUS_URL || 'http://localhost:3001/api'
    const token = env.VITE_DIRECTUS_TOKEN
    
    if (!token) {
      throw new Error('VITE_DIRECTUS_TOKEN não encontrado em .env')
    }
    
    console.log('🔄 Buscando perfis sem data de criação...')
    
    // Buscar todos os perfis
    const listResponse = await fetch(`${directusUrl}/items/profiles?fields=*&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!listResponse.ok) {
      throw new Error(`Erro ao buscar perfis: ${listResponse.status}`)
    }
    
    const { data: profiles } = await listResponse.json()
    
    // Filtrar perfis sem created_at
    const profilesSemData = profiles.filter(p => !p.created_at)
    
    if (profilesSemData.length === 0) {
      console.log('✅ Todos os perfis já têm data de criação!')
      return
    }
    
    console.log(`📋 ${profilesSemData.length} perfis sem data de criação encontrados`)
    
    const now = new Date().toISOString()
    
    // Atualizar cada perfil
    for (const profile of profilesSemData) {
      try {
        const updateResponse = await fetch(`${directusUrl}/items/profiles/${profile.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            created_at: now
          })
        })
        
        if (!updateResponse.ok) {
          console.log(`⚠️  Erro ao atualizar ${profile.code || profile.id}: ${updateResponse.status}`)
        } else {
          console.log(`✅ ${profile.code || profile.id} atualizado com data de criação`)
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar perfil ${profile.id}:`, error.message)
      }
    }
    
    console.log('\n✅ Script concluído!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

addCreatedAtToProfiles()

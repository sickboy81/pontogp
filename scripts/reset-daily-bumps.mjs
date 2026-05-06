/**
 * Script para resetar os contadores de subidas diárias
 * Deve ser executado diariamente (recomendado: meia-noite)
 * 
 * Uso:
 *   node scripts/reset-daily-bumps.mjs
 * 
 * Ou configure um cron job:
 *   0 0 * * * cd /caminho/do/projeto && node scripts/reset-daily-bumps.mjs
 */

import PocketBase from 'pocketbase'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente do .env manualmente (sem dependência de dotenv)
try {
  const envPath = join(__dirname, '..', '.env')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      if (key && value && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  // .env não encontrado ou erro ao ler - usar variáveis de ambiente do sistema
  console.log('ℹ️  Arquivo .env não encontrado, usando variáveis de ambiente do sistema')
}

const POCKETBASE_URL =
  process.env.POCKETBASE_URL ||
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.VITE_POCKETBASE_URL
// Ordem de fallback pensada para produção atual (PocketBase), mantendo compatibilidade legada.
const ADMIN_EMAIL =
  process.env.POCKETBASE_ADMIN_EMAIL ||
  process.env.PB_ADMIN_EMAIL ||
  process.env.DIRECTUS_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL
const ADMIN_PASSWORD =
  process.env.POCKETBASE_ADMIN_PASSWORD ||
  process.env.PB_ADMIN_PASSWORD ||
  process.env.DIRECTUS_ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD

if (!POCKETBASE_URL) {
  console.error(
    '❌ Erro: URL do PocketBase ausente. Defina POCKETBASE_URL, NEXT_PUBLIC_POCKETBASE_URL ou VITE_POCKETBASE_URL.'
  )
  process.exit(1)
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    '❌ Erro: credenciais admin ausentes. Defina uma das opções: ' +
    'POCKETBASE_ADMIN_EMAIL/POCKETBASE_ADMIN_PASSWORD, ' +
    'PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD, ' +
    'DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD ou ADMIN_EMAIL/ADMIN_PASSWORD.'
  )
  console.error('   Essas credenciais são necessárias para executar o reset (requer permissões de admin).')
  process.exit(1)
}

const pb = new PocketBase(POCKETBASE_URL)

async function resetDailyBumps() {
  try {
    console.log('🔄 Iniciando reset de subidas diárias...')
    
    // Autenticar como admin
    console.log('🔐 Autenticando como admin...')
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Autenticado com sucesso')
    
    // Obter data de hoje no mesmo fuso usado pelo bump/manual dashboard.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    const today = `${byType.year}-${byType.month}-${byType.day}`
    console.log(`📅 Data de hoje: ${today}`)
    
    // Buscar todos os registros com data diferente de hoje
    console.log('🔍 Buscando registros antigos...')
    const oldRecords = await pb.collection('profile_daily_bumps').getFullList({
      filter: `date != "${today}"`,
      requestKey: `reset-bumps-${Date.now()}`
    })
    
    console.log(`📊 Encontrados ${oldRecords.length} registros antigos`)
    
    if (oldRecords.length === 0) {
      console.log('✅ Nenhum registro antigo encontrado. Reset concluído.')
      return
    }
    
    // Deletar registros antigos
    console.log('🗑️  Deletando registros antigos...')
    let deleted = 0
    let errors = 0
    
    for (const record of oldRecords) {
      try {
        await pb.collection('profile_daily_bumps').delete(record.id)
        deleted++
      } catch (error) {
        console.error(`  ❌ Erro ao deletar registro ${record.id}:`, error.message)
        errors++
      }
    }
    
    console.log(`✅ Reset concluído:`)
    console.log(`   - Registros deletados: ${deleted}`)
    if (errors > 0) {
      console.log(`   - Erros: ${errors}`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao resetar subidas diárias:', error)
    process.exit(1)
  }
}

// Executar reset
resetDailyBumps()
  .then(() => {
    console.log('✅ Script finalizado com sucesso')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })

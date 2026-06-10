#!/usr/bin/env node
/**
 * Script para verificar Brasília/DF e seus bairros
 */

const DIRECTUS_URL = 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

async function main() {
  // Login
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const loginData = await loginRes.json()
  const token = loginData.data.access_token

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  console.log('🔍 Verificando Brasília/DF...\n')

  // Buscar Brasília
  const citiesRes = await fetch(
    `${DIRECTUS_URL}/items/cities?filter[name][_eq]=Brasília&filter[state][_eq]=DF&limit=1`,
    { headers }
  )
  const citiesData = await citiesRes.json()
  const brasilia = citiesData.data?.[0]

  if (!brasilia) {
    console.log('❌ Brasília/DF NÃO está cadastrada no banco!')
    return
  }

  console.log(`✅ Brasília/DF está cadastrada (ID: ${brasilia.id})`)
  console.log(`   Prioridade: ${brasilia.priority}`)
  console.log(`   Contador de bairros: ${brasilia.neighborhoods_count || 0}\n`)

  // Buscar bairros de Brasília
  const neighborhoodsRes = await fetch(
    `${DIRECTUS_URL}/items/neighborhoods?filter[city_id][_eq]=${brasilia.id}&limit=1000&sort=priority`,
    { headers }
  )
  const neighborhoodsData = await neighborhoodsRes.json()
  const neighborhoods = neighborhoodsData.data || []
  const totalCount = neighborhoodsData.meta?.filter_count || neighborhoods.length

  console.log(`📊 Total de bairros encontrados: ${totalCount}\n`)

  if (neighborhoods.length === 0) {
    console.log('❌ Brasília NÃO tem bairros cadastrados!')
  } else {
    console.log('✅ Bairros de Brasília:')
    neighborhoods.forEach((neighborhood, index) => {
      console.log(`   ${index + 1}. ${neighborhood.name} (prioridade: ${neighborhood.priority})`)
    })
  }

  console.log('\n📋 Resumo:')
  console.log(`   - Cidade cadastrada: ${brasilia ? 'Sim' : 'Não'}`)
  console.log(`   - Total de bairros: ${totalCount}`)
  console.log(`   - Bairros listados: ${neighborhoods.length}`)
}

main().catch(e => {
  console.error('Erro:', e.message)
  process.exit(1)
})

#!/usr/bin/env node
/**
 * Script simples para verificar quais cidades não têm bairros
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

  // Buscar todas as cidades
  const citiesRes = await fetch(`${DIRECTUS_URL}/items/cities?limit=1000`, { headers })
  const citiesData = await citiesRes.json()
  const cities = citiesData.data || []

  console.log(`\n📦 Total de cidades: ${cities.length}\n`)

  // Verificar cada cidade
  const citiesWithoutNeighborhoods = []
  
  for (const city of cities) {
    const neighborhoodsRes = await fetch(
      `${DIRECTUS_URL}/items/neighborhoods?filter[city_id][_eq]=${city.id}&limit=1&fields[]=id`,
      { headers }
    )
    const neighborhoodsData = await neighborhoodsRes.json()
    const count = neighborhoodsData.data?.length || 0
    
    if (count === 0) {
      citiesWithoutNeighborhoods.push(city)
      console.log(`   ⚠️  ${city.name}/${city.state} - sem bairros`)
    } else {
      console.log(`   ✅ ${city.name}/${city.state} - tem bairros`)
    }
  }

  console.log(`\n📊 Cidades sem bairros: ${citiesWithoutNeighborhoods.length}`)
  console.log('\nCidades que precisam de bairros:')
  citiesWithoutNeighborhoods.forEach(c => {
    console.log(`   - ${c.name}/${c.state} (ID: ${c.id})`)
  })
}

main().catch(e => {
  console.error('Erro:', e.message)
  process.exit(1)
})

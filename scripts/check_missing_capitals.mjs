#!/usr/bin/env node
/**
 * Script para verificar quais capitais do Brasil ainda faltam no banco
 */

const DIRECTUS_URL = 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

// Todas as 27 capitais do Brasil
const ALL_CAPITALS = [
  { name: 'Rio Branco', state: 'AC' },
  { name: 'Maceió', state: 'AL' },
  { name: 'Macapá', state: 'AP' },
  { name: 'Manaus', state: 'AM' },
  { name: 'Salvador', state: 'BA' },
  { name: 'Fortaleza', state: 'CE' },
  { name: 'Brasília', state: 'DF' },
  { name: 'Vitória', state: 'ES' },
  { name: 'Goiânia', state: 'GO' },
  { name: 'São Luís', state: 'MA' },
  { name: 'Cuiabá', state: 'MT' },
  { name: 'Campo Grande', state: 'MS' },
  { name: 'Belo Horizonte', state: 'MG' },
  { name: 'Belém', state: 'PA' },
  { name: 'João Pessoa', state: 'PB' },
  { name: 'Curitiba', state: 'PR' },
  { name: 'Recife', state: 'PE' },
  { name: 'Teresina', state: 'PI' },
  { name: 'Rio de Janeiro', state: 'RJ' },
  { name: 'Natal', state: 'RN' },
  { name: 'Porto Alegre', state: 'RS' },
  { name: 'Porto Velho', state: 'RO' },
  { name: 'Boa Vista', state: 'RR' },
  { name: 'Florianópolis', state: 'SC' },
  { name: 'São Paulo', state: 'SP' },
  { name: 'Aracaju', state: 'SE' },
  { name: 'Palmas', state: 'TO' },
]

async function main() {
  console.log('🔍 Verificando capitais que faltam...\n')
  
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

  // Buscar todas as cidades existentes
  const citiesRes = await fetch(`${DIRECTUS_URL}/items/cities?limit=1000`, { headers })
  const citiesData = await citiesRes.json()
  const existingCities = citiesData.data || []
  
  // Criar um Set com as chaves cidade/estado existentes
  const existingKeys = new Set(existingCities.map(c => `${c.name}/${c.state}`))
  
  console.log(`📊 Total de capitais do Brasil: ${ALL_CAPITALS.length}`)
  console.log(`📊 Total de cidades no banco: ${existingCities.length}\n`)
  
  // Encontrar capitais que faltam
  const missingCapitals = ALL_CAPITALS.filter(capital => {
    const key = `${capital.name}/${capital.state}`
    return !existingKeys.has(key)
  })
  
  console.log(`\n✅ Capitais que JÁ ESTÃO no banco: ${ALL_CAPITALS.length - missingCapitals.length}`)
  existingCities.forEach(city => {
    const isCapital = ALL_CAPITALS.some(c => c.name === city.name && c.state === city.state)
    if (isCapital) {
      console.log(`   ✅ ${city.name}/${city.state}`)
    }
  })
  
  console.log(`\n❌ Capitais que FALTAM no banco: ${missingCapitals.length}`)
  if (missingCapitals.length > 0) {
    missingCapitals.forEach(capital => {
      console.log(`   ❌ ${capital.name}/${capital.state}`)
    })
  } else {
    console.log(`   🎉 Todas as 27 capitais já estão cadastradas!`)
  }
  
  console.log(`\n📋 Resumo:`)
  console.log(`   - Total de capitais do Brasil: 27`)
  console.log(`   - Capitais no banco: ${ALL_CAPITALS.length - missingCapitals.length}`)
  console.log(`   - Capitais faltantes: ${missingCapitals.length}`)
}

main().catch(e => {
  console.error('Erro:', e.message)
  process.exit(1)
})

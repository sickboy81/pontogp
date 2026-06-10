#!/usr/bin/env node
/**
 * Script para adicionar as capitais que ainda não foram criadas
 */

const DIRECTUS_URL = 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

let token = null

async function login() {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error('Falha no login')
  const data = await res.json()
  token = data.data.access_token
  console.log('✅ Login realizado!')
}

async function api(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) options.body = JSON.stringify(body)
  
  const res = await fetch(`${DIRECTUS_URL}${path}`, options)
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || `HTTP ${res.status}`)
  }
  return data
}

// 7 Capitais que ainda faltam no banco
const MISSING_CAPITALS = [
  { name: 'Rio Branco', state: 'AC', priority: 77 },
  { name: 'Macapá', state: 'AP', priority: 76 },
  { name: 'São Luís', state: 'MA', priority: 79 },
  { name: 'Cuiabá', state: 'MT', priority: 80 },
  { name: 'Porto Velho', state: 'RO', priority: 74 },
  { name: 'Boa Vista', state: 'RR', priority: 75 },
  { name: 'Palmas', state: 'TO', priority: 78 },
]

// Bairros para as 7 capitais faltantes
const CITY_NEIGHBORHOODS = {
  'Rio Branco': [
    'Centro', 'Bosque', 'Cidade Nova', 'Conjunto Habitacional', 'Distrito Industrial',
    'Estação Experimental', 'Floresta', 'Habitacional Bela Vista', 'Iraci', 'Isaura Parente',
    'Jardim de Alah', 'Jardim Primavera', 'Manoel Julião', 'Montanhês', 'Nova Esperança',
    'Papouco', 'Plácido de Castro', 'Quinze', 'Seis de Agosto', 'Sobral',
  ],
  'Macapá': [
    'Centro', 'Beirol', 'Buritizal', 'Congos', 'Fazendinha',
    'Jardim Equatorial', 'Laguinho', 'Marabaixo', 'Muca', 'Nova Esperança',
    'Perpétuo Socorro', 'Santa Rita', 'Santa Inês', 'Trem', 'Universidade',
    'Zerão', 'Boné Azul', 'Cidade Nova', 'Jardim Felicidade',
  ],
  'São Luís': [
    'Centro', 'Apeadouro', 'Bequimão', 'Caratatiua', 'Centro Histórico',
    'Cohatrac', 'Fé em Deus', 'Forquilha', 'Jordoa', 'Monte Castelo',
    'Olho d\'Água', 'Parque Aurora', 'Renascença', 'Sacavém', 'Santo Antônio',
    'São Francisco', 'São Raimundo', 'Tirirical', 'Turu', 'Vila Conceição',
    'Vila Embratel', 'Vila Palmeira', 'Vila Nova', 'Vinhais',
  ],
  'Cuiabá': [
    'Centro', 'Araés', 'Bandeirantes', 'Baú', 'Boa Esperança',
    'Cidade Verde', 'Coxipó', 'Coxipó da Ponte', 'Dom Aquino', 'Grande Terceiro',
    'Jardim dos Ipês', 'Jardim Europa', 'Jardim Florianópolis', 'Jardim Ubirajara',
    'Lixeira', 'Morada do Ouro', 'Pedregal', 'Ponte Nova', 'Porto',
    'Popular', 'Praeirinho', 'Quilombo', 'Residencial Coxipó', 'São João Del Rei',
  ],
  'Porto Velho': [
    'Centro', 'Aeroporto', 'Areal', 'Areia Branca', 'Caladinho',
    'Cidade Nova', 'Eletronorte', 'Industrial', 'Jardim América', 'Lagoa',
    'Marcos Freire', 'Mato Grosso', 'Militar', 'Nacional', 'Nova Esperança',
    'Nova Floresta', 'Novo Horizonte', 'Olaria', 'Ponta do Abunã', 'Quatro de Janeiro',
    'Rio Madeira', 'São João Bosco', 'Teixeirão', 'Triângulo',
  ],
  'Boa Vista': [
    'Centro', 'Aeroporto', 'Asa Branca', 'Bela Vista', 'Buritis',
    'Caçari', 'Cambará', 'Centenário', 'Cidade Satélite', 'Dos Estados',
    'Jardim Caranã', 'Jardim Floresta', 'Mecejana', 'Nova Cidade', 'Paraviana',
    'Pricumã', 'Raiar do Sol', 'Santa Tereza', 'São Bento', 'São Francisco',
    'Treze de Setembro', 'União', 'Vila Jardim', 'Vila Olímpica',
  ],
  'Palmas': [
    'Centro', 'Arniqueira', 'Buritirana', 'Jardim Aureny I', 'Jardim Aureny II',
    'Jardim Aureny III', 'Jardim Taquari', 'Jardim Taquarussú', 'Plano Diretor Norte',
    'Plano Diretor Sul', 'Taquarussú', 'Taquaralto', 'Jardim Cambuí',
    'Setor Santa Fé', 'Setor Bela Vista', 'Setor Sol Nascente', 'Setor Bueno',
  ],
}

async function main() {
  console.log('🚀 Adicionando capitais que faltam...\n')
  
  try {
    await login()
    
    // Buscar todas as cidades existentes
    console.log('📦 Verificando cidades existentes...')
    const citiesRes = await api('/items/cities?limit=1000')
    const existingCities = citiesRes.data || []
    const existingCityNames = new Set(existingCities.map(c => `${c.name}/${c.state}`))
    
    console.log(`   ✅ ${existingCities.length} cidades já existem\n`)
    
    // Encontrar capitais que faltam
    const missingCities = MISSING_CAPITALS.filter(capital => {
      const key = `${capital.name}/${capital.state}`
      return !existingCityNames.has(key)
    })
    
    console.log(`📊 Capitais que faltam: ${missingCities.length}\n`)
    
    if (missingCities.length === 0) {
      console.log('✅ Todas as capitais já foram criadas!')
      return
    }
    
    // Criar cidades e bairros
    let citiesCreated = 0
    let neighborhoodsCreated = 0
    
    for (const capital of missingCities) {
      console.log(`\n   🏙️  ${capital.name}/${capital.state}...`)
      
      // Criar cidade
      let cityId = null
      try {
        const created = await api('/items/cities', 'POST', {
          name: capital.name,
          state: capital.state,
          priority: capital.priority,
          neighborhoods_count: 0,
        })
        cityId = created.data.id
        citiesCreated++
        console.log(`      ✅ Cidade criada (ID: ${cityId})`)
      } catch (e) {
        console.log(`      ❌ Erro ao criar cidade: ${e.message}`)
        continue
      }
      
      // Adicionar bairros
      const neighborhoods = CITY_NEIGHBORHOODS[capital.name] || []
      
      if (neighborhoods.length === 0) {
        console.log(`      ⚠️  Sem lista de bairros disponível`)
        continue
      }
      
      console.log(`      ➕ Adicionando ${neighborhoods.length} bairros...`)
      
      let added = 0
      for (let i = 0; i < neighborhoods.length; i++) {
        const name = neighborhoods[i]
        const priority = neighborhoods.length - i
        
        try {
          await api('/items/neighborhoods', 'POST', {
            name,
            city_id: cityId,
            priority,
          })
          added++
          neighborhoodsCreated++
        } catch (e) {
          console.log(`         ⚠️  Erro ao criar bairro "${name}": ${e.message}`)
        }
      }
      
      if (added > 0) {
        console.log(`      ✅ ${added} bairros adicionados`)
        
        // Atualizar contador
        try {
          await api(`/items/cities/${cityId}`, 'PATCH', {
            neighborhoods_count: added,
          })
        } catch (e) {}
      }
    }
    
    console.log('\n\n✅ Concluído!')
    console.log(`   - Cidades criadas: ${citiesCreated}`)
    console.log(`   - Bairros criados: ${neighborhoodsCreated}`)
    console.log('\n🎉 Setup concluído!')
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

main()

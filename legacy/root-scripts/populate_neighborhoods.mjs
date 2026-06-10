#!/usr/bin/env node
/**
 * Script para popular a base de dados de cidades e bairros
 * Executa: node scripts/populate_neighborhoods.mjs
 */

import { createDirectus, rest, authentication } from '@directus/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

let env = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/)
    if (match && !match[1].startsWith('#')) {
      env[match[1]] = match[2]
    }
  })
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication())

async function rawRequest(path, method = 'GET', body = null) {
  const token = await directus.getToken()
  if (!token) throw new Error('Não autenticado')

  const url = `${DIRECTUS_URL}${path}`
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`API Request Failed (${method} ${path}): ${res.status} - ${errorText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// Dados locais de bairros (fallback)
const CITY_NEIGHBORHOODS = {
  'São Paulo': [
    'Centro', 'Vila Madalena', 'Pinheiros', 'Jardins', 'Itaim Bibi',
    'Vila Olímpia', 'Moema', 'Brooklin', 'Campo Belo', 'Santo Amaro',
    'Vila Mariana', 'Paraíso', 'Bela Vista', 'Consolação', 'Jardim Paulista',
    'Alto de Pinheiros', 'Lapa', 'Perdizes', 'Pompeia', 'Vila Leopoldina',
    'Barra Funda', 'Bom Retiro', 'Liberdade', 'Aclimação', 'Cambuci',
  ],
  'Rio de Janeiro': [
    'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Botafogo',
    'Flamengo', 'Lagoa', 'Tijuca', 'Jardim Botânico', 'Urca',
    'Laranjeiras', 'Catete', 'Gloria', 'Centro', 'Santa Teresa',
    'São Conrado', 'Recreio dos Bandeirantes', 'Méier', 'Guaratiba', 'Campo Grande',
    'Santa Cruz', 'Sepetiba', 'Madureira', 'Bangu', 'Vila Valqueire',
    'Piedade', 'Abolição', 'Quintino', 'Pilares',
  ],
  'Belo Horizonte': [
    'Centro', 'Savassi', 'Funcionários', 'Lourdes', 'Santo Antônio',
    'Boa Viagem', 'Santa Efigênia', 'Floresta', 'Prado', 'Cidade Nova',
    'Barro Preto', 'São Pedro', 'Belvedere', 'Gutierrez', 'Sion',
  ],
  'Brasília': [
    'Asa Norte', 'Asa Sul', 'Sudoeste', 'Noroeste', 'Lago Sul',
    'Lago Norte', 'Águas Claras', 'Taguatinga', 'Gama', 'Guará',
    'Ceilândia', 'Plano Piloto', 'Sobradinho', 'Cruzeiro', 'Octogonal',
  ],
  'Salvador': [
    'Barra', 'Ondina', 'Rio Vermelho', 'Pituba', 'Caminho das Árvores',
    'Imbuí', 'Stiep', 'Graça', 'Garcia', 'Federação',
    'Centro', 'Pelourinho', 'Comércio', 'Campo Grande', 'Vitória',
  ],
  'Curitiba': [
    'Centro', 'Batel', 'Água Verde', 'Bigorrilho', 'Bom Retiro',
    'Juvevê', 'Mercês', 'Jardim Botânico', 'Bacacheri', 'Boa Vista',
    'Cristo Rei', 'São Francisco', 'Rebouças', 'Parolin',
  ],
  'Fortaleza': [
    'Meireles', 'Aldeota', 'Praia de Iracema', 'Dionísio Torres', 'Montese',
    'Parquelândia', 'Papicu', 'Sabiaguaba', 'Varjota', 'Centro',
    'Benfica', 'Rodolfo Teófilo', 'Fátima', 'João XXIII', 'Parangaba',
  ],
  'Recife': [
    'Boa Viagem', 'Pina', 'Parnamirim', 'Espinheiro', 'Graças',
    'Casa Forte', 'Ponte d\'Uchoa', 'Derby', 'Torre', 'Ilha do Leite',
    'Santo Antônio', 'São José', 'Centro', 'Boa Vista', 'Campo Grande',
  ],
  'Porto Alegre': [
    'Moinhos de Vento', 'Bela Vista', 'Bom Fim', 'Centro', 'Cidade Baixa',
    'Floresta', 'Menino Deus', 'Petrópolis', 'Tristeza', 'Vila Conceição',
    'Auxiliadora', 'Santa Cecília', 'Rio Branco', 'Independência', 'Santana',
  ],
  'Goiânia': [
    'Centro', 'Mara Rosa', 'Setor Bueno', 'Setor Oeste', 'Setor Sul',
    'Marista', 'Jardim América', 'Campinas', 'Vila Nova', 'Setor Universitário',
    'Parque Amazônia', 'Alto da Glória', 'Setor Jaó', 'Jardim Goiás', 'Setor Aeroporto',
  ],
}

// Mapeamento de capitais brasileiras
const CAPITALS = [
  { name: 'São Paulo', state: 'SP', priority: 100 },
  { name: 'Rio de Janeiro', state: 'RJ', priority: 99 },
  { name: 'Belo Horizonte', state: 'MG', priority: 98 },
  { name: 'Brasília', state: 'DF', priority: 97 },
  { name: 'Salvador', state: 'BA', priority: 96 },
  { name: 'Curitiba', state: 'PR', priority: 95 },
  { name: 'Fortaleza', state: 'CE', priority: 94 },
  { name: 'Recife', state: 'PE', priority: 93 },
  { name: 'Porto Alegre', state: 'RS', priority: 92 },
  { name: 'Goiânia', state: 'GO', priority: 91 },
  { name: 'Manaus', state: 'AM', priority: 90 },
  { name: 'Belém', state: 'PA', priority: 89 },
  { name: 'Vitória', state: 'ES', priority: 88 },
  { name: 'Florianópolis', state: 'SC', priority: 87 },
  { name: 'Natal', state: 'RN', priority: 86 },
  { name: 'Campo Grande', state: 'MS', priority: 85 },
  { name: 'João Pessoa', state: 'PB', priority: 84 },
  { name: 'Maceió', state: 'AL', priority: 83 },
  { name: 'Aracaju', state: 'SE', priority: 82 },
  { name: 'Teresina', state: 'PI', priority: 81 },
  { name: 'Cuiabá', state: 'MT', priority: 80 },
  { name: 'São Luís', state: 'MA', priority: 79 },
  { name: 'Palmas', state: 'TO', priority: 78 },
  { name: 'Rio Branco', state: 'AC', priority: 77 },
  { name: 'Macapá', state: 'AP', priority: 76 },
  { name: 'Boa Vista', state: 'RR', priority: 75 },
  { name: 'Porto Velho', state: 'RO', priority: 74 },
]

async function findOrCreateCity(name, state, ibgeCode, priority) {
  try {
    // Tenta encontrar cidade existente
    const searchResponse = await rawRequest(
      `/items/cities?filter[name][_eq]=${encodeURIComponent(name)}&filter[state][_eq]=${state}`
    )
    
    if (searchResponse.data && searchResponse.data.length > 0) {
      return searchResponse.data[0].id
    }

    // Cria nova cidade
    const createResponse = await rawRequest('/items/cities', 'POST', {
      name,
      state,
      ibge_code: ibgeCode || null,
      priority,
      neighborhoods_count: 0,
    })

    return createResponse.data.id
  } catch (error) {
    console.error(`   ❌ Erro ao criar/buscar cidade ${name}:`, error.message)
    throw error
  }
}

async function createNeighborhood(cityId, name, priority = 0, population = null) {
  try {
    // Verifica se o bairro já existe
    const searchResponse = await rawRequest(
      `/items/neighborhoods?filter[name][_eq]=${encodeURIComponent(name)}&filter[city_id][_eq]=${cityId}`
    )
    
    if (searchResponse.data && searchResponse.data.length > 0) {
      return false // Bairro já existe
    }

    // Cria novo bairro
    await rawRequest('/items/neighborhoods', 'POST', {
      name,
      city_id: cityId,
      priority,
      population,
    })

    return true
  } catch (error) {
    console.error(`      ❌ Erro ao criar bairro ${name}:`, error.message)
    return false
  }
}

async function updateCityNeighborhoodsCount(cityId) {
  try {
    const countResponse = await rawRequest(
      `/items/neighborhoods?filter[city_id][_eq]=${cityId}&aggregate[count]=*`
    )
    
    const count = countResponse.data?.[0]?.count || 0
    
    await rawRequest(`/items/cities/${cityId}`, 'PATCH', {
      neighborhoods_count: count,
    })
  } catch (error) {
    console.error(`   ⚠️  Erro ao atualizar contador de bairros:`, error.message)
  }
}

async function main() {
  console.log('🚀 Populando base de dados de cidades e bairros...\n')

  try {
    // Login
    console.log('1. Fazendo login como admin...')
    await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('   ✅ Login realizado!\n')

    let citiesCreated = 0
    let neighborhoodsCreated = 0

    // Processar cada capital
    for (const capital of CAPITALS) {
      console.log(`2. Processando ${capital.name}/${capital.state}...`)
      
      // Buscar código IBGE (opcional, pode falhar)
      let ibgeCode = null
      try {
        const ibgeResponse = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(capital.name)}&orderBy=nome`
        )
        const ibgeData = await ibgeResponse.json()
        const cityData = ibgeData.find(c => c.microrregiao.mesorregiao.UF.sigla === capital.state)
        if (cityData) {
          ibgeCode = cityData.id.toString()
        }
      } catch (error) {
        console.log(`   ⚠️  Não foi possível buscar código IBGE`)
      }

      // Criar ou buscar cidade
      const cityId = await findOrCreateCity(capital.name, capital.state, ibgeCode, capital.priority)
      citiesCreated++

      // Adicionar bairros (usar dados locais se disponíveis)
      const neighborhoods = CITY_NEIGHBORHOODS[capital.name] || []
      
      if (neighborhoods.length > 0) {
        console.log(`   ➕ Adicionando ${neighborhoods.length} bairros...`)
        
        for (let i = 0; i < neighborhoods.length; i++) {
          const neighborhoodName = neighborhoods[i]
          // Prioridade decresce conforme o índice (primeiros têm maior prioridade)
          const priority = neighborhoods.length - i
          
          const created = await createNeighborhood(cityId, neighborhoodName, priority)
          if (created) {
            neighborhoodsCreated++
          }
        }
      } else {
        console.log(`   ⚠️  Nenhum bairro disponível para ${capital.name}`)
      }

      // Atualizar contador de bairros
      await updateCityNeighborhoodsCount(cityId)
      
      console.log(`   ✅ ${capital.name} processada!\n`)
    }

    console.log('')
    console.log('✅ População concluída!')
    console.log(`   - Cidades processadas: ${citiesCreated}`)
    console.log(`   - Bairros criados: ${neighborhoodsCreated}`)
    console.log('')
    console.log('Próximos passos:')
    console.log('1. Configure as permissões no Directus admin panel')
    console.log('2. Teste a busca de bairros no dashboard')
  } catch (error) {
    console.error('❌ Erro crítico:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()

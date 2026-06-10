#!/usr/bin/env node
/**
 * Script para adicionar bairros às cidades que ainda não têm nenhum bairro
 * Executa: node scripts/add_neighborhoods_to_empty_cities.mjs
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

// Bairros para cidades que ainda não têm
const CITY_NEIGHBORHOODS = {
  'Manaus': [
    'Centro', 'Adrianópolis', 'Aleixo', 'Cachoeirinha', 'Coroado',
    'Educandos', 'Flores', 'Japiim', 'Morro da Liberdade', 'Nossa Senhora das Graças',
    'Parque 10 de Novembro', 'Praça 14 de Janeiro', 'São Raimundo', 'Tarumã',
    'Vila da Prata', 'Zona Franca', 'Chapada', 'Cidade Nova', 'Compensa',
    'Dom Pedro', 'Glória', 'Mauazinho', 'Ponta Negra', 'Presidente Vargas',
  ],
  'Belém': [
    'Centro', 'Batista Campos', 'Campina', 'Cidade Velha', 'Condor',
    'Cremação', 'Fátima', 'Guamá', 'Jurunas', 'Marco',
    'Nazaré', 'Pedreira', 'Reduto', 'São Brás', 'Terra Firme',
    'Umarizal', 'Val-de-Cans', 'Entroncamento', 'Marambaia', 'Montese',
    'Parque Verde', 'Souza', 'Telégrafo', 'Canudos',
  ],
  'Vitória': [
    'Centro', 'Bento Ferreira', 'Caratoíra', 'Enseada do Suá', 'Forte São João',
    'Ilha do Príncipe', 'Ilha do Boi', 'Jucutuquara', 'Maruípe', 'Monte Belo',
    'Nova Palestina', 'Pontal de Camburi', 'Praia do Canto', 'Praia do Suá',
    'Romão', 'Santa Cecília', 'Santa Lúcia', 'Santo Antônio', 'São Pedro',
    'Tabuazeiro', 'Vila Rubim', 'Andorinhas', 'Bela Vista', 'Horto',
  ],
  'Florianópolis': [
    'Centro', 'Agronômica', 'Barra da Lagoa', 'Cachoeira do Bom Jesus', 'Campeche',
    'Canasvieiras', 'Coqueiros', 'Ingleses', 'Jurerê', 'Jurerê Internacional',
    'Lagoa da Conceição', 'Pantanal', 'Pântano do Sul', 'Ribeirão da Ilha',
    'Saco dos Limões', 'Santo Antônio de Lisboa', 'Trindade', 'Praia Mole',
    'João Paulo', 'Itacorubi', 'Carianos', 'Morro das Pedras', 'Armação',
  ],
  'Natal': [
    'Centro', 'Alecrim', 'Areia Preta', 'Barro Vermelho', 'Candelária',
    'Capim Macio', 'Cidade Alta', 'Cidade Nova', 'Dix-Sept Rosado', 'Felipe Camarão',
    'Igapó', 'Lagoa Nova', 'Lagoa Seca', 'Mãe Luiza', 'Neópolis',
    'Nova Descoberta', 'Petrópolis', 'Ponta Negra', 'Praia do Meio', 'Quintas',
    'Rocas', 'Tirol', 'Zona Norte', 'Pitimbu',
  ],
  'Campo Grande': [
    'Centro', 'Amambaí', 'América', 'Bandeirantes', 'Caiobá',
    'Carandá Bosque', 'Coophavila II', 'Guanandi', 'Jardim Aeroporto', 'Jardim América',
    'Jardim Carioca', 'Jardim das Moreninhas', 'Jardim dos Estados', 'Jardim Noroeste',
    'Nova Lima', 'Novo Mundo', 'Parque do Sol', 'Parque dos Novos Estados',
    'Santa Fé', 'Sobrinho', 'Taveirópolis', 'Universitário', 'Vila Glória',
  ],
  'João Pessoa': [
    'Centro', 'Alto do Mateus', 'Barra de Gramame', 'Bessa', 'Cabo Branco',
    'Castelo Branco', 'Cristo Redentor', 'Funcionários', 'Geisel', 'Ipês',
    'Jardim Cidade Universitária', 'Jardim Oceania', 'Jardim São Paulo', 'Mangabeira',
    'Miramar', 'Paratibe', 'Pedro Gondim', 'Planalto da Boa Esperança', 'Róger',
    'Tambauzinho', 'Tambiá', 'Torre', 'Trincheiras', 'Varjão',
  ],
  'Maceió': [
    'Centro', 'Barro Duro', 'Cruz das Almas', 'Farol', 'Feitosa',
    'Garça Torta', 'Guaxuma', 'Ipioca', 'Jatiúca', 'Jaraguá',
    'Levada', 'Mangabeiras', 'Pajuçara', 'Pescaria', 'Ponta Verde',
    'Pontal da Barra', 'Riacho Doce', 'Rio Largo', 'Serraria', 'Tabuleiro do Martins',
    'Trapiche da Barra', 'Vergel do Lago', 'Zona Norte',
  ],
  'Aracaju': [
    'Centro', 'Atalaia', 'Coroa do Meio', 'Dezoito do Forte', 'Farolândia',
    'Getúlio Vargas', 'Grageru', 'Inácio Barbosa', 'Jabotiana', 'Jardins',
    'José Conrado de Araújo', 'Luzia', 'Novo Paraíso', 'Olaria', 'Pereira Lobo',
    'Porto Dantas', 'Salgado Filho', 'Santa Maria', 'Santo Antônio', 'São Conrado',
    'Siqueira Campos', 'Siqueira Campos', 'Soledade', 'Zona de Expansão',
  ],
  'Teresina': [
    'Centro', 'Aeroporto', 'Aroeiras', 'Brasilar', 'Cabo Luís Eduardo',
    'Catanduvas', 'Cidade Nova', 'Dirceu Arcoverde', 'Esplanada', 'Fátima',
    'Gurupi', 'Ininga', 'Itararé', 'Macaúba', 'Mocambinho',
    'Parque Piauí', 'Planalto Ininga', 'Porenquanto', 'Redenção', 'Renascença',
    'Santa Maria da Codipe', 'São Cristóvão', 'São João', 'Vale do Gavião',
  ],
  // Capitais que podem ter sido criadas mas não populadas
  'Cuiabá': [
    'Centro', 'Araés', 'Bandeirantes', 'Baú', 'Boa Esperança',
    'Cidade Verde', 'Coxipó', 'Coxipó da Ponte', 'Dom Aquino', 'Grande Terceiro',
    'Jardim dos Ipês', 'Jardim Europa', 'Jardim Florianópolis', 'Jardim Ubirajara',
    'Lixeira', 'Morada do Ouro', 'Pedregal', 'Ponte Nova', 'Porto',
    'Popular', 'Praeirinho', 'Quilombo', 'Residencial Coxipó', 'São João Del Rei',
  ],
  'São Luís': [
    'Centro', 'Apeadouro', 'Bequimão', 'Caratatiua', 'Centro Histórico',
    'Cohatrac', 'Fé em Deus', 'Forquilha', 'Jordoa', 'Monte Castelo',
    'Olho d\'Água', 'Parque Aurora', 'Renascença', 'Sacavém', 'Santo Antônio',
    'São Francisco', 'São Raimundo', 'Tirirical', 'Turu', 'Vila Conceição',
    'Vila Embratel', 'Vila Palmeira', 'Vila Nova', 'Vinhais',
  ],
  'Palmas': [
    'Centro', 'Arniqueira', 'Buritirana', 'Jardim Aureny I', 'Jardim Aureny II',
    'Jardim Aureny III', 'Jardim Taquari', 'Jardim Taquarussú', 'Plano Diretor Norte',
    'Plano Diretor Sul', 'Taquarussú', 'Taquaralto', 'Jardim Cambuí',
    'Setor Santa Fé', 'Setor Bela Vista', 'Setor Sol Nascente', 'Setor Bueno',
  ],
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
  'Boa Vista': [
    'Centro', 'Aeroporto', 'Asa Branca', 'Bela Vista', 'Buritis',
    'Caçari', 'Cambará', 'Centenário', 'Cidade Satélite', 'Dos Estados',
    'Jardim Caranã', 'Jardim Floresta', 'Mecejana', 'Nova Cidade', 'Paraviana',
    'Pricumã', 'Raiar do Sol', 'Santa Tereza', 'São Bento', 'São Francisco',
    'Treze de Setembro', 'União', 'Vila Jardim', 'Vila Olímpica',
  ],
  'Porto Velho': [
    'Centro', 'Aeroporto', 'Areal', 'Areia Branca', 'Caladinho',
    'Cidade Nova', 'Eletronorte', 'Industrial', 'Jardim América', 'Lagoa',
    'Marcos Freire', 'Mato Grosso', 'Militar', 'Nacional', 'Nova Esperança',
    'Nova Floresta', 'Novo Horizonte', 'Olaria', 'Ponta do Abunã', 'Quatro de Janeiro',
    'Rio Madeira', 'São João Bosco', 'Teixeirão', 'Triângulo',
  ],
}

async function main() {
  console.log('🚀 Verificando cidades sem bairros...\n')
  
  try {
    await login()
    
    // Buscar todas as cidades
    console.log('📦 Buscando todas as cidades...')
    const citiesRes = await api('/items/cities?limit=1000')
    const cities = citiesRes.data || []
    console.log(`   ✅ ${cities.length} cidades encontradas\n`)
    
    // Verificar quais cidades não têm bairros
    const citiesWithoutNeighborhoods = []
    
    for (const city of cities) {
      try {
        const neighborhoodsRes = await api(`/items/neighborhoods?filter[city_id][_eq]=${city.id}&limit=1&meta=filter_count`)
        const count = neighborhoodsRes.meta?.filter_count || neighborhoodsRes.data?.length || 0
        
        if (count === 0) {
          citiesWithoutNeighborhoods.push(city)
          console.log(`   ⚠️  ${city.name}/${city.state} - sem bairros`)
        } else {
          console.log(`   ✅ ${city.name}/${city.state} - ${count} bairros`)
        }
      } catch (e) {
        // Se der erro, tenta verificar de outra forma
        try {
          const neighborhoodsRes2 = await api(`/items/neighborhoods?filter[city_id][_eq]=${city.id}&limit=1`)
          const count2 = neighborhoodsRes2.data?.length || 0
          if (count2 === 0) {
            citiesWithoutNeighborhoods.push(city)
            console.log(`   ⚠️  ${city.name}/${city.state} - sem bairros`)
          } else {
            console.log(`   ✅ ${city.name}/${city.state} - tem bairros`)
          }
        } catch (e2) {
          citiesWithoutNeighborhoods.push(city)
          console.log(`   ⚠️  ${city.name}/${city.state} - sem bairros (erro ao verificar)`)
        }
      }
    }
    
    console.log(`\n📊 Total de cidades sem bairros: ${citiesWithoutNeighborhoods.length}\n`)
    
    if (citiesWithoutNeighborhoods.length === 0) {
      console.log('✅ Todas as cidades já têm bairros!')
      return
    }
    
    // Adicionar bairros para cidades que não têm
    let neighborhoodsCreated = 0
    let citiesProcessed = 0
    
    for (const city of citiesWithoutNeighborhoods) {
      const neighborhoods = CITY_NEIGHBORHOODS[city.name]
      
      if (!neighborhoods || neighborhoods.length === 0) {
        console.log(`\n   ⏭️  ${city.name}/${city.state} - sem lista de bairros disponível`)
        continue
      }
      
      console.log(`\n   🏙️  ${city.name}/${city.state}...`)
      console.log(`      ➕ Adicionando ${neighborhoods.length} bairros...`)
      
      let added = 0
      for (let i = 0; i < neighborhoods.length; i++) {
        const name = neighborhoods[i]
        const priority = neighborhoods.length - i
        
        try {
          // Verificar se já existe
          const existing = await api(`/items/neighborhoods?filter[name][_eq]=${encodeURIComponent(name)}&filter[city_id][_eq]=${city.id}`)
          if (existing.data && existing.data.length > 0) {
            continue
          }
          
          // Criar bairro
          await api('/items/neighborhoods', 'POST', {
            name,
            city_id: city.id,
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
          await api(`/items/cities/${city.id}`, 'PATCH', {
            neighborhoods_count: added,
          })
        } catch (e) {}
        
        citiesProcessed++
      }
    }
    
    console.log('\n\n✅ Concluído!')
    console.log(`   - Cidades processadas: ${citiesProcessed}`)
    console.log(`   - Bairros criados: ${neighborhoodsCreated}`)
    console.log('\n🎉 Setup concluído!')
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

main()

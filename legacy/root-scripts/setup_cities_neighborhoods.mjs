#!/usr/bin/env node
/**
 * Script simplificado para criar e popular cidades e bairros
 * Executa: node scripts/setup_cities_neighborhoods.mjs
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

// Dados de bairros
const CITY_NEIGHBORHOODS = {
  'São Paulo': [
    'Centro', 'Vila Madalena', 'Pinheiros', 'Jardins', 'Itaim Bibi',
    'Vila Olímpia', 'Moema', 'Brooklin', 'Campo Belo', 'Santo Amaro',
    'Vila Mariana', 'Paraíso', 'Bela Vista', 'Consolação', 'Jardim Paulista',
    'Alto de Pinheiros', 'Lapa', 'Perdizes', 'Pompeia', 'Vila Leopoldina',
    'Barra Funda', 'Bom Retiro', 'Liberdade', 'Aclimação', 'Cambuci',
    'Tatuapé', 'Mooca', 'Brás', 'Belém', 'Água Rasa', 'Carrão', 'Penha',
    'Vila Formosa', 'São Mateus', 'Sapopemba', 'Cidade Líder', 'Itaquera',
    'Guaianazes', 'Cidade Tiradentes', 'Ipiranga', 'Sé', 'República',
    'Santa Cecília', 'Higienópolis', 'Pacaembu', 'Sumaré', 'Perús',
    'Jaraguá', 'Pirituba', 'Freguesia do Ó', 'Vila Sônia', 'Butantã',
  ],
  'Rio de Janeiro': [
    'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Botafogo',
    'Flamengo', 'Lagoa', 'Tijuca', 'Jardim Botânico', 'Urca',
    'Laranjeiras', 'Catete', 'Gloria', 'Centro', 'Santa Teresa',
    'São Conrado', 'Recreio dos Bandeirantes', 'Méier', 'Guaratiba', 'Campo Grande',
    'Santa Cruz', 'Sepetiba', 'Madureira', 'Bangu', 'Vila Valqueire',
    'Piedade', 'Abolição', 'Quintino', 'Pilares', 'Vila Isabel',
    'Rio Comprido', 'Maracanã', 'Andaraí', 'Grajaú', 'Jacarepaguá',
    'Taquara', 'Jacarezinho', 'Complexo do Alemão', 'Rocinha', 'Vidigal',
    'Gávea', 'São Conrado', 'Leme', 'Cosme Velho', 'Flamengo',
    'Laranjeiras', 'Catete', 'Glória', 'Santa Teresa', 'Paquetá',
  ],
  'Belo Horizonte': [
    'Centro', 'Savassi', 'Funcionários', 'Lourdes', 'Santo Antônio',
    'Boa Viagem', 'Santa Efigênia', 'Floresta', 'Prado', 'Cidade Nova',
    'Barro Preto', 'São Pedro', 'Belvedere', 'Gutierrez', 'Sion',
    'Serra', 'Mangabeiras', 'Alto Barroca', 'Santa Tereza', 'Sagrada Família',
    'Carlos Prates', 'Coração Eucarístico', 'União', 'Nova Suíça', 'Alto dos Pinheiros',
    'Cidade Jardim', 'Estoril', 'Luxemburgo', 'Anchieta', 'Nova Granada',
    'Buritis', 'Castelo', 'Salgado Filho', 'Ouro Preto', 'Caiçara',
  ],
  'Brasília': [
    'Asa Norte', 'Asa Sul', 'Sudoeste', 'Noroeste', 'Lago Sul',
    'Lago Norte', 'Águas Claras', 'Taguatinga', 'Gama', 'Guará',
    'Ceilândia', 'Plano Piloto', 'Sobradinho', 'Cruzeiro', 'Octogonal',
    'Samambaia', 'São Sebastião', 'Paranoá', 'Brazlândia', 'Planaltina',
    'Santa Maria', 'São Vicente', 'Riacho Fundo', 'Candangolândia', 'Vicente Pires',
  ],
  'Salvador': [
    'Barra', 'Ondina', 'Rio Vermelho', 'Pituba', 'Caminho das Árvores',
    'Imbuí', 'Stiep', 'Graça', 'Garcia', 'Federação',
    'Centro', 'Pelourinho', 'Comércio', 'Campo Grande', 'Vitória',
    'Itapuã', 'Piatã', 'Boca do Rio', 'Armação', 'Costa Azul',
    'Jardim Armação', 'Patamares', 'Paralela', 'Caminho das Árvores', 'Iguatemi',
    'Cidade Baixa', 'Bonfim', 'Santo Antônio', 'Pernambués', 'Nazaré',
  ],
  'Curitiba': [
    'Centro', 'Batel', 'Água Verde', 'Bigorrilho', 'Bom Retiro',
    'Juvevê', 'Mercês', 'Jardim Botânico', 'Bacacheri', 'Boa Vista',
    'Cristo Rei', 'São Francisco', 'Rebouças', 'Parolin', 'Cabral',
    'Centro Cívico', 'Campo Comprido', 'Vila Izabel', 'Barreirinha', 'Santo Inácio',
    'Tingui', 'Santa Felicidade', 'Pilarzinho', 'Ahú', 'Mercês',
    'São Lourenço', 'Abranches', 'Cachoeira', 'Guaíra', 'Uberaba',
  ],
  'Fortaleza': [
    'Meireles', 'Aldeota', 'Praia de Iracema', 'Dionísio Torres', 'Montese',
    'Parquelândia', 'Papicu', 'Sabiaguaba', 'Varjota', 'Centro',
    'Benfica', 'Rodolfo Teófilo', 'Fátima', 'João XXIII', 'Parangaba',
    'Mucuripe', 'Cocó', 'Cidade 2000', 'Engenheiro Luciano Cavalcante', 'Pici',
    'Mondubim', 'Bonsucesso', 'Antônio Bezerra', 'Vicente Pinzon', 'Praia do Futuro',
    'Edson Queiroz', 'Damas', 'Jardim América', 'Joaquim Távora', 'Dionísio Torres',
  ],
  'Recife': [
    'Boa Viagem', 'Pina', 'Parnamirim', 'Espinheiro', 'Graças',
    'Casa Forte', "Ponte d'Uchoa", 'Derby', 'Torre', 'Ilha do Leite',
    'Santo Antônio', 'São José', 'Centro', 'Boa Vista', 'Campo Grande',
    'Jordão', 'Casa Amarela', 'Apipucos', 'Monteiro', 'Poço da Panela',
    'Rosarinho', 'Cordeiro', 'Madalena', 'Jaqueira', 'Setúbal',
    'Imbiribeira', 'Afogados', 'Casa Caiada', 'Peixinhos', 'Varzea',
  ],
  'Porto Alegre': [
    'Moinhos de Vento', 'Bela Vista', 'Bom Fim', 'Centro', 'Cidade Baixa',
    'Floresta', 'Menino Deus', 'Petrópolis', 'Tristeza', 'Vila Conceição',
    'Auxiliadora', 'Santa Cecília', 'Rio Branco', 'Independência', 'Santana',
    'Partenon', 'Cristal', 'Vila Jardim', 'Mont Serrat', 'Belém Novo',
    'Camaquã', 'Vila Nova', 'Cascata', 'Hípica', 'Medianeira',
    'Teresópolis', 'Jardim do Salso', 'Lami', 'Belém Velho', 'Coronel Aparício Borges',
  ],
  'Goiânia': [
    'Centro', 'Mara Rosa', 'Setor Bueno', 'Setor Oeste', 'Setor Sul',
    'Marista', 'Jardim América', 'Campinas', 'Vila Nova', 'Setor Universitário',
    'Parque Amazônia', 'Alto da Glória', 'Setor Jaó', 'Jardim Goiás', 'Setor Aeroporto',
    'Setor Central', 'Jardim Planalto', 'Setor Nova Vila', 'Conjunto Cachoeira Dourada',
    'Setor Bela Vista', 'Setor Coimbra', 'Setor Garavelo', 'Setor Jardim América',
    'Setor Marista', 'Setor Oeste', 'Setor Pedro Ludovico', 'Vila Abajá',
  ],
  // Novas cidades
  'Guarulhos': [
    'Centro', 'Vila Galvão', 'Bonsucesso', 'Vila Progresso', 'Pimentas',
    'Jardim Vila Galvão', 'Parque Cecap', 'Cidade Soberana', 'Vila São João',
    'Jardim Munhoz', 'Jardim Presidente Dutra', 'Jardim Maia', 'Vila Rosalia',
    'Jardim Cumbica', 'Parque Continental', 'Cumbica', 'Vila Endres', 'Vila Rica',
  ],
  'Campinas': [
    'Centro', 'Cambuí', 'Barão Geraldo', 'Taquaral', 'Nova Campinas',
    'Cambuí', 'Guanabara', 'Sousas', 'Joaquim Egídio', 'Chácara Primavera',
    'Bonfim', 'Botafogo', 'Proença', 'Parque Industrial', 'Vila Industrial',
    'Jardim das Bandeiras', 'Parque dos Jequitibás', 'Vila Marieta', 'Vila Nova',
  ],
  'São Bernardo do Campo': [
    'Centro', 'Rudge Ramos', 'Baeta Neves', 'Ferrazópolis', 'Vila Helena',
    'Assunção', 'Vila Vivaldi', 'Jardim do Mar', 'Paulicéia', 'Alvarenga',
    'Anchieta', 'Batistini', 'Cooperativa', 'Demarchi', 'Nova Petrópolis',
    'Jordanópolis', 'Independência', 'Nova Gerty',
  ],
  'Santo André': [
    'Centro', 'Vila Assunção', 'Parque Jaçatuba', 'Vila Alpina', 'Campestre',
    'Cidade São Jorge', 'Vila Camilópolis', 'Casa Branca', 'Vila Humaitá',
    'Parque Novo Oratório', 'Vila Lucinda', 'Jardim Bela Vista', 'Utinga',
    'Jardim Celeste', 'Vila Linda', 'Vila Pires', 'Vila Valparaíso',
  ],
  'Osasco': [
    'Centro', 'Vila Yara', 'Piratininga', 'Bela Vista', 'Km 18',
    'City Bussocaba', 'Conceição', 'Helena Maria', 'Munhoz Júnior',
    'Presidente Altino', 'Quitaúna', 'Rochdale', 'Santo Antônio', 'Veloso',
    'Umuarama', 'Vila Campesina', 'Vila Yolanda',
  ],
  'Niterói': [
    'Centro', 'Icaraí', 'São Francisco', 'Jurujuba', 'Charitas',
    'Ingá', 'Piratininga', 'Camboinhas', 'Itaipu', 'Itacoatiara',
    'Itaipuaçu', 'Maravista', 'Ititioca', 'Fátima', 'Santa Rosa',
    'Largo da Batalha', 'Pendotiba', 'Sapê',
  ],
  'Duque de Caxias': [
    'Centro', 'Vila São Luís', 'Caxias', 'Xerém', 'Campos Elíseos',
    'Jardim Gramacho', 'Parque Fluminense', 'Pilar', 'São Bento',
    'Vila Leopoldina', 'Imbariê', 'Santa Cruz da Serra', 'Vila Sarapuí',
    'Parque Eldorado', 'Jardim Primavera', 'Chaperó', 'Vila Rosário',
  ],
  'Contagem': [
    'Centro', 'Eldorado', 'Nacional', 'Industrial', 'Cidade Industrial',
    'Tijuca', 'Vila Formosa', 'Inconfidentes', 'Cidade Jardim', 'Ressaca',
    'Sesc', 'Parque São João', 'Vila Real', 'Campos Elíseos', 'Vila Rica',
  ],
  'Betim': [
    'Centro', 'Alterosa', 'São João', 'Jardim Teresópolis', 'PTB',
    'Ingá', 'Paquetá', 'Imbiruçu', 'Várzea', 'Citrolândia',
    'Jardim das Acácias', 'Nova União', 'Vila Verde', 'São Cristóvão',
  ],
  'Feira de Santana': [
    'Centro', 'Campo do Gado Novo', 'Mangabeira', 'Tomba', 'Brasília',
    'Aviário', 'Sobradinho', 'Muchila', 'Queimadinha', 'Rua Nova',
    'Caseb', 'Kalilândia', 'Jardim Cruzeiro', 'Papagaio', 'Sítio Novo',
  ],
  'Joinville': [
    'Centro', 'América', 'Bom Retiro', 'Costa e Silva', 'Floresta',
    'Glória', 'Itaum', 'Iririú', 'Paranaguamirim', 'Saguaçu',
    'Atiradores', 'Anita Garibaldi', 'Boa Vista', 'Bucarein', 'Comasa',
    'Fátima', 'Jarivatuba', 'Jardim Paraíso',
  ],
  'Londrina': [
    'Centro', 'Aeroporto', 'Cafezal', 'Centro Cívico', 'Gleba Palhano',
    'Jardim Higienópolis', 'Jardim Maravilha', 'Jardim Morumbi', 'Operária',
    'Parque Ouro Branco', 'Parque São Jorge', 'Portal de Versalhes', 'Vila Brasil',
    'Vila Nova', 'Vila Recreio', 'Warta', 'Wilson',
  ],
  'Maringá': [
    'Centro', 'Zona 1', 'Zona 2', 'Zona 3', 'Zona 4',
    'Zona 5', 'Zona 6', 'Zona 7', 'Zona 8', 'Conjunto Habitacional',
    'Jardim Alvorada', 'Jardim Aclimação', 'Jardim Novo Horizonte', 'Jardim Progresso',
    'Parque das Grevíleas', 'Parque das Laranjeiras',
  ],
  'Caxias do Sul': [
    'Centro', 'Cinquentenário', 'Exposição', 'Jardim América', 'Medianeira',
    'Nossa Senhora de Lourdes', 'Panazzolo', 'Petrópolis', 'Pio X',
    'São Pelegrino', 'Santa Fé', 'Santo Antônio', 'Universitário',
    'Vila Seca', 'Vila Oliva', 'Cruzeiro',
  ],
}

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
  // Novas cidades
  { name: 'Guarulhos', state: 'SP', priority: 90 },
  { name: 'Campinas', state: 'SP', priority: 89 },
  { name: 'São Bernardo do Campo', state: 'SP', priority: 88 },
  { name: 'Santo André', state: 'SP', priority: 87 },
  { name: 'Osasco', state: 'SP', priority: 86 },
  { name: 'Niterói', state: 'RJ', priority: 85 },
  { name: 'Duque de Caxias', state: 'RJ', priority: 84 },
  { name: 'Contagem', state: 'MG', priority: 83 },
  { name: 'Betim', state: 'MG', priority: 82 },
  { name: 'Feira de Santana', state: 'BA', priority: 81 },
  { name: 'Joinville', state: 'SC', priority: 80 },
  { name: 'Londrina', state: 'PR', priority: 79 },
  { name: 'Maringá', state: 'PR', priority: 78 },
  { name: 'Caxias do Sul', state: 'RS', priority: 77 },
]

async function main() {
  console.log('🚀 Configurando cidades e bairros...\n')
  
  try {
    await login()
    
    // 1. Verificar se as collections existem
    console.log('\n📦 Verificando collections...')
    
    let citiesExists = false
    let neighborhoodsExists = false
    
    try {
      await api('/items/cities?limit=1')
      citiesExists = true
      console.log('   ✅ Collection "cities" existe')
    } catch (e) {
      console.log('   ⚠️  Collection "cities" não existe ou precisa ser criada manualmente')
    }
    
    try {
      await api('/items/neighborhoods?limit=1')
      neighborhoodsExists = true
      console.log('   ✅ Collection "neighborhoods" existe')
    } catch (e) {
      console.log('   ⚠️  Collection "neighborhoods" não existe ou precisa ser criada manualmente')
    }
    
    if (!citiesExists || !neighborhoodsExists) {
      console.log('\n⚠️  AÇÃO NECESSÁRIA:')
      console.log('   As collections precisam ser criadas manualmente no Directus Admin:')
      console.log('   1. Acesse https://base.pontogp.com/admin')
      console.log('   2. Vá em Settings > Data Model')
      console.log('   3. Crie a collection "cities" com campos: name (string), state (string), priority (integer), neighborhoods_count (integer)')
      console.log('   4. Crie a collection "neighborhoods" com campos: name (string), city_id (uuid/m2o para cities), priority (integer)')
      console.log('   5. Execute este script novamente')
      process.exit(1)
    }
    
    // 2. Popular dados
    console.log('\n📊 Populando dados...')
    
    let citiesCreated = 0
    let neighborhoodsCreated = 0
    
    for (const capital of CAPITALS) {
      console.log(`\n   🏙️  ${capital.name}/${capital.state}...`)
      
      // Buscar ou criar cidade
      let cityId = null
      let cityData = null
      try {
        const existing = await api(`/items/cities?filter[name][_eq]=${encodeURIComponent(capital.name)}&filter[state][_eq]=${capital.state}`)
        if (existing.data && existing.data.length > 0) {
          cityData = existing.data[0]
          cityId = cityData.id
          console.log(`      ⏭️  Cidade já existe (ID: ${cityId})`)
        }
      } catch (e) {
        console.log(`      ⚠️  Erro ao buscar cidade: ${e.message}`)
      }
      
      if (!cityId) {
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
      }
      
      // Adicionar bairros
      const neighborhoods = CITY_NEIGHBORHOODS[capital.name] || []
      let bairrosAdded = 0
      
      for (let i = 0; i < neighborhoods.length; i++) {
        const name = neighborhoods[i]
        const priority = neighborhoods.length - i
        
        // Verificar se já existe
        let exists = false
        try {
          const existing = await api(`/items/neighborhoods?filter[name][_eq]=${encodeURIComponent(name)}&filter[city_id][_eq]=${cityId}`)
          if (existing.data && existing.data.length > 0) {
            exists = true
          }
        } catch (e) {
          // Se der erro na busca, tenta criar mesmo assim
        }
        
        if (exists) continue
        
        try {
          await api('/items/neighborhoods', 'POST', {
            name,
            city_id: cityId,
            priority,
          })
          bairrosAdded++
          neighborhoodsCreated++
        } catch (e) {
          console.log(`         ⚠️  Erro ao criar bairro "${name}": ${e.message}`)
        }
      }
      
      if (bairrosAdded > 0) {
        console.log(`      ✅ ${bairrosAdded} bairros adicionados`)
        
        // Atualizar contador
        try {
          await api(`/items/cities/${cityId}`, 'PATCH', {
            neighborhoods_count: neighborhoods.length,
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

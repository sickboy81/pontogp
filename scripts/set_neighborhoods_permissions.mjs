#!/usr/bin/env node
/**
 * Script simples para configurar permissões de leitura pública para cities e neighborhoods
 */

const DIRECTUS_URL = 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

async function main() {
  console.log('🔐 Configurando permissões...\n')
  
  // Login
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const loginData = await loginRes.json()
  const token = loginData.data.access_token
  console.log('✅ Login OK\n')

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Buscar policies
  const policiesRes = await fetch(`${DIRECTUS_URL}/policies`, { headers })
  const policiesData = await policiesRes.json()
  
  // Encontrar policy pública
  let publicPolicy = policiesData.data.find(p => 
    p.name?.toLowerCase().includes('public') || 
    p.admin_access === false
  )
  
  if (!publicPolicy) {
    console.log('⚠️  Nenhuma policy pública encontrada')
    console.log('   Policies disponíveis:')
    policiesData.data.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`))
    
    // Usar primeira policy que não seja admin
    publicPolicy = policiesData.data.find(p => !p.admin_access)
  }
  
  if (!publicPolicy) {
    console.log('❌ Não foi possível encontrar uma policy para aplicar permissões')
    process.exit(1)
  }
  
  console.log(`📋 Usando policy: ${publicPolicy.name} (ID: ${publicPolicy.id})\n`)

  // Criar permissões de leitura
  for (const collection of ['cities', 'neighborhoods']) {
    console.log(`   Configurando "${collection}"...`)
    
    // Verificar se já existe
    const checkRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${publicPolicy.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`,
      { headers }
    )
    const checkData = await checkRes.json()
    
    if (checkData.data && checkData.data.length > 0) {
      console.log(`   ⏭️  Permissão já existe`)
      continue
    }
    
    // Criar permissão
    const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        policy: publicPolicy.id,
        collection,
        action: 'read',
        fields: ['*'],
        permissions: {},
        validation: {},
      }),
    })
    
    if (createRes.ok) {
      console.log(`   ✅ Permissão criada`)
    } else {
      const err = await createRes.text()
      console.log(`   ⚠️  Erro: ${err}`)
    }
  }
  
  console.log('\n✅ Concluído!')
}

main().catch(e => {
  console.error('❌ Erro:', e.message)
  process.exit(1)
})

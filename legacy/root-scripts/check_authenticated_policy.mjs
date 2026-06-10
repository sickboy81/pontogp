#!/usr/bin/env node
/**
 * Script para verificar qual policy está associada ao role Authenticated
 */

const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL || 'https://base.pontogp.com'
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]'

async function main() {
  console.log('🔍 Verificando policies do role Authenticated...\n')

  try {
    // Login
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    })
    
    const loginData = await loginRes.json()
    const token = loginData.data.access_token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // Buscar role Authenticated
    const roleRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Authenticated`, { headers })
    const roleData = await roleRes.json()
    const role = roleData.data?.[0]

    if (!role) {
      console.log('❌ Role Authenticated não encontrado')
      return
    }

    console.log(`✅ Role Authenticated encontrado:`)
    console.log(`   ID: ${role.id}`)
    console.log(`   Policies IDs: ${JSON.stringify(role.policies || [])}\n`)

    // Buscar todas as policies
    const policiesRes = await fetch(`${DIRECTUS_URL}/policies`, { headers })
    const policiesData = await policiesRes.json()
    const policies = policiesData.data || []

    console.log('📋 Policies encontradas:\n')
    
    // Filtrar apenas as que estão associadas ao role Authenticated
    const authenticatedPolicies = policies.filter(p => 
      role.policies?.includes(p.id)
    )

    if (authenticatedPolicies.length > 0) {
      console.log('✅ Policies associadas ao role Authenticated:')
      authenticatedPolicies.forEach(p => {
        console.log(`\n   Nome: ${p.name}`)
        console.log(`   ID: ${p.id}`)
        console.log(`   Descrição: ${p.description || '(sem descrição)'}`)
        console.log(`   Role: ${p.role || 'N/A'}`)
      })
    } else {
      console.log('⚠️ Nenhuma policy encontrada associada diretamente')
      console.log('\nTodas as policies disponíveis:')
      policies.forEach(p => {
        if (p.name?.toLowerCase().includes('authenticated') || p.name?.toLowerCase().includes('app')) {
          console.log(`\n   Nome: ${p.name}`)
          console.log(`   ID: ${p.id}`)
          console.log(`   Role: ${p.role || 'N/A'}`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

main()

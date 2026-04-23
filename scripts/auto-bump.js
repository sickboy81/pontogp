/**
 * Auto-Bump Scheduler Script
 * 
 * Este script deve ser executado via cron ou scheduler para subir
 * automaticamente todos os perfis elegíveis.
 * 
 * Configuração recomendada de cron:
 * - A cada 1 hora: 0 * * * * node scripts/auto-bump.js
 * 
 * O script:
 * 1. Busca todos os perfis ativos
 * 2. Para cada perfil, verifica se pode subir (limite diário e intervalo)
 * 3. Executa a subida e atualiza os contadores
 */

import PocketBase from 'pocketbase'

const POCKETBASE_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'https://pocketbase.cerejavip.com').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD

const pb = new PocketBase(POCKETBASE_URL)

// Helper para obter a data local no formato YYYY-MM-DD
const getLocalDateString = () => {
    const date = new Date()
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset * 60 * 1000))
    return localDate.toISOString().split('T')[0]
}

// Obter registro de subidas diárias para um perfil
const getDailyBumps = async (profileId) => {
    try {
        const today = getLocalDateString()
        const records = await pb.collection('profile_daily_bumps').getList(1, 1, {
            filter: `profile = "${profileId}" && date = "${today}"`
        })
        return records.items.length > 0 ? records.items[0] : null
    } catch (error) {
        console.error(`[AutoBump] Erro ao buscar subidas do perfil ${profileId}:`, error.message)
        return null
    }
}

// Verificar se pode fazer bump
const canBump = async (profileId, plan) => {
    if (!plan || plan.daily_bumps === 0) return false
    if (plan.enabled === false) return false

    const dailyBump = await getDailyBumps(profileId)
    if (!dailyBump) return true

    return dailyBump.bumps_used < plan.daily_bumps
}

// Incrementar contador de subidas
const incrementBump = async (profileId) => {
    const today = getLocalDateString()
    const existing = await getDailyBumps(profileId)

    let bumpsUsed
    if (existing) {
        const updated = await pb.collection('profile_daily_bumps').update(existing.id, {
            bumps_used: (existing.bumps_used || 0) + 1
        })
        bumpsUsed = updated.bumps_used
    } else {
        const created = await pb.collection('profile_daily_bumps').create({
            profile: profileId,
            date: today,
            bumps_used: 1
        })
        bumpsUsed = created.bumps_used
    }

    // Atualizar last_bump_at do perfil
    await pb.collection('profiles').update(profileId, {
        last_bump_at: new Date().toISOString()
    })

    return bumpsUsed
}

// Função principal
const runAutoBump = async () => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('[AutoBump] Defina POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD (ou PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD)')
        process.exit(1)
    }
    console.log('='.repeat(60))
    console.log(`[AutoBump] Iniciando em ${new Date().toISOString()}`)
    console.log('='.repeat(60))

    try {
        // Autenticar como admin
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
        console.log('[AutoBump] Autenticado com sucesso')

        // Buscar todos os planos
        const plans = await pb.collection('plans').getFullList()
        const plansMap = new Map(plans.map(p => [p.slug, p]))

        // Buscar todos os perfis ativos
        const profiles = await pb.collection('profiles').getFullList({
            filter: 'status = "active"',
            sort: '-last_bump_at'
        })

        console.log(`[AutoBump] Encontrados ${profiles.length} perfis ativos`)

        let bumpedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const profile of profiles) {
            const plan = plansMap.get(profile.plan)

            if (!plan) {
                console.log(`[AutoBump] ⚠️ Perfil ${profile.id} (${profile.name}) sem plano válido`)
                skippedCount++
                continue
            }

            if (plan.daily_bumps === 0) {
                console.log(`[AutoBump] ⏭️ Perfil ${profile.id} (${profile.name}) - Plano sem subidas`)
                skippedCount++
                continue
            }

            // Verificar se pode subir
            const eligible = await canBump(profile.id, plan)
            if (!eligible) {
                console.log(`[AutoBump] ⏭️ Perfil ${profile.id} (${profile.name}) - Limite diário atingido`)
                skippedCount++
                continue
            }

            // Verificar intervalo mínimo entre subidas
            if (profile.last_bump_at) {
                const lastBump = new Date(profile.last_bump_at)
                const hoursSinceLastBump = (Date.now() - lastBump.getTime()) / (1000 * 60 * 60)

                // Calcular intervalo baseado no número de bumps diários
                // Se tem 6 bumps/dia, intervalo = 24h / 6 = 4 horas
                const interval = Math.max(1, 24 / plan.daily_bumps)

                if (hoursSinceLastBump < interval) {
                    console.log(`[AutoBump] ⏭️ Perfil ${profile.id} (${profile.name}) - Aguardando intervalo (${hoursSinceLastBump.toFixed(1)}h de ${interval}h)`)
                    skippedCount++
                    continue
                }
            }

            // Executar bump
            try {
                const usedCount = await incrementBump(profile.id)
                console.log(`[AutoBump] ✅ Perfil ${profile.id} (${profile.name}) - Subido! (${usedCount}/${plan.daily_bumps})`)
                bumpedCount++
            } catch (error) {
                console.error(`[AutoBump] ❌ Erro ao subir perfil ${profile.id}:`, error.message)
                errorCount++
            }
        }

        // Resumo
        console.log('='.repeat(60))
        console.log(`[AutoBump] Resumo:`)
        console.log(`  ✅ Subidos: ${bumpedCount}`)
        console.log(`  ⏭️ Ignorados: ${skippedCount}`)
        console.log(`  ❌ Erros: ${errorCount}`)
        console.log(`[AutoBump] Concluído em ${new Date().toISOString()}`)
        console.log('='.repeat(60))

    } catch (error) {
        console.error('[AutoBump] Erro fatal:', error)
        process.exit(1)
    }
}

// Executar
runAutoBump()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })

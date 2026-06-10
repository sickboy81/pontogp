/**
 * 🔐 Script COMPLETO para configurar todas as permissões do Directus 11
 * 
 * Este script configura automaticamente:
 * - Permissões para role Public (visitantes)
 * - Permissões para role Authenticated (usuários logados)
 * 
 * Execute: node scripts/configure_all_permissions.mjs
 */

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

let headers = {};
let token = '';

// =============================================================================
// CONFIGURAÇÃO DE PERMISSÕES
// =============================================================================

const PUBLIC_PERMISSIONS = [
    // profiles - read (todos - não filtrar por status pois campo não existe)
    { collection: 'profiles', action: 'read', permissions: {}, fields: ['*'] },
    // plans - read (todos)
    { collection: 'plans', action: 'read', permissions: {}, fields: ['*'] },
];

const AUTHENTICATED_PERMISSIONS = [
    // profiles - CRUD
    { collection: 'profiles', action: 'read', permissions: {}, fields: ['*'] },
    { collection: 'profiles', action: 'create', permissions: {}, presets: { user_id: '$CURRENT_USER.id' }, fields: ['*'] },
    { collection: 'profiles', action: 'update', permissions: { user_id: { _eq: '$CURRENT_USER.id' } }, fields: ['*'] },
    { collection: 'profiles', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER.id' } }, fields: ['*'] },
    // plans - read
    { collection: 'plans', action: 'read', permissions: {}, fields: ['*'] },
    // subscriptions - read próprio
    { collection: 'subscriptions', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER.id' } }, fields: ['*'] },
    // verification_requests - create/read próprio
    { collection: 'verification_requests', action: 'create', permissions: {}, presets: { user_id: '$CURRENT_USER.id', status: 'pending' }, fields: ['*'] },
    { collection: 'verification_requests', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER.id' } }, fields: ['*'] },
    // verification_requests - admin pode ler todos
    { collection: 'verification_requests', action: 'read', permissions: {}, fields: ['*'] },
    { collection: 'verification_requests', action: 'update', permissions: {}, fields: ['*'] },
    // contacts - create
    { collection: 'contacts', action: 'create', permissions: {}, fields: ['*'] },
    // reports - create
    { collection: 'reports', action: 'create', permissions: {}, presets: { reporter_id: '$CURRENT_USER.id', status: 'pending' }, fields: ['*'] },
    // profile_views - create
    { collection: 'profile_views', action: 'create', permissions: {}, fields: ['*'] },
    // profile_clicks - create
    { collection: 'profile_clicks', action: 'create', permissions: {}, fields: ['*'] },
    // settings - read
    { collection: 'settings', action: 'read', permissions: {}, fields: ['*'] },
];

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

async function login() {
    console.log('🔑 Fazendo login...');
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!response.ok) {
        throw new Error('Falha no login');
    }

    const data = await response.json();
    token = data.data.access_token;
    headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    console.log('   ✅ Login OK\n');
}

async function getRoles() {
    const response = await fetch(`${DIRECTUS_URL}/roles?fields=*,policies.*`, { headers });
    const data = await response.json();
    return data.data;
}

async function getPolicies() {
    const response = await fetch(`${DIRECTUS_URL}/policies?limit=-1`, { headers });
    const data = await response.json();
    return data.data || [];
}

async function getPermissions() {
    const response = await fetch(`${DIRECTUS_URL}/permissions?limit=-1`, { headers });
    const data = await response.json();
    return data.data || [];
}

async function getAccess() {
    const response = await fetch(`${DIRECTUS_URL}/access?limit=-1`, { headers });
    const data = await response.json();
    return data.data || [];
}

async function createPolicy(name, roleId) {
    const response = await fetch(`${DIRECTUS_URL}/policies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: name,
            admin_access: false,
            app_access: true
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Erro ao criar policy');
    }

    const data = await response.json();
    return data.data;
}

async function createAccess(roleId, policyId) {
    const response = await fetch(`${DIRECTUS_URL}/access`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            role: roleId,
            policy: policyId
        })
    });

    return response.ok;
}

async function createPermission(policyId, perm) {
    const response = await fetch(`${DIRECTUS_URL}/permissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            policy: policyId,
            collection: perm.collection,
            action: perm.action,
            permissions: perm.permissions || {},
            presets: perm.presets || null,
            fields: perm.fields || ['*']
        })
    });

    return response.ok;
}

async function updatePermission(permId, updates) {
    const response = await fetch(`${DIRECTUS_URL}/permissions/${permId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
    });

    return response.ok;
}

async function updatePolicy(policyId, updates) {
    const response = await fetch(`${DIRECTUS_URL}/policies/${policyId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
    });

    return response.ok;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('═'.repeat(60));
    console.log('🔐 CONFIGURAÇÃO AUTOMÁTICA DE PERMISSÕES - DIRECTUS 11');
    console.log('═'.repeat(60) + '\n');

    await login();

    // 1. Buscar dados existentes
    console.log('📊 Buscando dados existentes...\n');
    
    const roles = await getRoles();
    const policies = await getPolicies();
    const permissions = await getPermissions();
    const access = await getAccess();

    console.log(`   - ${roles.length} roles`);
    console.log(`   - ${policies.length} policies`);
    console.log(`   - ${permissions.length} permissions`);
    console.log(`   - ${access.length} access entries\n`);

    // Encontrar roles
    const publicRole = roles.find(r => r.name?.toLowerCase() === 'public');
    const authenticatedRole = roles.find(r => r.name?.toLowerCase() === 'authenticated');

    if (!publicRole) {
        console.log('❌ Role "Public" não encontrada!');
        return;
    }
    if (!authenticatedRole) {
        console.log('❌ Role "Authenticated" não encontrada!');
        return;
    }

    console.log(`   Public Role: ${publicRole.id}`);
    console.log(`   Authenticated Role: ${authenticatedRole.id}\n`);

    // 2. Configurar policies
    console.log('═'.repeat(60));
    console.log('📝 CONFIGURANDO POLICIES');
    console.log('═'.repeat(60) + '\n');

    // Encontrar ou criar policies
    let publicPolicy = policies.find(p => p.name === 'App Public Access');
    let authenticatedPolicy = policies.find(p => p.name === 'App Authenticated Access');

    if (!publicPolicy) {
        console.log('   Criando policy "App Public Access"...');
        publicPolicy = await createPolicy('App Public Access');
        console.log(`   ✅ Criada: ${publicPolicy.id}`);
    } else {
        console.log(`   ⏭️ Policy "App Public Access" já existe: ${publicPolicy.id}`);
    }

    if (!authenticatedPolicy) {
        console.log('   Criando policy "App Authenticated Access"...');
        authenticatedPolicy = await createPolicy('App Authenticated Access');
        console.log(`   ✅ Criada: ${authenticatedPolicy.id}`);
    } else {
        console.log(`   ⏭️ Policy "App Authenticated Access" já existe: ${authenticatedPolicy.id}`);
    }

    // 3. Associar policies aos roles
    console.log('\n   Associando policies aos roles...');

    const publicAccess = access.find(a => a.role === publicRole.id && a.policy === publicPolicy.id);
    if (!publicAccess) {
        const ok = await createAccess(publicRole.id, publicPolicy.id);
        console.log(`   ${ok ? '✅' : '❌'} Public Role -> App Public Access`);
    } else {
        console.log('   ⏭️ Public Role já associado');
    }

    const authAccess = access.find(a => a.role === authenticatedRole.id && a.policy === authenticatedPolicy.id);
    if (!authAccess) {
        const ok = await createAccess(authenticatedRole.id, authenticatedPolicy.id);
        console.log(`   ${ok ? '✅' : '❌'} Authenticated Role -> App Authenticated Access`);
    } else {
        console.log('   ⏭️ Authenticated Role já associado');
    }

    // 4. Configurar permissões para Public
    console.log('\n' + '═'.repeat(60));
    console.log('📝 PERMISSÕES PARA PUBLIC');
    console.log('═'.repeat(60) + '\n');

    // Também adicionar nas policies existentes do Public
    const publicPolicies = access.filter(a => a.role === publicRole.id).map(a => a.policy);
    publicPolicies.push(publicPolicy.id);
    const uniquePublicPolicies = [...new Set(publicPolicies)];

    for (const perm of PUBLIC_PERMISSIONS) {
        let created = false;
        
        for (const policyId of uniquePublicPolicies) {
            const exists = permissions.find(
                p => p.policy === policyId && p.collection === perm.collection && p.action === perm.action
            );

            if (!exists) {
                const ok = await createPermission(policyId, perm);
                if (ok && !created) {
                    console.log(`   ✅ ${perm.collection}.${perm.action}`);
                    created = true;
                }
            } else {
                // Atualizar se necessário
                if (exists.permissions === null || JSON.stringify(exists.permissions) !== JSON.stringify(perm.permissions)) {
                    await updatePermission(exists.id, { permissions: perm.permissions, fields: perm.fields });
                }
                if (!created) {
                    console.log(`   ⏭️ ${perm.collection}.${perm.action} (já existe)`);
                    created = true;
                }
            }
        }
    }

    // 5. Configurar permissões para Authenticated
    console.log('\n' + '═'.repeat(60));
    console.log('📝 PERMISSÕES PARA AUTHENTICATED');
    console.log('═'.repeat(60) + '\n');

    for (const perm of AUTHENTICATED_PERMISSIONS) {
        const exists = permissions.find(
            p => p.policy === authenticatedPolicy.id && p.collection === perm.collection && p.action === perm.action
        );

        if (!exists) {
            const ok = await createPermission(authenticatedPolicy.id, perm);
            console.log(`   ${ok ? '✅' : '❌'} ${perm.collection}.${perm.action}`);
        } else {
            console.log(`   ⏭️ ${perm.collection}.${perm.action} (já existe)`);
        }
    }

    // 6. Garantir app_access em todas as policies públicas
    console.log('\n' + '═'.repeat(60));
    console.log('🔧 GARANTINDO APP_ACCESS');
    console.log('═'.repeat(60) + '\n');

    for (const policyId of uniquePublicPolicies) {
        const policy = policies.find(p => p.id === policyId);
        if (policy && !policy.app_access) {
            const ok = await updatePolicy(policyId, { app_access: true });
            console.log(`   ${ok ? '✅' : '❌'} Policy ${policy.name || policyId} -> app_access: true`);
        }
    }

    // 7. Testar
    console.log('\n' + '═'.repeat(60));
    console.log('🧪 TESTANDO PERMISSÕES');
    console.log('═'.repeat(60) + '\n');

    const tests = [
        { name: 'Public: profiles', url: `${DIRECTUS_URL}/items/profiles?limit=1` },
        { name: 'Public: plans', url: `${DIRECTUS_URL}/items/plans?limit=1` },
    ];

    for (const test of tests) {
        const response = await fetch(test.url);
        console.log(`   ${response.ok ? '✅' : '❌'} ${test.name}: ${response.status}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ CONFIGURAÇÃO CONCLUÍDA!');
    console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});

/**
 * Script para configurar permissões automaticamente no Directus 11
 * O Directus 11 requer um campo "policy" obrigatório para criar permissões
 */

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

let headers = {};

async function main() {
    console.log('🔐 Configurando Permissões no Directus 11...\n');

    // 1. Login
    console.log('1. Fazendo login como admin...');
    const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginResponse.ok) {
        const err = await loginResponse.text();
        throw new Error(`Falha no login: ${err}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.access_token;
    console.log('   ✅ Login realizado!\n');

    headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Buscar roles
    console.log('2. Buscando roles...');
    const rolesResponse = await fetch(`${DIRECTUS_URL}/roles`, { headers });
    const rolesData = await rolesResponse.json();
    const roles = rolesData.data;

    console.log('   Roles encontradas:');
    roles.forEach(r => console.log(`   - ${r.name} (${r.id})`));

    const publicRole = roles.find(r => r.name?.toLowerCase() === 'public');
    const authenticatedRole = roles.find(r => r.name?.toLowerCase() === 'authenticated');

    // 3. Buscar policies existentes
    console.log('\n3. Buscando policies existentes...');
    const policiesResponse = await fetch(`${DIRECTUS_URL}/policies?limit=-1`, { headers });
    let policies = [];
    
    if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        policies = policiesData.data || [];
        console.log(`   - ${policies.length} policies encontradas`);
        policies.forEach(p => console.log(`   - ${p.name || 'Sem nome'} (${p.id}) - Role: ${p.role || 'N/A'}`));
    } else {
        console.log('   - Endpoint /policies não disponível');
    }

    // 4. Criar ou encontrar policies para cada role
    console.log('\n4. Configurando policies...');
    
    let publicPolicy = policies.find(p => p.role === publicRole?.id);
    let authenticatedPolicy = policies.find(p => p.role === authenticatedRole?.id);

    if (!publicPolicy && publicRole) {
        console.log('   Criando policy para Public...');
        publicPolicy = await createPolicy('Public Access Policy', publicRole.id);
    }

    if (!authenticatedPolicy && authenticatedRole) {
        console.log('   Criando policy para Authenticated...');
        authenticatedPolicy = await createPolicy('Authenticated Access Policy', authenticatedRole.id);
    }

    if (publicPolicy) {
        console.log(`   ✅ Public Policy: ${publicPolicy.id}`);
    }
    if (authenticatedPolicy) {
        console.log(`   ✅ Authenticated Policy: ${authenticatedPolicy.id}`);
    }

    // 5. Buscar permissões existentes
    console.log('\n5. Buscando permissões existentes...');
    const permsResponse = await fetch(`${DIRECTUS_URL}/permissions?limit=-1`, { headers });
    const permsData = await permsResponse.json();
    const existingPerms = permsData.data || [];
    console.log(`   - ${existingPerms.length} permissões encontradas`);

    // 6. Criar permissões
    console.log('\n6. Criando permissões...\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Permissões Public
    if (publicPolicy) {
        console.log('   📝 PUBLIC:');
        
        // profiles - read (apenas active)
        const result1 = await createPermission(publicPolicy.id, 'profiles', 'read', 
            { status: { _eq: 'active' } }, null, existingPerms);
        updateCounts(result1, { created: () => created++, skipped: () => skipped++, error: () => errors++ });

        // plans - read
        const result2 = await createPermission(publicPolicy.id, 'plans', 'read', 
            {}, null, existingPerms);
        updateCounts(result2, { created: () => created++, skipped: () => skipped++, error: () => errors++ });

        // contacts - create (público pode enviar mensagens pelo Fale Conosco)
        const result3 = await createPermission(publicPolicy.id, 'contacts', 'create', 
            {}, null, existingPerms);
        updateCounts(result3, { created: () => created++, skipped: () => skipped++, error: () => errors++ });
    }

    // Permissões Authenticated
    if (authenticatedPolicy) {
        console.log('\n   📝 AUTHENTICATED:');

        const authPerms = [
            // profiles
            { collection: 'profiles', action: 'read', permissions: {} },
            { collection: 'profiles', action: 'create', permissions: {}, presets: { user_id: '$CURRENT_USER.id' } },
            { collection: 'profiles', action: 'update', permissions: { user_id: { _eq: '$CURRENT_USER.id' } } },
            { collection: 'profiles', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER.id' } } },
            // plans
            { collection: 'plans', action: 'read', permissions: {} },
            // subscriptions
            { collection: 'subscriptions', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER.id' } } },
            // verification_requests
            { collection: 'verification_requests', action: 'create', permissions: {}, presets: { user_id: '$CURRENT_USER.id', status: 'pending' } },
            { collection: 'verification_requests', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER.id' } } },
            // contacts
            { collection: 'contacts', action: 'create', permissions: {} },
            // reports
            { collection: 'reports', action: 'create', permissions: {}, presets: { reporter_id: '$CURRENT_USER.id', status: 'pending' } },
            // profile_views
            { collection: 'profile_views', action: 'create', permissions: {} },
            // profile_clicks
            { collection: 'profile_clicks', action: 'create', permissions: {} },
            // settings
            { collection: 'settings', action: 'read', permissions: {} }
        ];

        for (const perm of authPerms) {
            const result = await createPermission(
                authenticatedPolicy.id, 
                perm.collection, 
                perm.action, 
                perm.permissions,
                perm.presets || null,
                existingPerms
            );
            updateCounts(result, { created: () => created++, skipped: () => skipped++, error: () => errors++ });
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO:');
    console.log(`   - Permissões criadas: ${created}`);
    console.log(`   - Já existentes: ${skipped}`);
    console.log(`   - Erros: ${errors}`);
    console.log('='.repeat(50));

    // 7. Testar permissões
    console.log('\n7. Testando permissões...\n');
    await testPermissions();

    if (errors === 0) {
        console.log('\n✅ Configuração de permissões concluída com sucesso!\n');
    } else {
        console.log('\n⚠️ Configuração concluída com alguns erros. Verifique os detalhes acima.\n');
    }
}

async function createPolicy(name, roleId) {
    try {
        const response = await fetch(`${DIRECTUS_URL}/policies`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: name,
                role: roleId,
                admin_access: false,
                app_access: true
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.data;
        } else {
            const error = await response.json();
            console.log(`   ⚠️ Erro ao criar policy: ${error.errors?.[0]?.message || response.status}`);
            return null;
        }
    } catch (e) {
        console.log(`   ❌ Erro: ${e.message}`);
        return null;
    }
}

async function createPermission(policyId, collection, action, permissions, presets, existingPerms) {
    // Verificar se já existe
    const exists = existingPerms.some(
        p => p.policy === policyId && p.collection === collection && p.action === action
    );

    if (exists) {
        console.log(`      ⏭️ ${collection}.${action} - já existe`);
        return 'skipped';
    }

    try {
        const permData = {
            policy: policyId,
            collection: collection,
            action: action,
            permissions: permissions || {},
            fields: ['*']
        };

        if (presets) {
            permData.presets = presets;
        }

        const response = await fetch(`${DIRECTUS_URL}/permissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(permData)
        });

        if (response.ok) {
            console.log(`      ✅ ${collection}.${action}`);
            return 'created';
        } else {
            const error = await response.json();
            const msg = error.errors?.[0]?.message || `Status ${response.status}`;
            
            if (msg.includes('already exists') || msg.includes('Duplicate')) {
                console.log(`      ⏭️ ${collection}.${action} - já existe`);
                return 'skipped';
            } else if (msg.includes('doesn\'t exist') || msg.includes('not exist')) {
                console.log(`      ⚠️ ${collection}.${action} - collection não existe`);
                return 'skipped';
            } else {
                console.log(`      ❌ ${collection}.${action} - ${msg}`);
                return 'error';
            }
        }
    } catch (e) {
        console.log(`      ❌ ${collection}.${action} - ${e.message}`);
        return 'error';
    }
}

function updateCounts(result, callbacks) {
    if (result === 'created') callbacks.created();
    else if (result === 'skipped') callbacks.skipped();
    else callbacks.error();
}

async function testPermissions() {
    console.log('   Testando acesso público a profiles...');
    try {
        const response = await fetch(`${DIRECTUS_URL}/items/profiles?limit=1`);
        if (response.ok) {
            console.log('   ✅ Public pode ler profiles');
        } else if (response.status === 403) {
            console.log('   ❌ Public NÃO pode ler profiles (403)');
        } else {
            console.log(`   ⚠️ Status: ${response.status}`);
        }
    } catch (e) {
        console.log(`   ❌ Erro: ${e.message}`);
    }

    console.log('   Testando acesso público a plans...');
    try {
        const response = await fetch(`${DIRECTUS_URL}/items/plans?limit=1`);
        if (response.ok) {
            console.log('   ✅ Public pode ler plans');
        } else if (response.status === 403) {
            console.log('   ❌ Public NÃO pode ler plans (403)');
        } else {
            console.log(`   ⚠️ Status: ${response.status}`);
        }
    } catch (e) {
        console.log(`   ❌ Erro: ${e.message}`);
    }
}

main().catch(err => {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
});

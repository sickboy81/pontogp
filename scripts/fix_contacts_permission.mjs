/**
 * Script para adicionar permissão de criação de contacts para o role Public
 * Isso permite que usuários não autenticados enviem mensagens pelo "Fale Conosco"
 */

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

let headers = {};

async function main() {
    console.log('🔐 Configurando Permissão de Contacts para Public...\n');

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

    // 2. Buscar role Public
    console.log('2. Buscando role Public...');
    const rolesResponse = await fetch(`${DIRECTUS_URL}/roles`, { headers });
    const rolesData = await rolesResponse.json();
    const roles = rolesData.data;

    const publicRole = roles.find(r => r.name?.toLowerCase() === 'public');
    if (!publicRole) {
        throw new Error('Role "Public" não encontrada');
    }
    console.log(`   ✅ Role Public encontrada: ${publicRole.id}\n`);

    // 3. Buscar policies
    console.log('3. Buscando policies...');
    const policiesResponse = await fetch(`${DIRECTUS_URL}/policies?limit=-1`, { headers });
    let policies = [];
    
    if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        policies = policiesData.data || [];
    }

    // 4. Encontrar ou criar policy para Public
    let publicPolicy = policies.find(p => p.role === publicRole.id);
    
    if (!publicPolicy) {
        console.log('   Criando policy para Public...');
        const policyResponse = await fetch(`${DIRECTUS_URL}/policies`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Public Access Policy',
                role: publicRole.id,
                admin_access: false,
                app_access: true
            })
        });

        if (policyResponse.ok) {
            const policyData = await policyResponse.json();
            publicPolicy = policyData.data;
            console.log(`   ✅ Policy criada: ${publicPolicy.id}\n`);
        } else {
            const error = await policyResponse.json();
            throw new Error(`Erro ao criar policy: ${error.errors?.[0]?.message || policyResponse.status}`);
        }
    } else {
        console.log(`   ✅ Policy encontrada: ${publicPolicy.id}\n`);
    }

    // 5. Verificar permissão existente
    console.log('4. Verificando permissões existentes...');
    const permsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[policy][_eq]=${publicPolicy.id}&filter[collection][_eq]=contacts&filter[action][_eq]=create`, { headers });
    const permsData = await permsResponse.json();
    const existingPerms = permsData.data || [];

    if (existingPerms.length > 0) {
        console.log('   ⏭️ Permissão já existe!');
        console.log(`   ID: ${existingPerms[0].id}`);
        return;
    }

    // 6. Criar permissão
    console.log('5. Criando permissão de criação para contacts...');
    const permResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            policy: publicPolicy.id,
            collection: 'contacts',
            action: 'create',
            permissions: {},
            fields: ['*']
        })
    });

    if (permResponse.ok) {
        const permData = await permResponse.json();
        console.log('   ✅ Permissão criada com sucesso!');
        console.log(`   ID: ${permData.data.id}\n`);
    } else {
        const error = await permResponse.json();
        console.error('   ❌ Erro ao criar permissão:', error.errors?.[0]?.message || permResponse.status);
        throw new Error(`Erro ao criar permissão: ${error.errors?.[0]?.message || permResponse.status}`);
    }

    console.log('✅ Configuração concluída!\n');
    console.log('Agora usuários não autenticados podem enviar mensagens pelo "Fale Conosco".');
}

main().catch(error => {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
});

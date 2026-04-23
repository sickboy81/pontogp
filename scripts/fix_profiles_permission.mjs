/**
 * Script para corrigir permissão de profiles (remover filtro de status)
 */

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

async function main() {
    console.log('🔧 Corrigindo permissões de profiles...\n');

    // 1. Login
    const loginResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.access_token;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Buscar permissões de profiles
    console.log('1. Buscando permissões de profiles...\n');
    const permsResponse = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=profiles&limit=-1`, { headers });
    const permsData = await permsResponse.json();
    const profilesPerms = permsData.data || [];

    console.log(`   Encontradas: ${profilesPerms.length} permissões\n`);

    // 3. Atualizar permissões que têm filtro de status
    console.log('2. Atualizando permissões com filtro de status...\n');

    for (const perm of profilesPerms) {
        if (perm.permissions && perm.permissions.status) {
            console.log(`   Atualizando permissão ${perm.id} (${perm.action})...`);
            
            const updateResponse = await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    permissions: {}  // Remover filtro de status
                })
            });

            if (updateResponse.ok) {
                console.log(`   ✅ Atualizada!`);
            } else {
                const error = await updateResponse.json();
                console.log(`   ❌ Erro: ${error.errors?.[0]?.message}`);
            }
        } else {
            console.log(`   ⏭️ Permissão ${perm.id} (${perm.action}) não tem filtro de status`);
        }
    }

    // 4. Testar
    console.log('\n3. Testando permissões...\n');

    console.log('   Testando acesso público a profiles...');
    const profilesResponse = await fetch(`${DIRECTUS_URL}/items/profiles?limit=1`);
    console.log(`   ${profilesResponse.ok ? '✅' : '❌'} profiles: ${profilesResponse.status}`);

    if (profilesResponse.ok) {
        const data = await profilesResponse.json();
        console.log(`   Dados: ${JSON.stringify(data.data?.length)} perfis retornados`);
    } else {
        const error = await profilesResponse.text();
        console.log(`   Erro: ${error}`);
    }

    console.log('\n   Testando acesso público a plans...');
    const plansResponse = await fetch(`${DIRECTUS_URL}/items/plans?limit=1`);
    console.log(`   ${plansResponse.ok ? '✅' : '❌'} plans: ${plansResponse.status}`);

    console.log('\n✅ Concluído!');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});

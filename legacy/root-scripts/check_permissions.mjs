/**
 * Script para verificar e corrigir permissões de plans
 */

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

async function main() {
    console.log('🔍 Verificando permissões...\n');

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

    // 2. Buscar todas as permissões
    console.log('1. Buscando todas as permissões...\n');
    const permsResponse = await fetch(`${DIRECTUS_URL}/permissions?limit=-1`, { headers });
    const permsData = await permsResponse.json();
    const perms = permsData.data;

    console.log(`   Total: ${perms.length} permissões\n`);

    // 3. Filtrar permissões de plans
    console.log('2. Permissões para collection "plans":\n');
    const plansPerms = perms.filter(p => p.collection === 'plans');
    
    if (plansPerms.length === 0) {
        console.log('   ⚠️ Nenhuma permissão encontrada para plans!\n');
    } else {
        for (const perm of plansPerms) {
            console.log(`   - ID: ${perm.id}`);
            console.log(`     Action: ${perm.action}`);
            console.log(`     Policy: ${perm.policy}`);
            console.log(`     Role: ${perm.role || 'N/A'}`);
            console.log(`     Permissions: ${JSON.stringify(perm.permissions)}`);
            console.log(`     Fields: ${JSON.stringify(perm.fields)}`);
            console.log('');
        }
    }

    // 4. Buscar access
    console.log('3. Verificando access (role-policy associations)...\n');
    const accessResponse = await fetch(`${DIRECTUS_URL}/access?limit=-1`, { headers });
    const accessData = await accessResponse.json();
    const access = accessData.data;

    console.log(`   Total: ${access.length} registros de access\n`);
    for (const a of access) {
        console.log(`   - ID: ${a.id}`);
        console.log(`     Role: ${a.role}`);
        console.log(`     Policy: ${a.policy}`);
        console.log(`     User: ${a.user || 'N/A'}`);
        console.log('');
    }

    // 5. Buscar policies
    console.log('4. Verificando policies...\n');
    const policiesResponse = await fetch(`${DIRECTUS_URL}/policies?limit=-1`, { headers });
    const policiesData = await policiesResponse.json();
    const policies = policiesData.data;

    console.log(`   Total: ${policies.length} policies\n`);
    for (const p of policies) {
        console.log(`   - ID: ${p.id}`);
        console.log(`     Name: ${p.name}`);
        console.log(`     Admin Access: ${p.admin_access}`);
        console.log(`     App Access: ${p.app_access}`);
        console.log('');
    }

    // 6. Verificar qual policy tem permissão de plans
    console.log('5. Verificando qual policy tem permissão de plans...\n');
    
    for (const perm of plansPerms) {
        const policy = policies.find(p => p.id === perm.policy);
        const accessEntry = access.find(a => a.policy === perm.policy);
        
        console.log(`   Permissão ${perm.id}:`);
        console.log(`     Policy: ${policy?.name || perm.policy}`);
        console.log(`     Access Role: ${accessEntry?.role || 'NÃO ASSOCIADO'}`);
        console.log('');
    }

    // 7. Verificar se há permissão pública
    console.log('6. Verificando permissão pública para plans...\n');
    
    const PUBLIC_ROLE_ID = 'ed07fa91-31be-40c6-a1eb-fd0595c24907';
    const PUBLIC_POLICY_ID = '0d9aad8c-57d0-4542-83cc-3b8f6c8701fe';
    
    const publicPlansAccess = access.find(a => a.role === PUBLIC_ROLE_ID);
    console.log(`   Public role access: ${publicPlansAccess ? 'Sim' : 'Não'}`);
    if (publicPlansAccess) {
        console.log(`   Policy associada: ${publicPlansAccess.policy}`);
        
        const plansPerm = plansPerms.find(p => p.policy === publicPlansAccess.policy);
        console.log(`   Permissão de plans nessa policy: ${plansPerm ? 'Sim' : 'Não'}`);
    }

    // 8. Verificar se a permissão de plans está na policy correta
    const publicPlansPerm = plansPerms.find(p => p.policy === PUBLIC_POLICY_ID);
    console.log(`\n   Permissão de plans na policy "Public Access Policy": ${publicPlansPerm ? 'Sim' : 'Não'}`);
    
    if (publicPlansPerm) {
        const publicAccess = access.find(a => a.policy === PUBLIC_POLICY_ID && a.role === PUBLIC_ROLE_ID);
        console.log(`   Policy "Public Access Policy" associada ao role Public: ${publicAccess ? 'Sim' : 'Não'}`);
    }

    console.log('\n✅ Verificação concluída!');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});

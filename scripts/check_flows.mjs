// Script para verificar os Flows existentes
const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

let token = null;

async function login() {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error('Falha no login');
    const data = await res.json();
    token = data.data.access_token;
}

async function api(path) {
    const res = await fetch(`${DIRECTUS_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return await res.json();
}

async function main() {
    await login();
    console.log('✅ Login OK\n');

    // Listar todos os flows
    const flows = await api('/flows?fields=*,operations.*');
    console.log('📋 Flows existentes:\n');
    
    for (const flow of flows.data || []) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Nome: ${flow.name}`);
        console.log(`Status: ${flow.status}`);
        console.log(`Trigger: ${flow.trigger}`);
        console.log(`Options: ${JSON.stringify(flow.options, null, 2)}`);
        console.log(`Operation ID: ${flow.operation || 'NÃO VINCULADA'}`);
        
        if (flow.operations && flow.operations.length > 0) {
            console.log(`\nOperations (${flow.operations.length}):`);
            for (const op of flow.operations) {
                console.log(`  - ${op.name} (${op.type})`);
                console.log(`    Key: ${op.key}`);
                console.log(`    Options: ${JSON.stringify(op.options, null, 2).substring(0, 200)}...`);
            }
        }
        console.log('');
    }
}

main().catch(console.error);

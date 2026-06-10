// Script para desativar os Flows de email (evitar duplicação)
// Execute: node scripts/disable_email_flows.mjs

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
    console.log('✅ Login realizado!');
}

async function api(path, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${DIRECTUS_URL}${path}`, options);
    if (res.status === 204) return null;
    const data = await res.json();
    return data;
}

async function main() {
    console.log('🔇 Desativando Flows de Email...\n');
    
    try {
        await login();

        // Buscar flows de email
        const flows = await api('/flows?filter[name][_contains]=Email Personalizado');
        
        if (!flows.data || flows.data.length === 0) {
            console.log('Nenhum Flow de email encontrado.');
            return;
        }

        for (const flow of flows.data) {
            console.log(`📧 ${flow.name}...`);
            
            if (flow.status === 'inactive') {
                console.log(`   ⏭️  Já está inativo`);
                continue;
            }
            
            await api(`/flows/${flow.id}`, 'PATCH', { status: 'inactive' });
            console.log(`   ✅ Desativado`);
        }

        console.log('\n✅ Flows desativados!');
        console.log('   Os emails agora serão enviados apenas pelo sistema padrão do Directus.');
        console.log('   (ou pelos templates .liquid se estiverem configurados)');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

main();

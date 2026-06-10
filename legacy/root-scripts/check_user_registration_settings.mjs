// Script para verificar configurações de registro de usuários no Directus
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

async function api(path) {
    const res = await fetch(`${DIRECTUS_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return await res.json();
}

async function main() {
    console.log('🔍 Verificando configurações de registro de usuários...\n');
    
    try {
        await login();

        // Verificar roles
        console.log('📋 Roles disponíveis:');
        const rolesRes = await api('/roles?fields=*,users.*');
        for (const role of rolesRes.data || []) {
            console.log(`   - ${role.name} (ID: ${role.id})`);
            if (role.users) {
                console.log(`     Usuários: ${role.users.length}`);
            }
        }

        // Verificar settings
        console.log('\n⚙️  Configurações:');
        const settingsRes = await api('/settings?fields=*');
        console.log('   Settings encontrados:');
        for (const setting of settingsRes.data || []) {
            if (setting.key && setting.key.toLowerCase().includes('auth') || 
                setting.key && setting.key.toLowerCase().includes('user') ||
                setting.key && setting.key.toLowerCase().includes('email')) {
                console.log(`   - ${setting.key}: ${JSON.stringify(setting.value)}`);
            }
        }

        // Verificar usuários recentes
        console.log('\n👤 Últimos usuários criados:');
        const usersRes = await api('/users?fields=*,role.*&sort=-created_on&limit=5');
        for (const user of usersRes.data || []) {
            console.log(`   - ${user.email}`);
            console.log(`     Status: ${user.status}`);
            console.log(`     Role: ${user.role?.name || user.role || 'N/A'}`);
            console.log(`     Criado em: ${user.created_on || 'N/A'}`);
            console.log('');
        }

        console.log('✅ Verificação concluída!');
        console.log('\n💡 Para habilitar verificação de email:');
        console.log('   1. Acesse: https://base.pontogp.com/admin');
        console.log('   2. Vá em Settings → Users & Roles → Roles');
        console.log('   3. Configure o role padrão para novos usuários');
        console.log('   4. Ou crie um role "Unverified" e configure como padrão');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

main();

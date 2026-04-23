/**
 * Script para adicionar campo "read" (boolean) à collection "contacts"
 */

const DIRECTUS_URL = 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

let headers = {};

async function main() {
    console.log('🔧 Adicionando campo "read" à collection contacts...\n');

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

    // 2. Verificar se o campo já existe
    console.log('2. Verificando campos existentes na collection contacts...');
    try {
        const fieldsResponse = await fetch(`${DIRECTUS_URL}/fields/contacts`, { headers });
        if (fieldsResponse.ok) {
            const fieldsData = await fieldsResponse.json();
            const fields = fieldsData.data || [];
            const readField = fields.find(f => f.field === 'read');
            
            if (readField) {
                console.log('   ⏭️ Campo "read" já existe!');
                console.log('   ✅ Nada a fazer.\n');
                return;
            }
        }
    } catch (e) {
        console.log('   ⚠️ Erro ao verificar campos:', e.message);
    }

    // 3. Criar o campo "read"
    console.log('3. Criando campo "read"...');
    try {
        const createFieldResponse = await fetch(`${DIRECTUS_URL}/fields/contacts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                field: 'read',
                type: 'boolean',
                schema: {
                    default_value: false,
                    is_nullable: true
                },
                meta: {
                    interface: 'boolean',
                    options: {
                        label: 'Lida'
                    },
                    width: 'half',
                    note: 'Indica se a mensagem foi lida'
                }
            })
        });

        if (createFieldResponse.ok) {
            const fieldData = await createFieldResponse.json();
            console.log('   ✅ Campo "read" criado com sucesso!');
            console.log(`   ID: ${fieldData.data?.field || 'N/A'}\n`);
        } else {
            const error = await createFieldResponse.json();
            const errorMsg = error.errors?.[0]?.message || createFieldResponse.status;
            
            if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
                console.log('   ⏭️ Campo "read" já existe (pode ter sido criado durante a verificação)');
            } else {
                console.error('   ❌ Erro ao criar campo:', errorMsg);
                throw new Error(`Erro ao criar campo: ${errorMsg}`);
            }
        }
    } catch (e) {
        console.error('   ❌ Erro:', e.message);
        throw e;
    }

    console.log('✅ Processo concluído!\n');
    console.log('Agora você pode marcar mensagens como lidas no admin.');
}

main().catch(error => {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
});

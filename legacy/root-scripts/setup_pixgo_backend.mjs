
import './load-env.mjs';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const PIXGO_KEY = process.env.VITE_PIXGO_API_KEY;

if (!PIXGO_KEY) {
    console.error('❌ VITE_PIXGO_API_KEY não encontrada no .env');
    process.exit(1);
}

async function main() {
    try {
        console.log('🔌 Conectando ao PocketBase...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

        // Verifica se a chave já existe
        try {
            const records = await pb.collection('admin_config').getFullList({
                filter: 'key = "PIXGO_API_KEY"'
            });

            if (records.length > 0) {
                console.log('🔄 Atualizando chave existente...');
                await pb.collection('admin_config').update(records[0].id, {
                    value: PIXGO_KEY
                });
            } else {
                console.log('🆕 Criando nova entrada de configuração...');
                await pb.collection('admin_config').create({
                    key: 'PIXGO_API_KEY',
                    value: PIXGO_KEY,
                    description: 'Chave de API do PixGo (Segura)'
                });
            }
            console.log('✅ Chave PixGo salva com sucesso no admin_config!');
        } catch (e) {
            console.error('❌ Erro ao acessar admin_config:', e.message);
            // Tenta criar a collection se não existir (improvável, mas seguro)
        }

    } catch (e) {
        console.error('❌ Erro fatal:', e);
    }
}

main();

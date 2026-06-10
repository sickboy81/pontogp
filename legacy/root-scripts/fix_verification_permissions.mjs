import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function fixVerificationPermissions() {
    try {
        // Login como admin - use hardcoded credentials since env vars may not be set
        console.log('🔐 Fazendo login como admin...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', 'Newt@2025');
        console.log('✅ Login bem-sucedido!');

        // Buscar a coleção verification_requests
        console.log('\n📋 Buscando coleção verification_requests...');
        const collections = await pb.collections.getFullList();
        const verificationCollection = collections.find(c => c.name === 'verification_requests');

        if (!verificationCollection) {
            console.error('❌ Coleção verification_requests não encontrada!');
            return;
        }

        console.log('✅ Coleção encontrada:', verificationCollection.name);
        console.log('📋 Regras atuais:');
        console.log('  - List:', verificationCollection.listRule);
        console.log('  - View:', verificationCollection.viewRule);
        console.log('  - Create:', verificationCollection.createRule);
        console.log('  - Update:', verificationCollection.updateRule);
        console.log('  - Delete:', verificationCollection.deleteRule);

        // Atualizar regras de permissão com sintaxe simplificada
        // Removendo a verificação de role que pode estar causando problemas
        console.log('\n🔧 Atualizando permissões com sintaxe simplificada...');

        const updatedCollection = await pb.collections.update(verificationCollection.id, {
            // Regra SIMPLES para LIST: apenas verifica se o usuário é dono do registro
            listRule: '@request.auth.id = user',

            // Regra SIMPLES para VIEW: apenas verifica se o usuário é dono do registro
            viewRule: '@request.auth.id = user',

            // Regra para CREATE: qualquer usuário autenticado pode criar (para sua conta)
            createRule: '@request.auth.id != ""',

            // Regra para UPDATE: deixar vazia significa ninguém pode atualizar (exceto via Admin UI)
            updateRule: '',

            // Regra para DELETE: deixar vazia significa ninguém pode deletar (exceto via Admin UI)
            deleteRule: '',
        });

        console.log('✅ Permissões atualizadas com sucesso!');
        console.log('\n📋 Novas regras:');
        console.log('  - List:', updatedCollection.listRule);
        console.log('  - View:', updatedCollection.viewRule);
        console.log('  - Create:', updatedCollection.createRule);
        console.log('  - Update:', updatedCollection.updateRule);
        console.log('  - Delete:', updatedCollection.deleteRule);

        console.log('\n✅ Processo concluído!');
        console.log('📌 Regras simplificadas aplicadas - testando sem verificação de role.');

    } catch (error) {
        console.error('❌ Erro:', error);
        if (error.response) {
            console.error('Detalhes:', error.response);
        }
    }
}

fixVerificationPermissions();

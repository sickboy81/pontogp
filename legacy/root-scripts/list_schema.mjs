import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function listSchema() {
    try {
        console.log('🔌 Conectando...');
        await pb.collection('_superusers').authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        const collection = await pb.collections.getOne('profiles');
        const fields = collection.fields || collection.schema || []; // PB uses 'fields' in recent versions

        console.log('📋 Campos da coleção profiles:');
        fields.forEach(f => {
            console.log(`- ${f.name} (${f.type})`);
        });

    } catch (error) {
        console.error(error);
    }
}

listSchema();

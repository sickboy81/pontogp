import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

const newFields = [
    { name: 'hair_color', type: 'json' },
    { name: 'height', type: 'json' },
    { name: 'body_type', type: 'json' },
    { name: 'breast_type', type: 'json' },
    { name: 'pubis_type', type: 'json' },
    { name: 'service_locations', type: 'json' },
    { name: 'service_to', type: 'json' },
    { name: 'prices', type: 'json' },
    { name: 'massage_types', type: 'json' },
    { name: 'special_services', type: 'json' },
    { name: 'other_services', type: 'json' },
    { name: 'for_sale', type: 'json' },
    { name: 'online_services', type: 'json' },
    { name: 'virtual_fantasies', type: 'json' },
    { name: 'certified', type: 'bool' },
    { name: 'verified', type: 'bool' },
    { name: 'location_lat', type: 'number' },
    { name: 'location_lng', type: 'number' },
    { name: 'location_approximate', type: 'bool' },
    { name: 'ethnicity', type: 'text' }
];

async function forceAddFields() {
    try {
        console.log('🔌 Connecting...');
        await pb.collection('_superusers').authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('📥 Fetching collection...');
        const collection = await pb.collections.getOne('profiles');

        // Identificar a propriedade correta (fields ou schema)
        // Em versões recentes, collection.fields é o array de campos.
        let currentFields = collection.fields || [];

        // Se estiver vazio, tenta schema (compatibilidade)
        if (!currentFields.length && collection.schema) {
            currentFields = collection.schema;
        }

        console.log(`Current fields count: ${currentFields.length}`);

        let addedCount = 0;
        for (const newField of newFields) {
            if (!currentFields.find(f => f.name === newField.name)) {
                console.log(`➕ Adding ${newField.name} (${newField.type})`);
                currentFields.push(newField);
                addedCount++;
            } else {
                console.log(`⚠️ Field ${newField.name} already exists. Skipping.`);
            }
        }

        if (addedCount > 0) {
            console.log(`📤 Sending update with ${currentFields.length} total fields...`);

            // Tenta enviar como "fields" (v23+)
            try {
                await pb.collections.update('profiles', { fields: currentFields });
                console.log('✅ Updated using "fields" property!');
            } catch (err) {
                console.log('⚠️ Failed with "fields", trying "schema"...', err.message);
                await pb.collections.update('profiles', { schema: currentFields });
                console.log('✅ Updated using "schema" property!');
            }

        } else {
            console.log('✅ All fields already exist.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

forceAddFields();

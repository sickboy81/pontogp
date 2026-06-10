import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

const newFields = [
    { name: 'whatsapp', type: 'text' },
    { name: 'telegram', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'instagram', type: 'text' },
    { name: 'twitter', type: 'text' },
    { name: 'schedule', type: 'json' }
];

async function addContactScheduleFields() {
    try {
        console.log('🔌 Connecting...');
        await pb.collection('_superusers').authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('📥 Fetching collection...');
        const collection = await pb.collections.getOne('profiles');

        let currentFields = collection.fields || collection.schema || [];
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
            console.log(`📤 Sending update...`);
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

addContactScheduleFields();

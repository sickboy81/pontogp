import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

const fieldsToFix = [
    'hair_color',
    'height',
    'body_type',
    'breast_type',
    'pubis_type'
];

async function fixSchemaTypes() {
    try {
        // Auth as superuser
        console.log('🔐 Authenticating as admin...');
        await pb.collection('_superusers').authWithPassword('egeohub101@gmail.com', '041052.11setemB');
        console.log('✅ Authenticated successfully');

        // Get the profiles collection
        const collection = await pb.collections.getOne('profiles');
        let schema = collection.schema || collection.fields || [];

        // 1. Remove incorrectly typed fields
        console.log('🗑️ Removing incorrect fields...');
        const originalCount = schema.length;
        schema = schema.filter(f => !fieldsToFix.includes(f.name));

        if (schema.length === originalCount) {
            console.log('⚠️ No fields found to remove. Checking types...');
            // Check if they are already JSON
            for (const name of fieldsToFix) {
                const field = (collection.schema || []).find(f => f.name === name);
                if (field) console.log(`${name} is ${field.type}`);
            }
        } else {
            console.log(`Removed ${originalCount - schema.length} fields.`);
            await pb.collections.update('profiles', { schema: schema });
            console.log('✅ Incorrect fields removed.');

            // Fetch updated collection
            const updatedCollection = await pb.collections.getOne('profiles');
            schema = updatedCollection.schema || updatedCollection.fields || [];
        }

        // 2. Add them back as JSON
        console.log('➕ Re-adding fields as JSON...');
        for (const name of fieldsToFix) {
            console.log(`   Adding ${name} (json)`);
            schema.push({
                name: name,
                type: 'json',
                required: false,
                options: {}
            });
        }

        // Update collection
        console.log('📤 Updating collection schema...');
        await pb.collections.update('profiles', { schema: schema });

        console.log('✅ Schema fixed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message || error);
    }
}

fixSchemaTypes();

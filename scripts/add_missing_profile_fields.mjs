import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

// Fields to add to the profiles collection
const fieldsToAdd = [
    { name: 'verified', type: 'bool' },
    { name: 'certified', type: 'bool' },
    { name: 'special_services', type: 'json' },
    { name: 'massage_types', type: 'json' },
    { name: 'other_services', type: 'json' },
    { name: 'online_services', type: 'json' },
    { name: 'for_sale', type: 'json' },
    { name: 'virtual_fantasies', type: 'json' },
    { name: 'hair_color', type: 'text' },
    { name: 'height', type: 'number' },
    { name: 'body_type', type: 'text' },
    { name: 'breast_type', type: 'text' },
    { name: 'pubis_type', type: 'text' },
    { name: 'service_locations', type: 'json' },
    { name: 'service_to', type: 'json' },
    { name: 'prices', type: 'json' }
];

async function addFieldsToProfiles() {
    try {
        // Auth as superuser
        console.log('🔐 Authenticating as admin...');
        await pb.collection('_superusers').authWithPassword('egeohub101@gmail.com', '041052.11setemB');
        console.log('✅ Authenticated successfully');

        // Get the profiles collection
        const collection = await pb.collections.getOne('profiles');
        console.log('📋 Collection retrieved:', collection.name);
        console.log('   Collection keys:', Object.keys(collection));

        // Check for schema or fields property
        const existingSchema = collection.schema || collection.fields || [];
        console.log('   Existing schema type:', Array.isArray(existingSchema) ? 'array' : typeof existingSchema);
        console.log('   Existing fields count:', existingSchema.length);

        // Get existing field names
        const existingFields = new Set(existingSchema.map(f => f.name));
        console.log('   Existing field names:', [...existingFields]);

        // Add missing fields
        const newSchema = [...existingSchema];
        let addedCount = 0;

        for (const field of fieldsToAdd) {
            if (existingFields.has(field.name)) {
                console.log(`  ⏭️ ${field.name} already exists`);
                continue;
            }

            console.log(`  ➕ Adding ${field.name} (${field.type})`);
            newSchema.push({
                name: field.name,
                type: field.type,
                required: false,
                options: {}
            });
            addedCount++;
        }

        if (addedCount === 0) {
            console.log('\n✅ All fields already exist!');
            return;
        }

        // Update collection with new schema - try both schema and fields
        console.log(`\n📤 Updating collection with ${addedCount} new fields...`);
        try {
            await pb.collections.update('profiles', { schema: newSchema });
        } catch (e) {
            console.log('   Trying with fields instead of schema...');
            await pb.collections.update('profiles', { fields: newSchema });
        }

        console.log('\n✅ Done! Added', addedCount, 'fields');
    } catch (error) {
        console.error('❌ Error:', error.message || error);
        if (error.data) {
            console.error('Details:', JSON.stringify(error.data, null, 2));
        }
    }
}

addFieldsToProfiles();

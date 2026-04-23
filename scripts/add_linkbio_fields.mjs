
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase.cerejavip.com/';
const ADMIN_EMAIL = 'egeohub101@gmail.com';
const ADMIN_PASSWORD = '041052.11setemB';

const pb = new PocketBase(POCKETBASE_URL);

async function main() {
    try {
        console.log('🔐 Logging in...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

        console.log('📋 Fetching collection...');
        const collection = await pb.collections.getOne('profiles');
        const fields = collection.fields || collection.schema;

        console.log('➕ Adding "display_mode" field...');

        let shouldUpdate = false;

        // display_mode
        if (!fields.find(f => f.name === 'display_mode')) {
            fields.push({
                id: 'select_' + Date.now(),
                name: 'display_mode',
                type: 'select',
                system: false,
                required: false,
                presentable: false,
                unique: false,
                options: {
                    maxSelect: 1,
                    values: ['profile', 'links']
                }
            });
            shouldUpdate = true;
        }

        // short_description (for linktree header)
        if (!fields.find(f => f.name === 'short_description')) {
            fields.push({
                id: 'text_' + Date.now() + '_short',
                name: 'short_description',
                type: 'text',
                system: false,
                required: false,
                presentable: false,
                unique: false,
                options: {
                    min: null,
                    max: 200,
                    pattern: ""
                }
            });
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            // Fallback for fields property update
            if (collection.fields) collection.fields = fields;
            else collection.schema = fields;

            await pb.collections.update('profiles', collection);
            console.log('✅ Fields added.');
        } else {
            console.log('ℹ️ Fields already exist.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();

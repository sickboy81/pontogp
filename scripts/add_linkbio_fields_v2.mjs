
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

        // Ensure index is gone
        // collection.indexes = (collection.indexes || []).filter(i => !i.includes('idx_slug'));

        // Add display_mode field if missing
        const fields = collection.fields;
        if (!fields.find(f => f.name === 'display_mode')) {
            console.log('➕ Adding display_mode field...');
            fields.push({
                id: 'display_mode_' + Date.now(),
                name: 'display_mode',
                type: 'select',
                system: false,
                required: false,
                presentable: false,
                unique: false,
                options: {
                    maxSelect: 1,
                    values: ["default", "link_bio"]
                }
            });
            collection.fields = fields;
            await pb.collections.update('profiles', collection);
            console.log('✅ Field display_mode added.');
        } else {
            console.log('ℹ️ display_mode field exists.');
        }

        // Add short_description field if missing
        if (!fields.find(f => f.name === 'short_description')) {
            console.log('➕ Adding short_description field...');
            fields.push({
                id: 'short_description_' + Date.now(),
                name: 'short_description',
                type: 'text',
                system: false,
                required: false,
                presentable: false,
                unique: false,
                options: {
                    min: null,
                    max: 300,
                    pattern: ""
                }
            });
            collection.fields = fields;
            await pb.collections.update('profiles', collection);
            console.log('✅ Field short_description added.');

        } else {
            console.log('ℹ️ short_description field exists.');
        }


    } catch (error) {
        console.error('❌ Error:', error);
        // console.error(JSON.stringify(error, null, 2));
    }
}

main();

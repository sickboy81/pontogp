
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Checking site_visitors collection...');
        try {
            await pb.collections.getOne('site_visitors');
            console.log('Collection site_visitors already exists.');
        } catch (err) {
            console.log('Creating site_visitors collection...');
            await pb.collections.create({
                name: 'site_visitors',
                type: 'base',
                schema: [
                    {
                        name: 'visitor_id',
                        type: 'text',
                        required: true,
                        unique: true
                    },
                    {
                        name: 'last_visit',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'user_agent',
                        type: 'text',
                        required: false
                    }
                ],
                listRule: '', // Public list (or at least admin/auth) - keeping empty for admin only for now? No, need public create.
                viewRule: '',
                createRule: '', // Public create allowed
                updateRule: '', // Public update allowed (to update last_visit)
                deleteRule: null,
            });
            console.log('Collection created successfully.');
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();


import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Checking settings collection...');
        try {
            await pb.collections.getOne('settings');
            console.log('Collection settings already exists.');
        } catch (err) {
            console.log('Creating settings collection...');
            try {
                await pb.collections.create({
                    name: 'settings',
                    type: 'base',
                    schema: [
                        { name: 'key', type: 'text', required: true, unique: true },
                        { name: 'enabled', type: 'bool', required: false },
                        { name: 'message', type: 'text', required: false },
                        { name: 'scheduled_end', type: 'text', required: false }
                    ],
                    listRule: '', // Public read
                    viewRule: '',
                    createRule: null, // Admin only
                    updateRule: null, // Admin only
                    deleteRule: null,
                });
                console.log('Collection created successfully.');
            } catch (createErr) {
                console.error('Failed to create settings collection:', createErr.data || createErr.message);
            }
        }

        // Check if maintenance record exists
        try {
            const result = await pb.collection('settings').getFullList({ filter: 'key = "maintenance"' });
            if (result.length === 0) {
                console.log('Creating maintenance record...');
                await pb.collection('settings').create({
                    key: 'maintenance',
                    enabled: false,
                    message: 'Site em manutenção. Voltaremos em breve!'
                });
                console.log('Maintenance record created.');
            } else {
                console.log('Maintenance record exists:', result[0]);
            }
        } catch (recErr) {
            console.error('Error checking maintenance record:', recErr.message);
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();

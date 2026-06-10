import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        // First, get the users collection ID
        console.log('Getting users collection...');
        const usersCollection = await pb.collections.getOne('users');
        console.log('Users collection ID:', usersCollection.id);

        console.log('Creating verification_tokens collection...');

        const collection = await pb.collections.create({
            name: 'verification_tokens',
            type: 'base',
            fields: [
                {
                    name: 'token',
                    type: 'text',
                    required: true,
                    unique: true,
                    min: 32,
                    max: 64,
                    pattern: '^[a-zA-Z0-9]+$'
                },
                {
                    name: 'user_id',
                    type: 'relation',
                    required: true,
                    collectionId: usersCollection.id,
                    cascadeDelete: true,
                    maxSelect: 1
                },
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    maxSelect: 1,
                    values: ['verification', 'password_reset']
                },
                {
                    name: 'email',
                    type: 'email',
                    required: true
                },
                {
                    name: 'expires_at',
                    type: 'date',
                    required: true
                },
                {
                    name: 'used',
                    type: 'bool',
                    required: false
                }
            ],
            listRule: null,
            viewRule: null,
            createRule: null,
            updateRule: null,
            deleteRule: null
        });

        console.log('✅ verification_tokens collection created successfully!');
        console.log('Collection ID:', collection.id);

    } catch (err) {
        console.error('❌ Script failed:', err);
        if (err.data) {
            console.error('Error details:', JSON.stringify(err.data, null, 2));
        }
    }
}

main();

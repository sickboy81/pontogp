
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating as Admin...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Fetching users collection...');
        const collection = await pb.collections.getOne('users');

        // console.log('Collection keys:', Object.keys(collection));
        // console.log('Collection structure:', JSON.stringify(collection, null, 2));

        // Attempt to find fields - schema is usually the property
        const fields = collection.schema || collection.fields || [];
        // const docField = fields.find(f => f.name === 'document_verified');

        // if (docField) {
        //     console.log('Current document_verified field:', docField);
        // } else {
        //     console.log('⚠️ Field document_verified not found in schema!');
        // }

        // Also check if any recent user has it true
        const recentUsers = await pb.collection('users').getList(1, 10, {
            sort: '-created',
            filter: 'document_verified = true'
        });

        console.log(`Found ${recentUsers.totalItems} users with document_verified=true.`);

        // Check last 5 users to see who is actually there
        const lastUsers = await pb.collection('users').getList(1, 5, {
            sort: '-created'
        });

        console.log('--- Last 5 Users ---');
        lastUsers.items.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | DocVerified: ${u.document_verified} (${typeof u.document_verified})`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();

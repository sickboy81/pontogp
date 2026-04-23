
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase.cerejavip.com';
const pb = new PocketBase(POCKETBASE_URL);

async function checkSchema() {
    console.log('Fetching users collection schema...');
    try {
        // We need admin authentication to view collection schema details usually, 
        // but let's try to fetch a record and see its structure or use getCollection if possible (requires admin).
        // Since I don't have admin creds hardcoded here safely, I'll try to fetch the user I just created "u42vyx3ockggv37" (from sitemap debug) 
        // or just list one user to see the fields.
        // Actually, I can use the same pattern as debug_sitemap.js to just fetch a record.

        // Better: let's try to fetch the specific user the user presumably just created if they can provide ID, 
        // but since I don't have it, I'll fetch the latest created user.

        const records = await pb.collection('users').getList(1, 1, {
            sort: '-created'
        });

        if (records.items.length > 0) {
            const user = records.items[0];
            console.log('Latest User:', {
                id: user.id,
                email: user.email,
                created: user.created,
                verified: user.verified, // System email verification
                document_verified: user.document_verified, // Custom field
                status: user.status
            });
        } else {
            console.log('No users found.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

checkSchema();

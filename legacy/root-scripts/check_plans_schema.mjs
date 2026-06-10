
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Fetching plans collection schema...');
        try {
            const collection = await pb.collections.getOne('plans');
            console.log('Full Collection Object:', JSON.stringify(collection, null, 2));
        } catch (err) {
            console.error('Plans collection not found or error accessing:', err.message);
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();

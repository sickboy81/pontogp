
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase.cerejavip.com';
const pb = new PocketBase(POCKETBASE_URL);

async function testFetch() {
    console.log('Testing connection to:', POCKETBASE_URL);

    try {
        // Try simplest query
        console.log('Fetching profiles with no params...');
        const result = await pb.collection('profiles').getList(1, 1);
        console.log('Success!', result);
    } catch (err) {
        console.error('Error fetching list:', err.message);
        console.error('Data:', err.data);
    }
}

testFetch();

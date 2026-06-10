
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function testSort() {
    try {
        console.log('Testing sort=-created...');
        await pb.collection('profiles').getList(1, 1, { sort: '-created' });
        console.log('✅ Success: sort=-created');
    } catch (err) {
        console.log('❌ Failed: sort=-created', err.status);
    }

    try {
        console.log('Testing sort=-updated...');
        await pb.collection('profiles').getList(1, 1, { sort: '-updated' });
        console.log('✅ Success: sort=-updated');
    } catch (err) {
        console.log('❌ Failed: sort=-updated', err.status);
    }

    try {
        console.log('Testing sort=-id...');
        await pb.collection('profiles').getList(1, 1, { sort: '-id' });
        console.log('✅ Success: sort=-id');
    } catch (err) {
        console.log('❌ Failed: sort=-id', err.status);
    }
}

testSort();

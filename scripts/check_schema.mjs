import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function checkSchema() {
    try {
        await pb.admins.authWithPassword('egeohub101@gmail.com', 'Newt@2025');
        const collections = await pb.collections.getFullList();
        const vr = collections.find(c => c.name === 'verification_requests');
        if (vr) {
            console.log('Collection:', vr.name);
            console.log('Fields:', vr.schema?.map(f => f.name + ' (' + f.type + ')').join(', '));
            console.log('listRule:', vr.listRule);
            console.log('viewRule:', vr.viewRule);
        } else {
            console.log('Collection not found');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();

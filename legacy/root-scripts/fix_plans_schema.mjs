
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Fetching plans collection...');
        const collectionModel = await pb.collections.getOne('plans');
        // Convert to plain object to modify schema
        const collection = JSON.parse(JSON.stringify(collectionModel));

        console.log('Updating slug field...');
        // Find slug field. Note: In newer PB, fields are in 'fields'
        const fields = collection.fields || collection.schema;

        const slugField = fields.find(f => f.name === 'slug');
        if (slugField) {
            console.log('Found slug field, updating...');
            slugField.required = false;
            slugField.pattern = '';
            slugField.min = null;
            slugField.max = null;
        } else {
            console.log('Slug field not found, adding it...');
            fields.push({
                name: 'slug',
                type: 'text',
                required: false,
                pattern: ''
            });
        }

        // Update collection
        await pb.collections.update('plans', collection);
        console.log('Plans collection updated.');

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();

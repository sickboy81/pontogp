import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Fetching plans collection...');
        const collectionModel = await pb.collections.getOne('plans');
        const collection = JSON.parse(JSON.stringify(collectionModel));

        console.log('Updating price field to not be required...');
        const priceField = collection.fields.find(f => f.name === 'price');
        if (priceField) {
            console.log('Found price field, setting required to false');
            priceField.required = false;
        } else {
            console.log('Price field not found!');
        }

        // Update collection
        await pb.collections.update('plans', collection);
        console.log('Plans collection updated - price is now optional.');

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();

// Script to change slug field from select to text in the plans collection
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Fetching plans collection...');
        const collection = await pb.collections.getOne('plans');
        const updatedFields = collection.fields.map(field => {
            if (field.name === 'slug') {
                console.log('Updating slug field to text type');
                // Return a new field definition as text
                const { id, name, type, required, system, hidden, presentable, ...rest } = field;
                return {
                    name,
                    type: 'text',
                    required: false,
                    system: false,
                    hidden: false,
                    presentable: false,
                    ...rest,
                };
            }
            return field;
        });

        // Update the collection with modified fields
        await pb.collections.update('plans', { fields: updatedFields });
        console.log('Slug field updated successfully');
    } catch (err) {
        console.error('Error updating slug field:', err);
    }
}

main();

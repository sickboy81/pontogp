import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function checkProfileFields() {
    try {
        // Get a sample profile (no auth needed for public read)
        const profiles = await pb.collection('profiles').getList(1, 1);

        if (profiles.items.length > 0) {
            const profile = profiles.items[0];
            console.log('All fields in profile record:');
            console.log(Object.keys(profile).sort());

            console.log('\n\nChecking expected fields:');
            const expectedFields = [
                'verified', 'special_services', 'massage_types', 'other_services',
                'online_services', 'for_sale', 'virtual_fantasies', 'hair_color',
                'height', 'body_type', 'breast_type', 'pubis_type',
                'service_locations', 'service_to', 'certified', 'prices'
            ];

            for (const field of expectedFields) {
                const exists = field in profile;
                const value = profile[field];
                console.log(`  ${exists ? '✅' : '❌'} ${field}: ${JSON.stringify(value)}`);
            }
        } else {
            console.log('No profiles found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkProfileFields();

import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function testGetProfile() {
    try {
        console.log('Listing all profiles first...');
        const profiles = await pb.collection('profiles').getList(1, 10);
        console.log(`Found ${profiles.items.length} profiles:`);

        for (const p of profiles.items) {
            console.log(`  - ID: ${p.id}, Name: ${p.name}`);
        }

        if (profiles.items.length > 0) {
            const testId = profiles.items[0].id;
            console.log(`\nTrying to fetch profile by ID: ${testId}`);

            const profile = await pb.collection('profiles').getOne(testId, {
                expand: 'user,photos,videos,audio'
            });

            console.log('Profile fetched successfully!');
            console.log('ID:', profile.id);
            console.log('Name:', profile.name);
            console.log('Photos:', profile.photos);
            console.log('Expand photos:', profile.expand?.photos);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testGetProfile();


import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        const planData = {
            name: 'Basic Plan',
            slug: 'basic',
            price: 99.99,
            features: ['Feature 1', 'Feature 2'],
            max_photos: 5,
            max_videos: 1,
            featured: false,
            verified_badge: false,
            analytics: true
        };

        console.log('Creating plan with data:', planData);
        try {
            const result = await pb.collection('plans').create(planData);
            console.log('Plan created successfully:', result.id);
            // Clean up
            await pb.collection('plans').delete(result.id);
            console.log('Plan deleted.');
        } catch (err) {
            console.error('Failed to create plan:', err.status, err.message);
            if (err.data) {
                console.error('Validation errors:', JSON.stringify(err.data, null, 2));
            }
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();

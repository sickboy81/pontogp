import PocketBase from 'pocketbase';
import fs from 'fs';

function loadEnv() {
    const envFile = fs.readFileSync('.env', 'utf8');
    const lines = envFile.split('\n');
    const env = {};
    for (const line of lines) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    }
    return env;
}

const env = loadEnv();
const pb = new PocketBase(env.VITE_POCKETBASE_URL);

async function createAnalyticsCollections() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(
            env.DIRECTUS_ADMIN_EMAIL,
            env.DIRECTUS_ADMIN_PASSWORD
        );

        const collections = await pb.collections.getFullList();
        const names = collections.map(c => c.name);

        const profileCollection = collections.find(c => c.name === 'profiles');
        if (!profileCollection) throw new Error('Profiles collection not found');
        const profileCollectionId = profileCollection.id;

        // 1. profile_views Collection
        if (!names.includes('profile_views')) {
            console.log('Creating profile_views collection...');
            await pb.collections.create({
                name: 'profile_views',
                type: 'base',
                fields: [
                    { name: 'profile', type: 'relation', required: true, cascadeDelete: true, maxSelect: 1, collectionId: profileCollectionId },
                    { name: 'user_agent', type: 'text' },
                    { name: 'viewer_ip', type: 'text' }
                ],
                listRule: "profile.user = @request.auth.id",
                viewRule: "profile.user = @request.auth.id",
                createRule: "", // Public
                updateRule: null,
                deleteRule: null,
            });
            console.log('profile_views collection created!');
        } else {
            console.log('profile_views collection already exists.');
        }

        // 2. profile_clicks Collection
        if (!names.includes('profile_clicks')) {
            console.log('Creating profile_clicks collection...');
            await pb.collections.create({
                name: 'profile_clicks',
                type: 'base',
                fields: [
                    { name: 'profile', type: 'relation', required: true, cascadeDelete: true, maxSelect: 1, collectionId: profileCollectionId },
                    { name: 'contact_type', type: 'text' }
                ],
                listRule: "profile.user = @request.auth.id",
                viewRule: "profile.user = @request.auth.id",
                createRule: "", // Public
                updateRule: null,
                deleteRule: null,
            });
            console.log('profile_clicks collection created!');
        } else {
            console.log('profile_clicks collection already exists.');
        }

        console.log('Analytics collections setup complete!');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', JSON.stringify(error.response, null, 2));
    }
}

createAnalyticsCollections();

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

async function testQuery() {
    try {
        await pb.admins.authWithPassword(env.DIRECTUS_ADMIN_EMAIL, env.DIRECTUS_ADMIN_PASSWORD);

        const profileId = "7zthcu6hfyvcekg";

        console.log(`Testing query WITHOUT sort...`);
        const result = await pb.collection('profile_views').getList(1, 10, {
            filter: `profile = "${profileId}"`
        });
        console.log('Success (no sort)!', result.totalItems);

        console.log(`Testing query WITHOUT filter...`);
        const result2 = await pb.collection('profile_views').getList(1, 10);
        console.log('Success (no filter)!', result2.totalItems);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', JSON.stringify(error.response, null, 2));
    }
}

testQuery();

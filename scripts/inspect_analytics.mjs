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

async function inspectAnalytics() {
    try {
        await pb.admins.authWithPassword(env.DIRECTUS_ADMIN_EMAIL, env.DIRECTUS_ADMIN_PASSWORD);

        try {
            const pv = await pb.collections.getOne('profile_views');
            console.log('--- profile_views ---');
            console.log(JSON.stringify(pv, null, 2));
        } catch (e) { console.log('profile_views NOT FOUND'); }

        try {
            const pc = await pb.collections.getOne('profile_clicks');
            console.log('--- profile_clicks ---');
            console.log(JSON.stringify(pc, null, 2));
        } catch (e) { console.log('profile_clicks NOT FOUND'); }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

inspectAnalytics();

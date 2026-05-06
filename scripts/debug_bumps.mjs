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

async function debugBumps() {
    try {
        await pb.admins.authWithPassword(env.DIRECTUS_ADMIN_EMAIL, env.DIRECTUS_ADMIN_PASSWORD);

        console.log('Fetching all bumps for today...');
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(new Date());
        const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        const today = `${byType.year}-${byType.month}-${byType.day}`;

        const records = await pb.collection('profile_daily_bumps').getFullList({
            filter: `date = "${today}"`
        });

        console.log(`Found ${records.length} bump records for today (${today}).`);

        if (records.length > 0) {
            console.log('Sample record:', JSON.stringify(records[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugBumps();

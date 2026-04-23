
import { createDirectus, rest, authentication, readRoles, readPermissions, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/);
        if (match && !match[1].startsWith('#')) {
            env[match[1]] = match[2];
        }
    });
}

const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://base.pontogp.com';
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL;
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD;

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

async function main() {
    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Logged in.');

        console.log('--- ROLES ---');
        const roles = await directus.request(readRoles());
        console.log(JSON.stringify(roles, null, 2));

        console.log('--- PERMISSIONS (Sample) ---');
        // const permissions = await directus.request(readPermissions({ limit: 5 }));
        // console.log(JSON.stringify(permissions, null, 2));

        console.log('--- SETTINGS ---');
        const settings = await directus.request(readItems('directus_settings', { limit: 1 }));
        console.log(JSON.stringify(settings, null, 2));

    } catch (e) {
        console.error(e);
    }
}

main();

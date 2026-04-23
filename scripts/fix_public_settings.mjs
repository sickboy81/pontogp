
import { createDirectus, rest, authentication } from '@directus/sdk';
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

async function rawRequest(path, method = 'GET', body = null) {
    const token = await directus.getToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const url = `${DIRECTUS_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
}

async function fixSettings() {
    console.log('🔧 Fixing Public Role Setting...');

    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Auth successful.');

        // 1. Find the "Public" Role
        console.log('   Searching for role named "Public"...');
        const rolesRes = await rawRequest('/roles');
        const publicRole = rolesRes.data.find(r => r.name === 'Public');

        if (!publicRole) {
            console.error('❌ Could not find a role named "Public". Please create it first.');
            return;
        }
        console.log(`   Found "Public" Role ID: ${publicRole.id}`);

        // 2. Update Settings
        console.log('   Updating Project Settings...');
        const currentSettings = await rawRequest('/settings');

        await rawRequest('/settings', 'PATCH', {
            public_role: publicRole.id
        });

        console.log('✅ SUCCESS: Project "Public Role" setting updated.');
        console.log('   Your public permissions should now work!');

    } catch (e) {
        console.error('Fix failed:', e);
    }
}

fixSettings();

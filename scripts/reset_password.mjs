
import { createDirectus, rest, authentication, updateUser } from '@directus/sdk';
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
// Configuration
const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://base.pontogp.com';
const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL;
const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD;

// Informe apenas por variáveis locais, nunca versionadas.
const TARGET_EMAIL = process.env.TARGET_EMAIL || env.TARGET_EMAIL;
const NEW_PASSWORD = process.env.NEW_PASSWORD || env.NEW_PASSWORD;

if (!TARGET_EMAIL || !NEW_PASSWORD) {
    console.error('Defina TARGET_EMAIL e NEW_PASSWORD em variável de ambiente local para executar este script.');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

// Custom helper because readUsers with filter is tricky via SDK sometimes
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

async function main() {
    console.log(`🔐 Resetting password for ${TARGET_EMAIL}...`);

    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin login successful.');

        // 1. Find User ID
        console.log('   Searching for user...');
        const usersRes = await rawRequest(`/users?filter[email][_eq]=${TARGET_EMAIL}`);
        const user = usersRes.data[0];

        if (!user) {
            console.error(`❌ User with email ${TARGET_EMAIL} not found!`);
            return;
        }
        console.log(`   Found User ID: ${user.id}`);

        // 2. Update Password
        console.log(`   Setting password to "${NEW_PASSWORD}"...`);
        await directus.request(updateUser(user.id, {
            password: NEW_PASSWORD,
            status: 'active' // Ensure active
        }));

        console.log('✅ Password updated successfully!');
        console.log('👉 Try logging in now.');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

main();

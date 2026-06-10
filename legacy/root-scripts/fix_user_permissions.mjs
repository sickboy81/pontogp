
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
// Configuration
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

async function main() {
    console.log(`🔧 Fixing 'User' Role Permissions...`);

    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin login successful.');

        // 1. Find the "User" Role
        console.log('   Searching for role named "User"...');
        const rolesRes = await rawRequest('/roles');
        const userRole = rolesRes.data.find(r => r.name === 'User');

        if (!userRole) {
            console.error('❌ Could not find a role named "User". Please create it first.');
            return;
        }
        console.log(`   Found "User" Role ID: ${userRole.id}`);

        // 2. Find or Create a Policy for Users
        console.log('   Checking/Creating Policy for Users...');
        // We look for a policy named "User App Access" or create it
        const policiesRes = await rawRequest('/policies');
        let userPolicy = policiesRes.data.find(p => p.name === 'User App Access');

        if (!userPolicy) {
            console.log('   Creating "User App Access" Policy...');
            const newPolicyRes = await rawRequest('/policies', 'POST', {
                name: 'User App Access',
                icon: 'person',
                description: 'Standard permissions for logged-in app users'
            });
            userPolicy = newPolicyRes.data;
        }
        console.log(`   Policy ID: ${userPolicy.id}`);

        // 3. Define the Permissions we need
        const permissionsNeeded = [
            { collection: 'profiles', action: 'read', fields: ['*'], permissions: {} }, // Read all profiles
            { collection: 'profiles', action: 'create', fields: ['*'], permissions: { user_id: { _eq: '$CURRENT_USER' } } }, // Create own profile
            { collection: 'profiles', action: 'update', fields: ['*'], permissions: { user_id: { _eq: '$CURRENT_USER' } } }, // Update own profile
            { collection: 'directus_users', action: 'read', fields: ['id', 'first_name', 'last_name', 'email', 'avatar'], permissions: {} },
            { collection: 'directus_users', action: 'update', fields: ['first_name', 'last_name', 'avatar'], permissions: { id: { _eq: '$CURRENT_USER' } } },
            { collection: 'directus_files', action: 'read', fields: ['*'], permissions: {} },
            { collection: 'directus_files', action: 'create', fields: ['*'], permissions: {} }
        ];

        // 4. Apply Permissions to Policy
        // We'll just try to create them; if they conflict, we might need to delete old ones first or ignore error.
        // To be safe, let's delete existing permissions for this policy for these collections first? 
        // No, that's risky. Let's just append. If error, likely exists.

        for (const p of permissionsNeeded) {
            try {
                process.stdout.write(`   Granting ${p.action} on ${p.collection}... `);
                await rawRequest('/permissions', 'POST', {
                    policy: userPolicy.id,
                    collection: p.collection,
                    action: p.action,
                    fields: p.fields,
                    permissions: p.permissions
                });
                console.log('✅');
            } catch (e) {
                if (e.message.includes('Uniqueness')) {
                    console.log('Start (Already exists)');
                } else {
                    console.log('❌ Error:', e.message);
                }
            }
        }

        // 5. Attach Policy to Role
        // Check if role already has this policy
        const currentPolicies = userRole.policies || [];
        // Note: In some versions, policies are in directus_access (junction).
        // Let's rely on directus_access.

        // Check existence in directus_access
        const accessCheck = await rawRequest(`/items/directus_access?filter[role][_eq]=${userRole.id}&filter[policy][_eq]=${userPolicy.id}`);
        if (accessCheck.data.length === 0) {
            console.log('   Attaching Policy to Role...');
            await rawRequest('/items/directus_access', 'POST', {
                role: userRole.id,
                policy: userPolicy.id
            });
            console.log('✅ Policy attached.');
        } else {
            console.log('   Policy is already attached to Role.');
        }

        console.log('✨ User Permissions Fixed!');

    } catch (e) {
        console.error('Fix failed:', e);
    }
}

main();

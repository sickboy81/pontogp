
import { createDirectus, rest, authentication, readCollections, createCollection, readFields, createField } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

let env = {};
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from ${envPath}`);
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

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Error: DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

const SCHEMA = {
    profiles: {
        icon: 'person',
        fields: [
            { field: 'user_id', type: 'string', meta: { interface: 'input', special: ['user-created'] } },
            { field: 'name', type: 'string', meta: { interface: 'input', required: true } },
            { field: 'age', type: 'integer', meta: { interface: 'input-number' } },
            { field: 'city', type: 'string', meta: { interface: 'input' } },
            { field: 'state', type: 'string', meta: { interface: 'input' } },
            { field: 'bio', type: 'text', meta: { interface: 'input-multiline' } },
            { field: 'category', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Acompanhante', value: 'acompanhante' }, { text: 'Massagista', value: 'massagista' }, { text: 'Online', value: 'online' }] } } },
            { field: 'gender', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Mulher', value: 'mulher' }, { text: 'Homem', value: 'homem' }, { text: 'Trans', value: 'trans' }, { text: 'Casal', value: 'casal' }] } } },
            { field: 'ethnicity', type: 'string', meta: { interface: 'input' } },
            { field: 'services', type: 'json', meta: { interface: 'tags' } },
            { field: 'photos', type: 'json', meta: { interface: 'files' } },
            { field: 'videos', type: 'json', meta: { interface: 'files' } },
            { field: 'price_30min', type: 'integer', meta: { interface: 'input-number' } },
            { field: 'price_1h', type: 'integer', meta: { interface: 'input-number' } },
            { field: 'price_2h', type: 'integer', meta: { interface: 'input-number' } },
            { field: 'price_overnight', type: 'integer', meta: { interface: 'input-number' } },
            { field: 'payment_methods', type: 'json', meta: { interface: 'tags' } },
            { field: 'neighborhoods', type: 'json', meta: { interface: 'tags' } },
            { field: 'location_lat', type: 'float', meta: { interface: 'input' } },
            { field: 'location_lng', type: 'float', meta: { interface: 'input' } },
            { field: 'whatsapp', type: 'string', meta: { interface: 'input' } },
            { field: 'telegram', type: 'string', meta: { interface: 'input' } },
            { field: 'phone', type: 'string', meta: { interface: 'input' } },
            { field: 'instagram', type: 'string', meta: { interface: 'input' } },
            { field: 'twitter', type: 'string', meta: { interface: 'input' } },
            { field: 'plan', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Free', value: 'free' }, { text: 'Premium', value: 'premium' }, { text: 'VIP', value: 'vip' }] } }, schema: { default_value: 'free' } },
            { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Active', value: 'active' }, { text: 'Inactive', value: 'inactive' }] } }, schema: { default_value: 'active' } }
        ]
    },
    profile_views: {
        icon: 'visibility',
        fields: [
            { field: 'profile_id', type: 'string' },
            { field: 'ip_address', type: 'string' },
            { field: 'user_agent', type: 'string' }
        ]
    }
};

// Update rawRequest to use dynamic token from Directus client
async function rawRequest(path, method = 'GET', body = null) {
    const token = await directus.getToken(); // Get token from login session
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Handle query params if needed, but path usually has them

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

    if (res.status === 204) return null;
    return res.json();
}

async function main() {
    console.log('🚀 Starting Database Setup & Repair...');

    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Logged in as Admin');

        // 1. Ensure Collections & Fields
        for (const [collectionName, config] of Object.entries(SCHEMA)) {
            await ensureCollection(collectionName, config);
        }

        // 2. Setup Permissions (Public Role)
        await setupPermissions();

        console.log('\n✨ Database Setup Completed Successfully!');
        console.log('IMPORTANT: Restart your frontend to ensure clear caches.');
    } catch (error) {
        console.error('❌ Critical Error Details:');
        console.error(error);
    }
}

async function ensureCollection(collection, config) {
    try {
        console.log(`\nChecking collection: ${collection}...`);
        const collections = await directus.request(readCollections());

        if (!collections.find(c => c.collection === collection)) {
            console.log(`Creating collection ${collection}...`);
            await directus.request(createCollection({
                collection: collection,
                schema: {},
                meta: { icon: config.icon || 'box' }
            }));
        } else {
            console.log(`Collection ${collection} exists.`);
        }

        const existingFields = await directus.request(readFields(collection));

        for (const field of config.fields) {
            const exists = existingFields.find(f => f.field === field.field);
            if (!exists) {
                console.log(`   + Creating field: ${field.field}`);
                try {
                    await directus.request(createField(collection, {
                        field: field.field,
                        type: field.type,
                        meta: field.meta,
                        schema: field.schema
                    }));
                } catch (e) {
                    console.error(`   ! Failed (non-critical): ${e.message}`);
                }
            }
        }
    } catch (e) {
        console.error(`Error processing collection ${collection}:`, e);
    }
}

async function setupPermissions() {
    console.log('\n🔐 Configuring Public Permissions...');

    // 1. Identify configured Public Role from Settings
    console.log('   Fetching Project Settings...');
    let publicRoleId = null;
    try {
        const settingsRes = await rawRequest('/settings');
        // Structure differs by version. Usually data.public_role
        // or data object directly.
        // Directus V9/10/11 responses are wrapped in { data: ... }
        const settings = settingsRes.data;
        if (settings && settings.public_role) {
            publicRoleId = settings.public_role;
            console.log(`   Found Configured Public Role ID: ${publicRoleId}`);
        } else {
            console.log('   No Public Role configured in Settings.');
        }
    } catch (e) {
        console.error('   ❌ Failed to fetch settings:', e.message);
        return;
    }

    // 2. If no Public Role configured, find or create "Public" role
    if (!publicRoleId) {
        // Check if a role named "Public" exists
        console.log('   Searching for existing "Public" role...');
        try {
            const rolesRes = await rawRequest('/roles');
            const publicRoleObj = rolesRes.data.find(r => r.name === 'Public');

            if (publicRoleObj) {
                publicRoleId = publicRoleObj.id;
                console.log(`   Found existing "Public" role (ID: ${publicRoleId}). Configuring it as System Public Role...`);
            } else {
                console.log('   Creating new "Public" role...');
                const newRoleRes = await rawRequest('/roles', 'POST', {
                    name: 'Public',
                    icon: 'public',
                    description: 'Default public access role'
                });
                publicRoleId = newRoleRes.data.id;
                console.log(`   Created new Public Role: ${publicRoleId}`);
            }

            // Update Settings to point to this role
            console.log('   Updating Project Settings to use this Public Role...');
            await rawRequest('/settings', 'PATCH', {
                public_role: publicRoleId
            });

        } catch (e) {
            console.error('   ❌ Error managing Public Role:', e.message);
            return;
        }
    }

    // 3. Resolve Policy & Attach
    // Directus 10.10+ uses Policies
    let publicPolicyId = null;
    let currentPolicies = [];

    try {
        const roleRes = await rawRequest(`/roles/${publicRoleId}`);
        currentPolicies = roleRes.data.policies || [];

        if (currentPolicies.length > 0) {
            try {
                await rawRequest(`/policies/${currentPolicies[0]}`);
                publicPolicyId = currentPolicies[0];
                console.log(`   Using existing policy: ${publicPolicyId}`);
            } catch (pErr) {
                console.log(`   Policy ${currentPolicies[0]} check failed.`);
            }
        }
    } catch (e) {
        console.error('   Error fetching role details:', e.message);
    }

    if (!publicPolicyId) {
        console.log('   Creating new "Public Access Policy"...');
        try {
            const policyRes = await rawRequest('/policies', 'POST', {
                name: 'Public Access Policy',
                icon: 'public',
                description: 'Generated by Auto-Setup'
            });
            publicPolicyId = policyRes.data.id;

            console.log(`   Attaching new policy ${publicPolicyId} to Public Role...`);
            try {
                // Try role patch
                const newPolicies = [...currentPolicies, publicPolicyId];
                await rawRequest(`/roles/${publicRoleId}`, 'PATCH', {
                    policies: newPolicies
                });
                console.log('   ✅ Policy attached successfully.');
            } catch (attachErr) {
                console.error('   ⚠️ WARNING: Failed to attach Policy to Public Role automatically (403).');
                console.error('   👉 ACTION REQUIRED: You must manually add "Public Access Policy" to the "Public" role in Directus Admin.');
                // Do NOT return; proceed to create permissions on the Policy
            }
        } catch (e) {
            console.error('   ❌ Failed to create policy via Raw API:', e.message);
            return;
        }
    }

    // 4. Set Permissions on this Policy
    console.log(`\n   Configuring permissions on Policy ${publicPolicyId}...`);
    let existingPermissions = [];
    try {
        const permRes = await rawRequest(`/permissions?filter[policy][_eq]=${publicPolicyId}`);
        existingPermissions = permRes.data || [];
    } catch (e) {
        console.log('   Could not list existing permissions, assuming empty.');
    }

    const requiredPermissions = [
        { collection: 'profiles', action: 'read', fields: ['*'] },
        { collection: 'directus_files', action: 'read', fields: ['*'] },
        { collection: 'directus_users', action: 'create', fields: ['*'] },
        { collection: 'profile_views', action: 'create', fields: ['*'] },
        { collection: 'directus_users', action: 'read', fields: ['id', 'first_name', 'avatar'] }
    ];

    for (const req of requiredPermissions) {
        const existing = existingPermissions.find(p =>
            p.collection === req.collection &&
            p.action === req.action
        );

        if (existing) {
            console.log(`   * Updating permission for ${req.collection} (${req.action})...`);
            try {
                await rawRequest(`/permissions/${existing.id}`, 'PATCH', {
                    fields: req.fields
                });
            } catch (e) { console.error(`     Failed update: ${e.message}`); }
        } else {
            console.log(`   + Creating NEW permission for ${req.collection} (${req.action})...`);
            try {
                await rawRequest('/permissions', 'POST', {
                    policy: publicPolicyId,
                    collection: req.collection,
                    action: req.action,
                    fields: req.fields
                });
            } catch (e) {
                console.error(`   ! Failed to create permission: ${e.message}`);
            }
        }
    }
}

main();

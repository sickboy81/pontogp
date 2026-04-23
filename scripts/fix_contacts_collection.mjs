
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

console.log('📧 Using admin email:', ADMIN_EMAIL);
console.log('🌐 Directus URL:', DIRECTUS_URL);

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

    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch {
        json = { raw: text };
    }

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return json;
}

async function checkCollectionExists(collectionName) {
    try {
        await rawRequest(`/collections/${collectionName}`);
        return true;
    } catch (e) {
        if (e.message.includes('403') || e.message.includes('404')) {
            return false;
        }
        throw e;
    }
}

async function createContactsCollection() {
    console.log('📝 Creating contacts collection...');

    try {
        await rawRequest('/collections', 'POST', {
            collection: 'contacts',
            schema: {},
            meta: {
                collection: 'contacts',
                icon: 'mail',
                note: 'Contact form submissions',
                display_template: '{{name}} - {{subject}}',
                archive_field: null,
                archive_value: null,
                unarchive_value: null,
                sort_field: null,
                singleton: false,
                translations: null
            }
        });
        console.log('✅ Collection created!');
        return true;
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('ℹ️ Collection already exists.');
            return true;
        }
        throw e;
    }
}

async function createContactsFields() {
    console.log('📝 Creating fields for contacts collection...');

    const fields = [
        {
            field: 'name',
            type: 'string',
            meta: {
                interface: 'input',
                display: 'raw',
                required: true,
                width: 'half'
            },
            schema: {
                max_length: 255,
                is_nullable: false
            }
        },
        {
            field: 'email',
            type: 'string',
            meta: {
                interface: 'input',
                display: 'raw',
                required: true,
                width: 'half'
            },
            schema: {
                max_length: 255,
                is_nullable: false
            }
        },
        {
            field: 'subject',
            type: 'string',
            meta: {
                interface: 'input',
                display: 'raw',
                required: true,
                width: 'full'
            },
            schema: {
                max_length: 255,
                is_nullable: false
            }
        },
        {
            field: 'message',
            type: 'text',
            meta: {
                interface: 'input-multiline',
                display: 'raw',
                required: true,
                width: 'full'
            },
            schema: {
                is_nullable: false
            }
        },
        {
            field: 'read',
            type: 'boolean',
            meta: {
                interface: 'boolean',
                display: 'boolean',
                width: 'half',
                special: ['cast-boolean']
            },
            schema: {
                default_value: false,
                is_nullable: false
            }
        },
        {
            field: 'date_created',
            type: 'timestamp',
            meta: {
                interface: 'datetime',
                display: 'datetime',
                readonly: true,
                special: ['date-created'],
                width: 'half'
            },
            schema: {
                is_nullable: true
            }
        }
    ];

    for (const field of fields) {
        try {
            process.stdout.write(`   Creating field '${field.field}'... `);
            await rawRequest(`/fields/contacts`, 'POST', field);
            console.log('✅');
        } catch (e) {
            if (e.message.includes('already exists') || e.message.includes('Field')) {
                console.log('⏭️ (exists)');
            } else {
                console.log('❌', e.message);
            }
        }
    }
}

async function setupPublicPermissions() {
    console.log('🔓 Setting up Public permissions for contacts...');

    // First, get the public role
    // In Directus, public role has a special null ID or we need to find it
    // Let's try to find the public policy
    const policiesRes = await rawRequest('/policies');
    let publicPolicy = policiesRes.data.find(p => p.name === 'Public' || p.name === '$t:public_label' || p.admin_access === false);

    // If no public policy, check for public role
    const rolesRes = await rawRequest('/roles');
    let publicRole = rolesRes.data.find(r => r.name === 'Public' || r.name === '$t:public_label');

    // If public role doesn't exist, the public permissions might work differently
    // Let's try to create a permission for the null role (public)

    const publicPermissions = [
        { collection: 'contacts', action: 'create', fields: ['name', 'email', 'subject', 'message'], permissions: {} }
    ];

    console.log('   Setting up permissions for public/anonymous users...');

    // Try with null policy first (Directus native public access)
    for (const p of publicPermissions) {
        try {
            process.stdout.write(`   Granting ${p.action} on ${p.collection} (public)... `);
            await rawRequest('/permissions', 'POST', {
                role: null,  // null = public
                policy: null,
                collection: p.collection,
                action: p.action,
                fields: p.fields,
                permissions: p.permissions
            });
            console.log('✅');
        } catch (e) {
            if (e.message.includes('Unique') || e.message.includes('already')) {
                console.log('⏭️ (exists)');
            } else {
                console.log('❌', e.message);
                // Try alternative approach with policy if it exists
                if (publicPolicy) {
                    try {
                        await rawRequest('/permissions', 'POST', {
                            policy: publicPolicy.id,
                            collection: p.collection,
                            action: p.action,
                            fields: p.fields,
                            permissions: p.permissions
                        });
                        console.log('   ✅ (via policy)');
                    } catch (e2) {
                        console.log('   ❌ Policy approach also failed:', e2.message);
                    }
                }
            }
        }
    }
}

async function setupAdminTokenPermissions() {
    console.log('🔑 Setting up Admin token permissions for contacts...');

    // Find or create an admin policy for the static token
    const policiesRes = await rawRequest('/policies');
    let adminPolicy = policiesRes.data.find(p => p.name === 'Admin API Access' || p.admin_access === true);

    if (!adminPolicy) {
        // Find any policy with admin access
        adminPolicy = policiesRes.data.find(p => p.admin_access === true);
    }

    const adminPermissions = [
        { collection: 'contacts', action: 'create', fields: ['*'], permissions: {} },
        { collection: 'contacts', action: 'read', fields: ['*'], permissions: {} },
        { collection: 'contacts', action: 'update', fields: ['*'], permissions: {} },
        { collection: 'contacts', action: 'delete', fields: ['*'], permissions: {} }
    ];

    // If we have an admin policy, add permissions to it
    if (adminPolicy) {
        console.log(`   Using admin policy: ${adminPolicy.name} (${adminPolicy.id})`);

        for (const p of adminPermissions) {
            try {
                process.stdout.write(`   Granting ${p.action} on ${p.collection}... `);
                await rawRequest('/permissions', 'POST', {
                    policy: adminPolicy.id,
                    collection: p.collection,
                    action: p.action,
                    fields: p.fields,
                    permissions: p.permissions
                });
                console.log('✅');
            } catch (e) {
                if (e.message.includes('Unique') || e.message.includes('already')) {
                    console.log('⏭️ (exists)');
                } else {
                    console.log('❌', e.message);
                }
            }
        }
    } else {
        console.log('   ⚠️ No admin policy found. Will rely on admin user token.');
    }
}

async function main() {
    console.log('🔧 Fixing Contacts Collection and Permissions...\n');

    try {
        // Login
        console.log('🔐 Logging in as admin...');
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin login successful!\n');

        // Check if contacts collection exists
        console.log('🔍 Checking if contacts collection exists...');
        const exists = await checkCollectionExists('contacts');

        if (!exists) {
            // Create the collection
            await createContactsCollection();
            await createContactsFields();
        } else {
            console.log('✅ Contacts collection already exists.\n');
            // Still try to create fields in case they're missing
            await createContactsFields();
        }

        console.log('');

        // Setup permissions
        await setupPublicPermissions();
        console.log('');
        await setupAdminTokenPermissions();

        console.log('\n✨ Contacts collection setup complete!');
        console.log('📝 You can now submit contact forms from the frontend.');

    } catch (e) {
        console.error('\n❌ Setup failed:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

main();

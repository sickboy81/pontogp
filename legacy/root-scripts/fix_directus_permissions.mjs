#!/usr/bin/env node
/**
 * Directus 11 Permission Fix Script
 * Uses the new policy-based access control model
 * 
 * Usage: node scripts/fix_directus_permissions.mjs
 */

import { createDirectus, rest, authentication, readRoles, readPolicies, createPolicy, createPermission, updateRole } from '@directus/sdk';

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

async function main() {
    console.log('🔧 Directus 11 Permission Fix Script');
    console.log('=====================================');
    console.log(`URL: ${DIRECTUS_URL}`);
    console.log('');

    try {
        // 1. Login as Admin
        console.log('1️⃣  Logging in as admin...');
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Login successful!');
        console.log('');

        // 2. Get roles to find Public role
        console.log('2️⃣  Finding Public role...');
        const roles = await directus.request(readRoles());
        const publicRole = roles.find(r => r.name === 'Public' || r.name === 'public');

        if (!publicRole) {
            console.log('❌ Public role not found!');
            return;
        }
        console.log(`✅ Found Public role: ${publicRole.id}`);
        console.log('');

        // 3. Check for existing policies
        console.log('3️⃣  Checking policies...');
        let policies = [];
        try {
            policies = await directus.request(readPolicies());
            console.log(`   Found ${policies.length} policy(ies)`);
        } catch (e) {
            console.log('   Could not read policies, might need different approach');
        }

        // 4. Create a policy for public access if needed
        let publicPolicy = policies.find(p => p.name === 'Public Access Policy');

        if (!publicPolicy) {
            console.log('⚠️  Creating "Public Access Policy"...');
            try {
                publicPolicy = await directus.request(createPolicy({
                    name: 'Public Access Policy',
                    icon: 'public',
                    description: 'Allows public read access to profiles',
                    admin_access: false,
                    app_access: false,
                }));
                console.log(`✅ Created policy: ${publicPolicy.id}`);
            } catch (e) {
                console.log('   Could not create policy, trying alternative approach...');
                console.log('   Error:', e.message);
            }
        } else {
            console.log(`✅ Found existing policy: ${publicPolicy.id}`);
        }
        console.log('');

        // 5. Create permissions with policy
        if (publicPolicy) {
            console.log('5️⃣  Creating permissions with policy...');
            try {
                await directus.request(createPermission({
                    policy: publicPolicy.id,
                    collection: 'profiles',
                    action: 'read',
                    permissions: { status: { _eq: 'active' } },
                    fields: ['*'],
                }));
                console.log('✅ Created READ permission for profiles');
            } catch (e) {
                if (e.message?.includes('already exists')) {
                    console.log('✅ Permission already exists');
                } else {
                    console.log('❌ Error creating permission:', e.message);
                }
            }

            try {
                await directus.request(createPermission({
                    policy: publicPolicy.id,
                    collection: 'directus_files',
                    action: 'read',
                    permissions: {},
                    fields: ['*'],
                }));
                console.log('✅ Created READ permission for directus_files');
            } catch (e) {
                if (e.message?.includes('already exists')) {
                    console.log('✅ Permission already exists');
                } else {
                    console.log('❌ Error creating permission:', e.message);
                }
            }
        }
        console.log('');

        // 6. Summary
        console.log('📋 NEXT STEPS');
        console.log('=====================================');
        console.log('If automatic permission creation failed:');
        console.log('');
        console.log('1. Go to: https://base.pontogp.com/admin/settings/access-control');
        console.log('2. Click on "Public" role');
        console.log('3. Under "Permissions", click "+ Add"');
        console.log('4. Select "profiles" collection');
        console.log('5. Check "Read" action');
        console.log('6. Save');
        console.log('');
        console.log('7. Repeat for "directus_files" collection');

    } catch (error) {
        console.error('❌ Error:', error.message || error);
        if (error.errors) {
            error.errors.forEach(e => console.error('   -', e.message));
        }
    }
}

main();

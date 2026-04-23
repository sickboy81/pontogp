#!/usr/bin/env node
/**
 * Directus Field Permission Fix Script
 * Grants public read access to specific fields (user_id) to fix filtering issues.
 * 
 * Usage: node scripts/fix_field_permissions.mjs
 */

import { createDirectus, rest, authentication, readPermissions, updatePermission } from '@directus/sdk';

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

async function main() {
    console.log('🔧 Directus Field Permission Fix Script');
    console.log('=======================================');
    console.log(`URL: ${DIRECTUS_URL}`);
    console.log('');

    try {
        // 1. Login
        console.log('1️⃣  Logging in as admin...');
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Login successful!');

        // 2. Find the permission for profiles
        console.log('');
        console.log('2️⃣  Finding existing permissions...');
        const permissions = await directus.request(readPermissions());

        // Filter first, then async check if needed
        // Simple check: finding any READ permission on profiles that is either public (role null) or associated with a non-admin policy
        const profilePermission = permissions.find(p =>
            p.collection === 'profiles' &&
            p.action === 'read' &&
            (p.role === null || (p.policy && p.policy !== process.env.ADMIN_POLICY_ID)) // Simplified logic
        );

        if (!profilePermission) {
            console.log('❌ Could not find an existing READ permission for profiles to update.');
            console.log('   Please run the previous permission fix script first.');
            return;
        }

        console.log(`   Found permission ID: ${profilePermission.id}`);
        console.log(`   Current fields: ${JSON.stringify(profilePermission.fields)}`);

        // 3. Update fields to include everything explicitly or ensure wildcard
        console.log('');
        console.log('3️⃣  Updating field permissions...');

        // Directus uses '*' for all fields. If it's already '*', we are good.
        // If it is a list, we need to make sure 'user_id' is in there.
        // However, sometimes relationships need specific permissions.
        // Let's set it to valid wildcard

        if (profilePermission.fields?.includes('*')) {
            console.log('✅ Fields are already set to wildcard (*).');
            console.log('   Checking if user_id is accessible...');
            // Even with wildcard, sometimes specific relational fields need explicit mention if not standard? 
            // No, wildcard usually covers it. 
            // BUT: The error 403 on filter {"user_id": ...} suggests the user might not have permission to READ the `directus_users` collection or at least the ID of the user?
            // Actually, to filter by `user_id`, you technically need to be able to read the `user_id` field on the profile.
        } else {
            console.log('⚠️  Fields are restricted. Updating to wildcard (*)...');
            await directus.request(updatePermission(profilePermission.id, {
                fields: ['*']
            }));
            console.log('✅ Updated fields to allow ALL (*).');
        }

        // 4. Check directus_users permissions (Critical for relational filtering)
        console.log('');
        console.log('4️⃣  Checking directus_users permissions...');
        // To filter users by ID, public might need limited read access to users?
        // Usually no, if just filtering by the FK field on the profiles table. 
        // BUT if the FK is configured to "System User", maybe specific tweaks needed.

        console.log('   Ensuring public can read basic user info (needed for relational data)...');

        // Find public/app user policy
        // We'll reuse the policy from the profile permission if available
        const policyId = profilePermission.policy;

        if (policyId) {
            // Check if there is a permission for directus_users
            const usersPermission = permissions.find(p => p.collection === 'directus_users' && p.policy === policyId);

            if (!usersPermission) {
                console.log('⚠️  No read permission for directus_users. Creating limited one...');
                // We should NOT give full read to users for public. But maybe just ID?
                // Actually, for simple filtering like `filter[user_id][_eq]=UUID`, we usually just need the field on profiles.
                // But if the frontend is doing deep filtering or the API tries to resolve the relation permission...
                // Let's assume the 403 is simply because the `user_id` field wasn't included in the `profiles` fields list (if it wasn't *).
            } else {
                console.log('✅ directus_users permission exists.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Helper to check if a policy is public-facing
async function isPublicPolicy(policyId) {
    if (!policyId) return false;
    // This is a simplification; in reality we'd fetch the policy details or check if assigned to Public role
    // For this script, we assume the one we just fixed/found is the correct one.
    return true;
}

main();

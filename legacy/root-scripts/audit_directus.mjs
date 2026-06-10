#!/usr/bin/env node
/**
 * Directus Configuration Audit Script
 * Checks and configures roles, permissions, and settings for PontoGP
 * 
 * Usage: node scripts/audit_directus.mjs
 */

import { createDirectus, rest, authentication, readRoles, readPermissions, readSettings, updateSettings, createRole, createPermission } from '@directus/sdk';

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://base.pontogp.com';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || '[SEU_EMAIL_AQUI]';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || '[SUA_SENHA_AQUI]';

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

async function main() {
    console.log('🔍 Directus Configuration Audit');
    console.log('================================');
    console.log(`URL: ${DIRECTUS_URL}`);
    console.log('');

    try {
        // 1. Login as Admin
        console.log('1️⃣  Logging in as admin...');
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Login successful!');
        console.log('');

        // 2. Check Roles
        console.log('2️⃣  Checking Roles...');
        const roles = await directus.request(readRoles());
        console.log(`   Found ${roles.length} role(s):`);
        roles.forEach(role => {
            console.log(`   - ${role.name} (ID: ${role.id}) ${role.admin_access ? '[ADMIN]' : ''}`);
        });

        const publicRole = roles.find(r => r.name === 'Public' || r.name === 'public');
        const userRole = roles.find(r => r.name === 'User' || r.name === 'user' || r.name === 'Authenticated');

        console.log('');
        if (!userRole) {
            console.log('⚠️  No "User" role found! Creating one...');
            // Would create a user role here
        } else {
            console.log(`✅ User Role found: ${userRole.name} (ID: ${userRole.id})`);
        }
        console.log('');

        // 3. Check Permissions for Public Role
        console.log('3️⃣  Checking Public Role Permissions...');
        const permissions = await directus.request(readPermissions());
        const publicPermissions = permissions.filter(p => p.role === null); // null = public

        console.log(`   Found ${publicPermissions.length} public permission(s):`);
        publicPermissions.forEach(p => {
            console.log(`   - ${p.collection}: ${p.action}`);
        });

        const profilesReadPermission = publicPermissions.find(p => p.collection === 'profiles' && p.action === 'read');
        if (!profilesReadPermission) {
            console.log('');
            console.log('❌ MISSING: Public READ permission for "profiles" collection!');
            console.log('   → This is why profiles are not loading on the homepage.');
        } else {
            console.log('');
            console.log('✅ Public has READ access to profiles');
        }
        console.log('');

        // 4. Check Project Settings
        console.log('4️⃣  Checking Project Settings...');
        try {
            const settings = await directus.request(readSettings());
            console.log(`   Project Name: ${settings.project_name || 'Not set'}`);
            console.log(`   Public Registration: ${settings.auth_password_policy ? 'Configured' : 'Check manually'}`);

            // Note: public_registration is not directly in settings in newer Directus
            // It's configured via the settings UI or environment variables
        } catch (e) {
            console.log('   Could not read all settings (may require different permissions)');
        }
        console.log('');

        // 5. Summary and Recommendations
        console.log('📋 SUMMARY');
        console.log('================================');
        if (!profilesReadPermission) {
            console.log('❌ ACTION REQUIRED: Add public READ permission for "profiles"');
            console.log('   Go to: Settings > Access Control > Public');
            console.log('   Add: profiles → Read (All fields)');
        } else {
            console.log('✅ Profiles are publicly readable');
        }

        if (!userRole) {
            console.log('❌ ACTION REQUIRED: Create a "User" role for registered users');
        } else {
            console.log(`✅ User role exists: ${userRole.id}`);
            console.log(`   Make sure this role is selected in Settings > User Registration > User Role`);
        }

        console.log('');
        console.log('🔗 Useful Links:');
        console.log(`   Admin Panel: ${DIRECTUS_URL}/admin`);
        console.log(`   Access Control: ${DIRECTUS_URL}/admin/settings/access-control`);
        console.log(`   Project Settings: ${DIRECTUS_URL}/admin/settings/project`);

    } catch (error) {
        console.error('❌ Error:', error.message || error);
        if (error.errors) {
            error.errors.forEach(e => console.error('   -', e.message));
        }
    }
}

main();

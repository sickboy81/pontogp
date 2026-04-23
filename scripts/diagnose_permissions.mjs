
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

async function diagnose() {
    console.log('🕵️‍♀️ Starting Permission Diagnosis...');

    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Auth successful.');

        // 1. Check Project Settings for Public Role
        const settingsRes = await rawRequest('/settings');
        const publicRoleId = settingsRes.data.public_role;
        console.log(`\n1. Project Public Role ID: ${publicRoleId || 'NONE'}`);

        if (!publicRoleId) {
            console.error('❌ CRITICAL: No Public Role configured in Settings!');
            return;
        }

        // 2. Check Role Details
        const roleRes = await rawRequest(`/roles/${publicRoleId}`);
        const role = roleRes.data;
        console.log(`\n2. Public Role Details:`);
        console.log(`   Name: ${role.name}`);
        console.log(`   Policies (Direct): ${JSON.stringify(role.policies)}`);

        // 3. Check directus_access (Junction table)
        // Policies might be linked here instead of direct array in some versions
        console.log(`\n3. Checking directus_access (Role <-> Policy links)...`);
        const accessRes = await rawRequest(`/items/directus_access?filter[role][_eq]=${publicRoleId}`);
        const accessLinks = accessRes.data;
        console.log(`   Found ${accessLinks.length} policy links.`);

        const policyIds = new Set([...(role.policies || []), ...accessLinks.map(a => a.policy)]);
        console.log(`   Total Effective Policy IDs: ${Array.from(policyIds).join(', ')}`);

        if (policyIds.size === 0) {
            console.error('❌ CRITICAL: Public Role has NO policies attached!');
        }

        // 4. Inspect Each Policy
        for (const policyId of policyIds) {
            console.log(`\n   --- Inspecting Policy: ${policyId} ---`);
            try {
                const policyRes = await rawRequest(`/policies/${policyId}`);
                console.log(`   Name: ${policyRes.data.name}`);
            } catch (e) { console.log('   (Could not fetch policy details)'); }

            // Check permissions for this policy
            const permRes = await rawRequest(`/permissions?filter[policy][_eq]=${policyId}`);
            const perms = permRes.data;

            const profilePerm = perms.find(p => p.collection === 'profiles');
            if (profilePerm) {
                console.log(`   ✅ 'profiles' Permission Found:`);
                console.log(`      Action: ${profilePerm.action}`);
                console.log(`      Fields: ${JSON.stringify(profilePerm.fields)}`);
            } else {
                console.log(`   ⚠️ NO 'profiles' permission in this policy.`);
            }
        }

    } catch (e) {
        console.error('Diagnosis failed:', e);
    }
}

diagnose();

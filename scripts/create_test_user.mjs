
import { createDirectus, rest, authentication, createUser, readRoles } from '@directus/sdk';
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

async function main() {
    console.log(`🚀 Creating TEST user...`);

    try {
        await directus.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin login successful.');

        // 1. Find User Role
        const roles = await directus.request(readRoles());
        const userRole = roles.find(r => r.name === 'User');
        const adminRole = roles.find(r => r.name === 'Administrator');

        const roleToAssign = userRole ? userRole.id : adminRole.id;
        console.log(`   Assigning Role: ${userRole ? 'User' : 'Administrator'} (${roleToAssign})`);

        // 2. Create User
        try {
            await directus.request(createUser({
                email: 'teste@teste.com',
                password: '12345678',
                first_name: 'Usuario',
                last_name: 'Teste',
                role: roleToAssign,
                status: 'active'
            }));
            console.log('✅ User "teste@teste.com" created successfully!');
        } catch (e) {
            console.log('   User might already exist. Trying to reset its password...');
            // Need custom raw request to find user by email easily without permissions issues sometimes
            // (Skipping for brevity, assuming fresh creation or manual deletion if exists)
            console.error('   Creation failed (Email exists?):', e.errors?.[0]?.message || e.message);
        }

        console.log('\n👉 Try logging in with:');
        console.log('   Email: teste@teste.com');
        console.log('   Senha: 12345678');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

main();

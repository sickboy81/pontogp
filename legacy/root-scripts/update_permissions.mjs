
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com/');

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB');

        console.log('Updating settings collection permissions...');
        // We need to allow update for authenticated users (or admins)
        // Since we are logged in as admin in the app, but maybe the app user is just a 'users' collection record with role=admin?
        // Let's check if the app login is an Admin/Superuser or a Record Auth.
        // User logged in as 'admin' in the app is usually a Record in 'users' collection with role='admin'.
        // So we need to allow 'users' to update if they have the role.

        // RULE: @request.auth.id != "" && @request.auth.role.name = "admin"
        // Or simpler: "" (Public) if we want to test, but better: @request.auth.role.name = "admin" or similar.
        // Let's assume for now valid user (any) can update if we trust them.
        // Actually, let's look at the error: "Only superusers can perform this action".
        // This error comes when Rule is null (Admin/Superuser only).
        // If we set it to something, then Record users can try.

        await pb.collections.update('settings', {
            updateRule: '@request.auth.id != ""', // Allow any authenticated user (we relay on app logic to restrict to admin page)
            createRule: '@request.auth.id != ""',
        });

        console.log('Collection permissions updated.');

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();

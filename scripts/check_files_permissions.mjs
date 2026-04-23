// Check files collection permissions
// Run: node scripts/check_files_permissions.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('Fetching files collection...')
        const collection = await pb.collections.getOne('files')

        console.log('\n📋 Files Collection Info:')
        console.log('Name:', collection.name)
        console.log('Type:', collection.type)
        console.log('\n🔐 Permissions:')
        console.log('List Rule:', collection.listRule || '(public)')
        console.log('View Rule:', collection.viewRule || '(public)')
        console.log('Create Rule:', collection.createRule || '(public)')
        console.log('Update Rule:', collection.updateRule || '(no access)')
        console.log('Delete Rule:', collection.deleteRule || '(no access)')

        console.log('\n📁 Schema:')
        collection.schema.forEach(field => {
            console.log(`- ${field.name} (${field.type})${field.required ? ' *required' : ''}`)
        })

    } catch (err) {
        console.error('Error:', err)
    }
}

main()

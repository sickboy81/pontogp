// Fix files collection schema without deleting
// Run: node scripts/fix_schema_only.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\n📋 Getting files collection...')
        const collection = await pb.collections.getOne('files')

        console.log('Current collection ID:', collection.id)
        console.log('Current schema:', collection.schema)

        // Update with correct schema
        console.log('\n✏️ Updating schema...')
        const updated = await pb.collections.update(collection.id, {
            schema: [
                {
                    id: 'file_field',
                    name: 'file',
                    type: 'file',
                    required: false, // Changed to false to allow existing records
                    options: {
                        maxSelect: 1,
                        maxSize: 5242880,
                        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
                        thumbs: ['100x100', '300x300', '600x600']
                    }
                }
            ]
        })

        console.log('✅ Schema updated!')
        console.log('\nNew schema:', JSON.stringify(updated.schema, null, 2))

    } catch (err) {
        console.error('❌ Error:', err)
        if (err.data) {
            console.error('Details:', JSON.stringify(err.data, null, 2))
        }
    }
}

main()

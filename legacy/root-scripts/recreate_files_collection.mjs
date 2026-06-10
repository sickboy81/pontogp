// Recreate files collection from scratch
// Run: node scripts/recreate_files_collection.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        // Delete existing collection
        try {
            console.log('\n🗑️ Deleting old files collection...')
            const oldCollection = await pb.collections.getOne('files')
            await pb.collections.delete(oldCollection.id)
            console.log('✅ Old collection deleted')
        } catch (err) {
            console.log('ℹ️ No existing collection to delete')
        }

        // Create new collection
        console.log('\n📝 Creating new files collection...')
        const newCollection = await pb.collections.create({
            name: 'files',
            type: 'base',
            schema: [
                {
                    name: 'file',
                    type: 'file',
                    required: true,
                    options: {
                        maxSelect: 1,
                        maxSize: 5242880, // 5MB
                        mimeTypes: [
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                            'image/gif',
                            'image/webp',
                            'image/svg+xml'
                        ],
                        thumbs: ['100x100', '300x300', '600x600']
                    }
                },
                {
                    name: 'user_id',
                    type: 'relation',
                    required: false,
                    options: {
                        collectionId: '_pb_users_auth_',
                        cascadeDelete: false,
                        minSelect: null,
                        maxSelect: 1,
                        displayFields: []
                    }
                }
            ],
            listRule: null, // Public read
            viewRule: null, // Public read  
            createRule: '@request.auth.id != ""', // Authenticated users can create
            updateRule: 'user_id = @request.auth.id', // Only owner can update
            deleteRule: 'user_id = @request.auth.id' // Only owner can delete
        })

        console.log('✅ Files collection created successfully!')
        console.log('\n📋 Collection details:')
        console.log('ID:', newCollection.id)
        console.log('Name:', newCollection.name)
        console.log('Schema:', JSON.stringify(newCollection.schema, null, 2))

    } catch (err) {
        console.error('❌ Error:', err)
        if (err.data) {
            console.error('Error details:', JSON.stringify(err.data, null, 2))
        }
    }
}

main()

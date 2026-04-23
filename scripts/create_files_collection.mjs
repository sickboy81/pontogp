// Create 'files' collection for photo uploads
// Run: node scripts/create_files_collection.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('Checking if files collection exists...')
        try {
            await pb.collections.getOne('files')
            console.log('✅ Files collection already exists')
            return
        } catch (err) {
            console.log('Files collection does not exist, creating...')
        }

        // Create files collection
        const collection = await pb.collections.create({
            name: 'files',
            type: 'base',
            schema: [
                {
                    name: 'file',
                    type: 'file',
                    required: true,
                    options: {
                        maxSelect: 1,
                        maxSize: 10485760, // 10MB
                        mimeTypes: [
                            'image/jpeg',
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
        console.log('Collection ID:', collection.id)
    } catch (err) {
        console.error('Error:', err)
    }
}

main()

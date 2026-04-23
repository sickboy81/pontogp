// Add media relation fields to profiles collection
// Run: node scripts/add_media_fields_to_profiles.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\n📋 Fetching profiles and files collections...')
        const profilesCollection = await pb.collections.getOne('profiles')
        const filesCollection = await pb.collections.getOne('files')

        console.log('Files collection ID:', filesCollection.id)

        // Get existing schema or create empty array
        const existingSchema = profilesCollection.schema || []

        // Add media relation fields
        const newSchema = [
            ...existingSchema,
            {
                name: 'photos',
                type: 'relation',
                required: false,
                options: {
                    collectionId: filesCollection.id,
                    cascadeDelete: false,
                    minSelect: null,
                    maxSelect: null, // unlimited
                    displayFields: []
                }
            },
            {
                name: 'videos',
                type: 'relation',
                required: false,
                options: {
                    collectionId: filesCollection.id,
                    cascadeDelete: false,
                    minSelect: null,
                    maxSelect: null, // unlimited
                    displayFields: []
                }
            },
            {
                name: 'audio',
                type: 'relation',
                required: false,
                options: {
                    collectionId: filesCollection.id,
                    cascadeDelete: false,
                    minSelect: null,
                    maxSelect: 1, // single file
                    displayFields: []
                }
            }
        ]

        console.log('\n✏️ Updating profiles collection schema...')
        await pb.collections.update(profilesCollection.id, {
            schema: newSchema
        })

        console.log('✅ Media fields added successfully!')
        console.log('\n📝 Added fields:')
        console.log('  - photos (relation to files, multiple)')
        console.log('  - videos (relation to files, multiple)')
        console.log('  - audio (relation to files, single)')

    } catch (err) {
        console.error('❌ Error:', err)
        if (err.data) {
            console.error('Details:', JSON.stringify(err.data, null, 2))
        }
    }
}

main()

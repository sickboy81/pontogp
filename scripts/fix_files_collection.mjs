// Check and fix files collection schema
// Run: node scripts/fix_files_collection.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\nFetching files collection...')
        const collection = await pb.collections.getOne('files')

        console.log('\n📋 Current Schema:')
        console.log(JSON.stringify(collection.schema, null, 2))

        // Check if there's a file field
        const fileField = collection.schema.find(f => f.type === 'file')

        if (!fileField) {
            console.log('\n❌ No file field found! Creating one...')

            // Add file field to schema
            collection.schema.push({
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
            })

            await pb.collections.update(collection.id, {
                schema: collection.schema
            })

            console.log('✅ File field added successfully!')
        } else {
            console.log(`\n✅ File field exists: "${fileField.name}"`)
            console.log('Field options:', JSON.stringify(fileField.options, null, 2))
        }

    } catch (err) {
        console.error('Error:', err)
    }
}

main()

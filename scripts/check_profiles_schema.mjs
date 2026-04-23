// Check profiles collection schema
// Run: node scripts/check_profiles_schema.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\n📋 Fetching profiles collection schema...')
        const collection = await pb.collections.getOne('profiles')

        console.log('\nCollection name:', collection.name)
        console.log('\nSchema fields:')

        if (collection.schema) {
            collection.schema.forEach((field) => {
                console.log(`\n  Field: ${field.name}`)
                console.log(`  Type: ${field.type}`)
                if (field.options) {
                    console.log(`  Options:`, JSON.stringify(field.options, null, 4))
                }
            })
        } else {
            console.log('  No schema found')
        }

        // Check specifically for photos, videos, audio fields
        console.log('\n🔍 Checking media fields:')
        const photosField = collection.schema?.find((f) => f.name === 'photos')
        const videosField = collection.schema?.find((f) => f.name === 'videos')
        const audioField = collection.schema?.find((f) => f.name === 'audio')

        console.log('\n  photos field:', photosField ? `${photosField.type}` : 'NOT FOUND')
        console.log('  videos field:', videosField ? `${videosField.type}` : 'NOT FOUND')
        console.log('  audio field:', audioField ? `${audioField.type}` : 'NOT FOUND')

    } catch (err) {
        console.error('❌ Error:', err)
        if (err.data) {
            console.error('Details:', JSON.stringify(err.data, null, 2))
        }
    }
}

main()

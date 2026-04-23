// Check if profile was created successfully
// Run: node scripts/check_profile.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\n📋 Fetching all profiles...')
        const profiles = await pb.collection('profiles').getList(1, 10, {
            sort: '-created'
        })

        console.log(`\nFound ${profiles.items.length} profiles:\n`)

        profiles.items.forEach((profile, i) => {
            console.log(`Profile ${i + 1}:`)
            console.log('  ID:', profile.id)
            console.log('  Name:', profile.name)
            console.log('  Created:', profile.created)
            console.log('  Photos:', profile.photos)
            console.log('  Videos:', profile.videos)
            console.log('  User ID:', profile.user_id)
            console.log('---')
        })

        if (profiles.items.length === 0) {
            console.log('❌ No profiles found! The profile was not saved.')
        }

    } catch (err) {
        console.error('❌ Error:', err)
        if (err.data) {
            console.error('Details:', JSON.stringify(err.data, null, 2))
        }
    }
}

main()

// Check specific profile
// Run: node scripts/check_specific_profile.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        const profileId = 'u42vyx3ockggv37'

        console.log(`\n📋 Fetching profile ${profileId}...`)

        try {
            const profile = await pb.collection('profiles').getOne(profileId)

            console.log('\n✅ Profile found!')
            console.log('ID:', profile.id)
            console.log('Name:', profile.name)
            console.log('Photos:', profile.photos)
            console.log('Videos:', profile.videos)
            console.log('All fields:', Object.keys(profile))
            console.log('\nFull profile:', JSON.stringify(profile, null, 2))

        } catch (err) {
            console.log('\n❌ Profile not found or error fetching it')
            console.log('Error:', err.message)
            if (err.status === 404) {
                console.log('\nThe profile does not exist in the database.')
            }
        }

    } catch (err) {
        console.error('❌ Auth error:', err)
    }
}

main()

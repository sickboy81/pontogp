// Verify if profile expansion works now
// Run: node scripts/verify_profile_expansion.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        const profileId = 'u42vyx3ockggv37'

        console.log(`\n📋 Fetching profile ${profileId} with expansion...`)

        try {
            const profile = await pb.collection('profiles').getOne(profileId, {
                expand: 'photos,videos,audio'
            })

            console.log('\n✅ Profile fetched!')
            console.log('ID:', profile.id)

            console.log('\n🔍 Checking expansions:')

            if (profile.expand) {
                if (profile.expand.photos) {
                    console.log(`✅ Photos expanded: ${profile.expand.photos.length} items`)
                    profile.expand.photos.forEach(p => console.log(`   - ${p.file}`))
                } else {
                    console.log('❌ Photos NOT expanded (but field might be empty?)')
                    console.log('Raw photos field:', profile.photos)
                }

                if (profile.expand.videos) {
                    console.log(`✅ Videos expanded: ${profile.expand.videos.length} items`)
                }

            } else {
                console.log('❌ No "expand" property found in response.')
                console.log('Raw photos field:', profile.photos)
            }

        } catch (err) {
            console.log('\n❌ Error fetching profile:', err.message)
            if (err.data) console.log(JSON.stringify(err.data, null, 2))
        }

    } catch (err) {
        console.error('❌ Auth error:', err)
    }
}

main()

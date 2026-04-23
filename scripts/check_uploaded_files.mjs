// Check if files are actually being saved
// Run: node scripts/check_uploaded_files.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\n📋 Fetching recent file records...')
        const records = await pb.collection('files').getList(1, 10, {
            sort: '-created'
        })

        console.log(`\nFound ${records.items.length} records:\n`)

        records.items.forEach((record, i) => {
            console.log(`Record ${i + 1}:`)
            console.log('  ID:', record.id)
            console.log('  Created:', record.created)
            console.log('  File field:', record.file)
            console.log('  All fields:', Object.keys(record))
            console.log('  Full record:', JSON.stringify(record, null, 2))
            console.log('---')
        })

    } catch (err) {
        console.error('❌ Error:', err)
    }
}

main()

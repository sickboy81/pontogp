// Add video and audio support to files collection
// Run: node scripts/add_media_support.mjs

import PocketBase from 'pocketbase'

const pb = new PocketBase('https://pocketbase.cerejavip.com')

async function main() {
    try {
        console.log('🔐 Authenticating...')
        await pb.admins.authWithPassword('egeohub101@gmail.com', '041052.11setemB')

        console.log('\n📋 Updating files collection to support videos and audio...')
        const collection = await pb.collections.getOne('files')

        // Update the file field to support videos and audio
        const updatedSchema = collection.schema.map(field => {
            if (field.name === 'file') {
                return {
                    ...field,
                    options: {
                        ...field.options,
                        maxSize: 104857600, // 100MB for videos
                        mimeTypes: [
                            // Images
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                            'image/gif',
                            'image/webp',
                            'image/svg+xml',
                            // Videos
                            'video/mp4',
                            'video/webm',
                            'video/quicktime',
                            'video/x-msvideo',
                            // Audio
                            'audio/mpeg',
                            'audio/mp3',
                            'audio/wav',
                            'audio/ogg',
                            'audio/webm'
                        ]
                    }
                }
            }
            return field
        })

        await pb.collections.update(collection.id, {
            schema: updatedSchema
        })

        console.log('✅ Collection updated successfully!')
        console.log('\n📝 Supported formats:')
        console.log('  Images: JPEG, PNG, GIF, WebP, SVG')
        console.log('  Videos: MP4, WebM, QuickTime, AVI')
        console.log('  Audio: MP3, WAV, OGG, WebM')
        console.log('  Max size: 100MB')

    } catch (err) {
        console.error('❌ Error:', err)
        if (err.data) {
            console.error('Details:', JSON.stringify(err.data, null, 2))
        }
    }
}

main()

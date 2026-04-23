import fs from 'fs'
import path from 'path'
import PocketBase from 'pocketbase'
import { fileURLToPath } from 'url'

// ESM filename/dirname shim
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple .env parser to avoid checking in dotenv dependency
function loadEnv() {
    try {
        // Check root directory for .env (assuming script is in /scripts)
        const envPath = path.resolve(__dirname, '..', '.env')
        if (fs.existsSync(envPath)) {
            console.log('Loading .env from:', envPath)
            const envContent = fs.readFileSync(envPath, 'utf-8')
            envContent.split('\n').forEach(line => {
                const parts = line.split('=')
                if (parts.length >= 2) {
                    const key = parts[0].trim()
                    const value = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '')
                    if (key && value && !process.env[key]) {
                        process.env[key] = value
                    }
                }
            })
        } else {
            console.log('.env file not found at:', envPath)
        }
    } catch (e) {
        console.log('Could not load .env file', e)
    }
}

loadEnv()

// Config
const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

async function cleanup() {
    console.log(`Starting cleanup job connecting to ${POCKETBASE_URL}...`)
    const pb = new PocketBase(POCKETBASE_URL)

    try {
        // Auth (if needed for update, highly recommended)
        if (ADMIN_EMAIL && ADMIN_PASSWORD) {
            console.log(`Authenticating as ${ADMIN_EMAIL}...`)
            await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
            console.log('Authenticated as admin.');
        } else {
            console.warn('No ADMIN credentials provided (ADMIN_EMAIL/ADMIN_PASSWORD). Updates might fail if rules require auth.');
        }

        const now = new Date()

        // 1. Process Contact Expiration (Status -> muted)
        // Find profiles that are active, have contact_expires_at < now
        // Only process if status is 'active'
        let page = 1;
        let hasMore = true;
        let mutedCount = 0;

        while (hasMore) {
            // Use a simpler filter first to debug
            const result = await pb.collection('profiles').getList(page, 50, {
                filter: `status = "active" && contact_expires_at != "" && contact_expires_at < "${now.toISOString()}"`,
            })

            console.log(`Processing batch ${page} of active IDs check... Found ${result.items.length} potetial items.`)

            for (const p of result.items) {
                console.log(`Muting profile ${p.id} (${p.name || 'No Name'})...`)
                try {
                    await pb.collection('profiles').update(p.id, {
                        status: 'muted'
                    })
                    console.log(`Profile ${p.id} muted.`)
                    mutedCount++;
                } catch (e) {
                    console.error(`Failed to mute profile ${p.id}:`, e)
                }
            }

            if (page >= result.totalPages) {
                hasMore = false;
            } else {
                page++;
            }
        }
        console.log(`Total profiles muted: ${mutedCount}`)

        // 2. Process Search Expiration (Status -> archived)
        // Find profiles that are active OR muted, have search_expires_at < now
        page = 1;
        hasMore = true;
        let archivedCount = 0;

        while (hasMore) {
            const result = await pb.collection('profiles').getList(page, 50, {
                filter: `(status = "active" || status = "muted") && search_expires_at != "" && search_expires_at < "${now.toISOString()}"`,
            })

            console.log(`Processing batch ${page} of active/muted -> archived... Found ${result.items.length} items.`)

            for (const p of result.items) {
                console.log(`Archiving profile ${p.id} (${p.name || 'No Name'})...`)
                try {
                    await pb.collection('profiles').update(p.id, {
                        status: 'archived'
                    })
                    console.log(`Profile ${p.id} archived.`)
                    archivedCount++;
                } catch (e) {
                    console.error(`Failed to archive profile ${p.id}:`, e)
                }
            }

            if (page >= result.totalPages) {
                hasMore = false;
            } else {
                page++;
            }
        }
        console.log(`Total profiles archived: ${archivedCount}`)

        console.log('Cleanup job finished.')

    } catch (error) {
        console.error('Cleanup job failed:', error)
        process.exit(1)
    }
}

cleanup()

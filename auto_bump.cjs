
const fs = require('fs');
const PocketBase = require('pocketbase/cjs');

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'https://pocketbase.cerejavip.com';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);
const LOCK_FILE = '/tmp/cerejavip-auto-bump.lock';
const LOCK_STALE_MS = 15 * 60 * 1000; // 15 min

function acquireLock() {
    const now = Date.now();
    try {
        if (fs.existsSync(LOCK_FILE)) {
            const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
            const lockTs = Number(lockContent);
            const lockAge = Number.isFinite(lockTs) ? now - lockTs : Number.POSITIVE_INFINITY;
            if (lockAge < LOCK_STALE_MS) {
                console.log(`[AutoBump] Skip: another execution is running (lock age ${Math.round(lockAge / 1000)}s).`);
                return false;
            }
            console.log('[AutoBump] Stale lock detected, replacing old lock.');
            fs.unlinkSync(LOCK_FILE);
        }

        fs.writeFileSync(LOCK_FILE, String(now), { flag: 'wx' });
        return true;
    } catch (error) {
        console.error('[AutoBump] Failed to acquire lock:', error.message);
        return false;
    }
}

function releaseLock() {
    try {
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
        }
    } catch (error) {
        console.error('[AutoBump] Failed to release lock:', error.message);
    }
}

async function runAutoBump() {
    if (!acquireLock()) return;

    try {
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error('Defina POCKETBASE_ADMIN_EMAIL e POCKETBASE_ADMIN_PASSWORD (ou PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD)');
            return;
        }
        console.log(`[${new Date().toISOString()}] Starting Auto-Bump process...`);

        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

        // 1. Get all plans
        const plans = await pb.collection('plans').getFullList();
        const plansMap = Object.fromEntries(plans.map(p => [p.slug, p]));

        // 2. Get all active profiles (bumping everyone with a valid plan)
        const profiles = await pb.collection('profiles').getFullList({
            filter: 'status = "active"',
            sort: '-last_bump_at'
        });

        console.log(`Found ${profiles.length} active profiles.`);

        // Use Brazil/Sao_Paulo timezone (UTC-3) for date consistency
        const now = new Date();
        const brazilOffset = 3 * 60 * 60 * 1000; // 3 hours in ms
        const brazilDate = new Date(now.getTime() - brazilOffset);
        const today = brazilDate.toISOString().split('T')[0];

        for (const profile of profiles) {
            const plan = plansMap[profile.plan];
            if (!plan || !plan.daily_bumps || plan.daily_bumps <= 0) {
                console.log(`Profile ${profile.id} has no valid plan for bumps.`);
                continue;
            }

            // 3. Check bumps used today
            let dailyBumpRecord;
            try {
                const records = await pb.collection('profile_daily_bumps').getList(1, 1, {
                    filter: `profile = "${profile.id}" && date ~ "${today}"`
                });
                if (records.items.length > 0) {
                    dailyBumpRecord = records.items[0];
                }
            } catch (e) {
                console.error(`Error fetching daily bumps for ${profile.id}:`, e.message);
            }

            const bumpsUsed = dailyBumpRecord ? dailyBumpRecord.bumps_used : 0;

            if (bumpsUsed >= plan.daily_bumps) {
                console.log(`Profile ${profile.id} already used all ${plan.daily_bumps} bumps for today.`);
                continue;
            }

            // 4. Check timing
            // Ideal interval in milliseconds
            const intervalMs = (24 * 60 * 60 * 1000) / plan.daily_bumps;
            const lastBump = profile.last_bump_at ? new Date(profile.last_bump_at).getTime() : 0;
            const now = Date.now();
            const forceMode = process.argv.includes('--force');

            if (forceMode || now - lastBump >= intervalMs) {
                console.log(`Bumping profile ${profile.id} (${profile.name})... ${forceMode ? '[FORCE MODE]' : ''}`);

                // Perform bump
                if (dailyBumpRecord) {
                    await pb.collection('profile_daily_bumps').update(dailyBumpRecord.id, {
                        bumps_used: bumpsUsed + 1
                    });
                } else {
                    await pb.collection('profile_daily_bumps').create({
                        profile: profile.id,
                        date: today,
                        bumps_used: 1
                    });
                }

                await pb.collection('profiles').update(profile.id, {
                    last_bump_at: new Date().toISOString()
                });

                console.log(`Successfully bumped ${profile.id}.`);
            } else {
                const nextBumpIn = Math.round((intervalMs - (now - lastBump)) / 1000 / 60);
                console.log(`Profile ${profile.id} needs to wait ${nextBumpIn} more minutes for next auto-bump.`);
            }
        }

    } catch (err) {
        console.error('Auto-Bump Error:', err);
    } finally {
        releaseLock();
    }
}

// Run once or in a loop
if (process.argv.includes('--loop')) {
    console.log('Running in loop mode (every 5 minutes)...');
    runAutoBump();
    setInterval(runAutoBump, 5 * 60 * 1000);
} else {
    runAutoBump();
}

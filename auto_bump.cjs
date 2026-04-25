
const fs = require('fs');
const PocketBase = require('pocketbase/cjs');

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'https://pocketbase.cerejavip.com';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);
const LOCK_FILE = '/tmp/cerejavip-auto-bump.lock';
const LOCK_STALE_MS = 15 * 60 * 1000; // 15 min

function todayBR() {
    const saoPauloOffsetMs = 3 * 60 * 60 * 1000;
    return new Date(Date.now() - saoPauloOffsetMs).toISOString().split('T')[0];
}

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

        // 1. Get all plans (campos mínimos)
        const plans = await pb.collection('plans').getFullList({
            fields: 'id,slug,daily_bumps'
        });
        const plansMap = new Map();
        for (const plan of plans) {
            if (plan.id) plansMap.set(plan.id, plan);
            if (plan.slug) plansMap.set(plan.slug, plan);
        }

        // 2. Get active profiles with auto bump enabled (campos mínimos para reduzir payload)
        const profiles = await pb.collection('profiles').getFullList({
            filter: 'status = "active" && auto_bump = true',
            sort: '-last_bump_at',
            fields: 'id,name,plan,last_bump_at,auto_bump'
        });

        console.log(`Found ${profiles.length} active profiles with auto-bump enabled.`);

        // Use the same Brazil/Sao_Paulo date used by the Next.js bump APIs.
        const today = todayBR();

        // 3. Pré-carrega bumps do dia para evitar N+1 queries.
        const dailyMap = new Map();
        try {
            const dailyRecords = await pb.collection('profile_daily_bumps').getFullList({
                filter: `date = "${today}"`,
                fields: 'id,profile,bumps_used'
            });
            for (const rec of dailyRecords) {
                if (rec.profile) dailyMap.set(rec.profile, rec);
            }
        } catch (e) {
            console.error('[AutoBump] Error preloading daily bumps:', e.message);
        }

        for (const profile of profiles) {
            const plan = plansMap.get(profile.plan);
            if (!plan || !plan.daily_bumps || plan.daily_bumps <= 0) {
                console.log(`Profile ${profile.id} has no valid plan for bumps (plan ref: ${profile.plan || 'empty'}).`);
                continue;
            }

            // 4. Check bumps used today
            const dailyBumpRecord = dailyMap.get(profile.id);

            const bumpsUsed = dailyBumpRecord ? dailyBumpRecord.bumps_used : 0;

            if (bumpsUsed >= plan.daily_bumps) {
                console.log(`Profile ${profile.id} already used all ${plan.daily_bumps} bumps for today.`);
                continue;
            }

            // 5. Check timing
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
                    dailyMap.set(profile.id, { ...dailyBumpRecord, bumps_used: bumpsUsed + 1 });
                } else {
                    const created = await pb.collection('profile_daily_bumps').create({
                        profile: profile.id,
                        date: today,
                        bumps_used: 1
                    });
                    dailyMap.set(profile.id, created);
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

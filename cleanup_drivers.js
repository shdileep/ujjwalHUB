/**
 * SAFE CLEANUP SCRIPT: Remove all drivers EXCEPT sekar (UHD13194)
 * 
 * Drivers to REMOVE:
 *   - UHA12987 (ritu)
 *   - UHA20651 (shivaji)
 *   - EMP-B7CAI (Unknown Driver)
 * 
 * Driver to KEEP (DO NOT TOUCH):
 *   - UHD13194 (sekar)
 * 
 * Nodes cleaned: drivers/, DriversHub/, LiveDriverStatus/, signup/, users/, driver/, leave/
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, remove } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8",
    storageBucket: "ujjwal-7a8c8.firebasestorage.app",
    messagingSenderId: "979504793146",
    appId: "1:979504793146:web:b37db5fbdd0712607ed703"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// SEKAR's ID — this driver MUST NOT be touched
const KEEP_ID = 'UHD13194';

// All nodes where driver data might exist
const DRIVER_NODES = [
    'drivers',
    'DriversHub',
    'LiveDriverStatus',
    'signup',
    'users',
    'driver',
    'leave'
];

async function cleanupDrivers() {
    console.log('─────────────────────────────────────────');
    console.log('🔒 SAFE DRIVER CLEANUP SCRIPT');
    console.log(`🛡️  PROTECTED DRIVER: ${KEEP_ID} (sekar)`);
    console.log('─────────────────────────────────────────\n');

    // STEP 1: Verify sekar exists BEFORE we do anything
    console.log('📋 STEP 1: Verifying sekar (UHD13194) exists...');
    const sekarSnapshot = await get(ref(database, `drivers/${KEEP_ID}`));
    if (sekarSnapshot.exists()) {
        const sekarData = sekarSnapshot.val();
        console.log(`   ✅ CONFIRMED: sekar found in drivers/ node`);
        console.log(`   📦 Data: username="${sekarData.username}", driverId="${sekarData.driverId || KEEP_ID}"`);
    } else {
        console.log(`   ⚠️  sekar NOT found in drivers/ node (may be in other nodes)`);
    }

    // STEP 2: For each node, list all entries and remove non-sekar ones
    console.log('\n📋 STEP 2: Scanning and cleaning nodes...\n');

    let totalRemoved = 0;
    let totalKept = 0;

    for (const nodeName of DRIVER_NODES) {
        console.log(`\n── Node: /${nodeName} ──`);
        const nodeRef = ref(database, nodeName);
        const snapshot = await get(nodeRef);

        if (!snapshot.exists()) {
            console.log(`   (empty — skipping)`);
            continue;
        }

        const entries = snapshot.val();
        const keys = Object.keys(entries);
        console.log(`   Found ${keys.length} entries`);

        for (const key of keys) {
            const entry = entries[key];
            const entryId = key;

            // Check if this is sekar by key, driverId, employeeId, or username
            const isSekar = (
                entryId === KEEP_ID ||
                entryId.toUpperCase() === KEEP_ID ||
                (entry && entry.driverId === KEEP_ID) ||
                (entry && entry.employeeId === KEEP_ID) ||
                (entry && (entry.driverId || '').toUpperCase() === KEEP_ID) ||
                (entry && (entry.employeeId || '').toUpperCase() === KEEP_ID) ||
                (entry && entry.username === 'sekar') ||
                (entry && entry.driverName === 'sekar') ||
                (entry && entry.personnelIdentity && entry.personnelIdentity.name === 'sekar')
            );

            if (isSekar) {
                console.log(`   🛡️  KEEPING: ${entryId} (sekar — PROTECTED)`);
                totalKept++;
            } else {
                // Get a display name for logging
                const displayName = entry?.username || entry?.driverName || entry?.personnelIdentity?.name || entry?.email || 'unknown';
                console.log(`   🗑️  REMOVING: ${entryId} (${displayName})`);
                await remove(ref(database, `${nodeName}/${entryId}`));
                totalRemoved++;
            }
        }
    }

    // STEP 3: Final verification — confirm sekar is still intact
    console.log('\n\n📋 STEP 3: POST-CLEANUP VERIFICATION...\n');

    for (const nodeName of DRIVER_NODES) {
        const nodeRef = ref(database, nodeName);
        const snapshot = await get(nodeRef);

        if (!snapshot.exists()) {
            console.log(`   /${nodeName}: (empty)`);
            continue;
        }

        const entries = snapshot.val();
        const keys = Object.keys(entries);
        console.log(`   /${nodeName}: ${keys.length} entries remaining → [${keys.join(', ')}]`);

        // Verify sekar is in there
        if (keys.includes(KEEP_ID)) {
            console.log(`   ✅ sekar (${KEEP_ID}) CONFIRMED present in /${nodeName}`);
        }
    }

    console.log('\n─────────────────────────────────────────');
    console.log(`✅ CLEANUP COMPLETE`);
    console.log(`   Removed: ${totalRemoved} entries`);
    console.log(`   Kept:    ${totalKept} entries (sekar)`);
    console.log('─────────────────────────────────────────');

    process.exit(0);
}

cleanupDrivers().catch(err => {
    console.error('❌ FATAL ERROR:', err);
    process.exit(1);
});

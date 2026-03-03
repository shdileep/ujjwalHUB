
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';
import fs from 'fs';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

const driverId = "UHD86418";
const hiddenUid = "uNMWzukriQPvaDjEc1xDAhF4Y4b2";
const email = "war@gmail.com";

async function finalNuke() {
    console.log(`🚀 FINAL PURGE for ${driverId} / ${hiddenUid}`);
    const updates = {};

    // 1. Wipe all possible UID locations
    updates[`users/${hiddenUid}`] = null;
    updates[`users/${driverId}`] = null;

    const sanitizedEmail = email.replace(/[.@]/g, '_');
    updates[`users/${sanitizedEmail}`] = null;

    // 2. Wipe standard IDs
    const nodes = ["drivers", "driver", "signup", "DriversHub", "LiveDriverStatus", "leave"];
    nodes.forEach(node => {
        updates[`${node}/${driverId}`] = null;
        updates[`${node}/${hiddenUid}`] = null;
    });

    // 3. Root wipe
    updates[driverId] = null;
    updates[hiddenUid] = null;

    // 4. Bins Wipe (Total removal as requested for Task Pro)
    try {
        const binsSnap = await get(ref(db, 'bins'));
        if (binsSnap.exists()) {
            const bins = binsSnap.val();
            Object.keys(bins).forEach(binId => {
                if (bins[binId].assignedDriverId === driverId || bins[binId].assignedDriverId === hiddenUid) {
                    updates[`bins/${binId}`] = null;
                }
            });
        }
    } catch (e) { }

    console.log("📦 Applying updates...");
    await update(ref(db), updates);
    console.log("✨ SUCCESS: Anwar S is permanently purged.");

    // 5. Run Cleanup Legacy Root
    const rootSnap = await get(ref(db));
    if (rootSnap.exists()) {
        const rootData = rootSnap.val();
        for (const [key, value] of Object.entries(rootData)) {
            if (key.startsWith('UHD') || key.startsWith('UHA')) {
                updates[key] = null;
                const isDriver = key.startsWith('UHD');
                const target = isDriver ? `driver/${key}` : `admin/${key}`;
                // Avoid re-creating Anwar
                if (key !== driverId) {
                    updates[target] = value;
                }
            }
        }
    }

    await update(ref(db), updates);
    console.log("🧹 Cleanup of other root nodes complete.");
    process.exit(0);
}

finalNuke().catch(console.error);

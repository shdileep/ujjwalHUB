
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
const emails = ["war@gmail.com"];

async function nuke() {
    let log = `🚀 Starting Nuke for ${driverId}\n`;

    // 1. Define paths to delete (set to null)
    const paths = [
        `users/${driverId}`,
        `drivers/${driverId}`,
        `driver/${driverId}`,
        `signup/${driverId}`,
        `DriversHub/${driverId}`,
        `LiveDriverStatus/${driverId}`,
        `leave/${driverId}`,
        driverId
    ];

    // Add sanitized emails
    emails.forEach(email => {
        const sanitized = email.replace(/[.@]/g, '_');
        paths.push(`users/${sanitized}`);
    });

    const updates = {};
    paths.forEach(p => {
        updates[p] = null;
    });

    // 2. Search for assignments in bins
    try {
        const binsSnap = await get(ref(db, 'bins'));
        if (binsSnap.exists()) {
            const bins = binsSnap.val();
            let unassignedCount = 0;
            Object.keys(bins).forEach(binId => {
                if (bins[binId].assignedDriverId === driverId) {
                    updates[`bins/${binId}/assignedDriverId`] = null;
                    unassignedCount++;
                }
            });
            log += `✅ Found ${unassignedCount} bins assigned.\n`;
        }
    } catch (e) {
        log += `⚠️ Bin search failed: ${e.message}\n`;
    }

    // 3. Search for leave requests
    try {
        const leavesSnap = await get(ref(db, 'leaves'));
        if (leavesSnap.exists()) {
            const leaves = leavesSnap.val();
            let leaveCount = 0;
            Object.keys(leaves).forEach(leaveId => {
                if (leaves[leaveId].driverId === driverId) {
                    updates[`leaves/${leaveId}`] = null;
                    leaveCount++;
                }
            });
            log += `✅ Found ${leaveCount} leave requests.\n`;
        }
    } catch (e) {
        log += `⚠️ Leave search failed: ${e.message}\n`;
    }

    // 4. Apply all deletions
    log += "📦 Applying permanent deletion...\n";
    await update(ref(db), updates);
    log += "✨ SUCCESS: Driver UHD86418 wiped.\n";

    fs.writeFileSync('nuke_result.txt', log);
    process.exit(0);
}

nuke().catch(err => {
    fs.writeFileSync('nuke_result.txt', `❌ FATAL ERROR: ${err.message}\n${err.stack}`);
    process.exit(1);
});

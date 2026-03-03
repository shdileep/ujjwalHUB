import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update } from 'firebase/database';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

import fs from 'fs';

function log(msg) {
    console.log(msg);
    fs.appendFileSync('force.log', msg + '\n');
}

async function forceNodes() {
    if (fs.existsSync('force.log')) fs.unlinkSync('force.log');
    log("Fetching existing data...");

    // 1. Fetch Drivers
    const driversSnap = await get(ref(db, 'drivers'));
    const driversData = driversSnap.exists() ? driversSnap.val() : {};

    // 2. Fetch Users
    const usersSnap = await get(ref(db, 'users'));
    const usersData = usersSnap.exists() ? usersSnap.val() : {};

    // 3. Fetch Admins (might not exist yet)
    const adminsSnap = await get(ref(db, 'admins'));
    const adminsData = adminsSnap.exists() ? adminsSnap.val() : {};

    log(`Found ${Object.keys(driversData).length} drivers, ${Object.keys(usersData).length} users, ${Object.keys(adminsData).length} admins (plural).`);

    const updates = {};

    // Process Drivers
    for (const [id, data] of Object.entries(driversData)) {
        const driverId = data.driverId || id;
        log(`Preparing node for Driver: ${driverId}`);

        const nodeData = {
            driverId: driverId,
            employeeId: data.employeeId || driverId,
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            profilePhoto: data.profilePhoto || null,
            password: data.password || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'offline',
            isProfileComplete: data.isProfileComplete ?? true
        };
        updates[`driver/${driverId}`] = nodeData;

        // Also ensure signup record exists
        updates[`signup/${driverId}`] = {
            username: data.username || '',
            email: data.email || '',
            "phone num": data.phone || '',
            "selected area": data.location || '',
            password: data.password || '',
            driverId: driverId
        };
    }

    // Process Admins
    for (const [id, data] of Object.entries(adminsData)) {
        const adminId = data.adminId || id;
        log(`Preparing node for Admin: ${adminId}`);

        const nodeData = {
            adminId: adminId,
            employeeId: data.employeeId || adminId,
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            profilePhoto: data.profilePhoto || null,
            password: data.password || '',
            createdAt: data.createdAt || new Date().toISOString(),
            isProfileComplete: data.isProfileComplete ?? true
        };
        updates[`admin/${adminId}`] = nodeData;

        // Also ensure signup record exists
        updates[`signup/${adminId}`] = {
            username: data.username || '',
            email: data.email || '',
            "phone num": data.phone || '',
            "selected area": 'Chennai',
            password: data.password || '',
            driverId: adminId
        };
    }

    if (Object.keys(updates).length > 0) {
        log(`Pushing ${Object.keys(updates).length} updates to database...`);
        try {
            await update(ref(db), updates);
            log("SUCCESS: Nodes forced successfully.");
        } catch (err) {
            log("FAILED to update database: " + err.message);

            // Try individual sets if update fails
            log("Attempting individual sets...");
            for (const [path, val] of Object.entries(updates)) {
                try {
                    await set(ref(db, path), val);
                    log(`- Set ${path} success`);
                } catch (e) {
                    log(`- Set ${path} FAILED: ` + e.message);
                }
            }
        }
    } else {
        log("No data found to migrate.");
    }

    process.exit(0);
}

forceNodes().catch(err => {
    console.error(err);
    process.exit(1);
});

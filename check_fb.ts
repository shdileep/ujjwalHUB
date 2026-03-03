import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function check() {
    const uSnap = await get(ref(db, 'users'));
    const allUsers = uSnap.val() || {};
    console.log("USERS:");
    for (const [key, u] of Object.entries(allUsers)) {
        if ((u as any).location === 'Kandigai') {
            console.log(`Key: ${key}, Username: ${(u as any).username}, EmployeeID: ${(u as any).employeeId}, Role: ${(u as any).role}`);
        }
    }

    const dSnap = await get(ref(db, 'drivers'));
    const allDrivers = dSnap.val() || {};
    console.log("\nDRIVERS:");
    for (const [key, d] of Object.entries(allDrivers)) {
        if ((d as any).location === 'Kandigai' || (d as any).area === 'Kandigai') {
            console.log(`Key: ${key}, Username: ${(d as any).username}`);
        }
    }

    const bSnap = await get(ref(db, 'bins'));
    const allBins = Object.values(bSnap.val() || {}) as any[];
    console.log("\nBINS:");
    const kandigaiBins = allBins.filter(b => b.areaName === 'Kandigai' || b.locationName === 'Kandigai');
    console.log(`Found ${kandigaiBins.length} bins matching Kandigai. Sample:`, kandigaiBins.slice(0, 2).map(b => b.id));

    process.exit(0);
}

check().catch(console.error);

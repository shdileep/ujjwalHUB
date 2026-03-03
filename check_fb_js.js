const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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
        if (u.location === 'Kandigai') {
            console.log(`Key: ${key}, Username: ${u.username}, EmployeeID: ${u.employeeId}, Role: ${u.role}`);
        }
    }

    const dSnap = await get(ref(db, 'drivers'));
    const allDrivers = dSnap.val() || {};
    console.log("\nDRIVERS:");
    for (const [key, d] of Object.entries(allDrivers)) {
        if (d.location === 'Kandigai' || d.area === 'Kandigai') {
            console.log(`Key: ${key}, Username: ${d.username}`);
        }
    }

    const hSnap = await get(ref(db, 'DriversHub'));
    const allHub = hSnap.val() || {};
    console.log("\nDRIVERS HUB:");
    for (const [key, h] of Object.entries(allHub)) {
        if (h.driverId === "EMP-KAND" || (h.personnelIdentity && h.personnelIdentity.name && h.personnelIdentity.name.includes("Kandigai"))) {
            console.log(`Key: ${key}, Name: ${h.personnelIdentity?.name}`);
        }
    }

    const bSnap = await get(ref(db, 'bins'));
    const allBins = Object.values(bSnap.val() || {});
    console.log("\nBINS:");
    const kandigaiBins = allBins.filter(b => b.areaName === 'Kandigai' || b.locationName === 'Kandigai');
    console.log(`Found ${kandigaiBins.length} bins matching Kandigai. Sample:`, kandigaiBins.slice(0, 5).map(b => b.id));

    process.exit(0);
}

check().catch(console.error);

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

async function diagnose() {
    console.log("--- Firebase Diagnostics ---");

    try {
        const nodes = ['users', 'drivers', 'DriversHub', 'LiveDriverStatus'];
        const results = {};

        for (const node of nodes) {
            const snap = await get(ref(db, node));
            results[node] = snap.val();
            console.log(`Node: ${node}, Count: ${results[node] ? Object.keys(results[node]).length : 0}`);
        }

        console.log("\n--- Driver Details ---");
        const users = results.users || {};
        const driverUsers = Object.entries(users).filter(([id, u]) => u && u.role === 'driver');

        console.log(`Found ${driverUsers.length} users with role 'driver'`);

        driverUsers.forEach(([id, u]) => {
            console.log(`- User ID: ${id}`);
            console.log(`  Name: ${u.username}`);
            console.log(`  EmployeeId: ${u.employeeId}`);
            console.log(`  Location: ${u.location}`);
            console.log(`  isProfileComplete: ${u.isProfileComplete}`);

            const driverNode = (results.drivers || {})[u.employeeId] || (results.drivers || {})[id];
            console.log(`  Present in 'drivers' node: ${!!driverNode}`);
            if (driverNode) console.log(`  'drivers' Location: ${driverNode.location}`);

            const hubNode = (results.DriversHub || {})[u.employeeId] || (results.DriversHub || {})[id];
            console.log(`  Present in 'DriversHub' node: ${!!hubNode}`);
            if (hubNode) console.log(`  Hub Location: ${hubNode.personnelIdentity?.location}`);
        });

        console.log("\n--- Live Status ---");
        const live = results.LiveDriverStatus || {};
        Object.entries(live).forEach(([id, s]) => {
            console.log(`- Driver ID: ${id}, Name: ${s.driverName}, Status: ${s.status}, Location: ${s.location}`);
        });

    } catch (e) {
        console.error("Diagnostic error:", e);
    }
    process.exit(0);
}

diagnose().catch(console.error);

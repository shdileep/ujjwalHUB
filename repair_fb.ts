import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, set } from 'firebase/database';
import { KANDIGAI_BINS } from './constants/kandigaiData';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function inspectAndHeal() {
    console.log("Fetching users...");
    const uSnap = await get(ref(db, 'users'));
    const allUsers = Object.values(uSnap.val() || {});
    const kandigaiDrivers = allUsers.filter((u: any) => u.role === 'driver' && u.location === 'Kandigai');

    console.log(`Found ${kandigaiDrivers.length} Kandigai Drivers in users node.`);
    for (const d of kandigaiDrivers as any[]) {
        console.log(`- ${d.username} (${d.employeeId}), Profile Complete: ${d.isProfileComplete}`);

        // Force promote them to drivers node
        console.log(`Promoting ${d.employeeId} to drivers node...`);
        const driverData = {
            username: d.username,
            email: d.email,
            phone: d.phone,
            employeeId: d.employeeId,
            driverId: d.employeeId,
            status: 'offline',
            location: d.location || 'Kandigai',
            createdAt: new Date().toISOString()
        };
        await set(ref(db, `drivers/${d.employeeId}`), driverData);

        const hubData = {
            driverId: d.employeeId,
            personnelIdentity: {
                name: d.username,
                driverId: d.employeeId,
                phone: d.phone,
            },
            accountLifecycle: { status: 'Operational', color: 'green' },
            deployment: { tasksCompleted: 0 },
            availability: { status: 'offline' }
        };
        await set(ref(db, `DriversHub/${d.employeeId}`), hubData);
    }

    // Now fix Bins
    const bSnap = await get(ref(db, 'bins'));
    const allBins = Object.values(bSnap.val() || {}) as any[];
    console.log(`Total bins in DB: ${allBins.length}`);

    // Check if we already have the good KANDIGAI_BINS IDs (01, 02... 46)
    const KandigaiIds = Array.from({ length: 46 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const existingKandigaiBins = allBins.filter((b: any) => KandigaiIds.includes(b.id));
    console.log(`Found ${existingKandigaiBins.length} existing good Kandigai bins matching IDs 01-46`);

    console.log("Forcing Kandigai bins upload...");
    const updates: any = {};
    for (const b of KANDIGAI_BINS) {
        updates[b.id] = b;
    }
    await update(ref(db, 'bins'), updates);
    console.log("SUCCESS! All Kandigai Bins and Drivers healed.");
    process.exit(0);
}

inspectAndHeal().catch(e => {
    console.error(e);
    process.exit(1);
});

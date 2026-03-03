import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, get } from 'firebase/database';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function setup() {
    const dSnap = await get(ref(db, 'drivers'));
    const allDrivers = dSnap.val() || {};

    let kandigaiDriverId = null;
    let kandigaiDriver = null;

    for (const [key, d] of Object.entries(allDrivers)) {
        if ((d as any).location === 'Kandigai' || (d as any).area === 'Kandigai') {
            kandigaiDriverId = key;
            kandigaiDriver = d;
            break;
        }
    }

    if (!kandigaiDriverId) {
        console.log("No Kandigai driver found. Creating one...");
        const newId = "EMP-KAND" + Math.floor(Math.random() * 1000);
        kandigaiDriverId = newId;
        const driverData = {
            driverId: newId,
            employeeId: newId,
            email: "kandigai.driver@ujjwal.com",
            phone: "+91 9999900000",
            username: "Kandigai Driver One",
            status: "online",
            location: "Kandigai",
            isProfileComplete: true,
            role: "driver"
        };
        await update(ref(db, `users/${newId}`), driverData);
        await update(ref(db, `drivers/${newId}`), driverData);
        await update(ref(db, `DriversHub/${newId}`), {
            driverId: newId,
            personnelIdentity: {
                name: "Kandigai Driver One",
                driverId: newId,
                phone: "+91 9999900000"
            },
            accountLifecycle: { status: 'Operational' },
            availability: { status: 'online' },
            deployment: { tasksCompleted: 0 }
        });
        console.log("Created", newId);
    } else {
        console.log("Found Kandigai driver", kandigaiDriverId, kandigaiDriver);
        // Ensure location is correct in drivers node
        await update(ref(db, `drivers/${kandigaiDriverId}`), { location: 'Kandigai', status: 'online' });
        await update(ref(db, `users/${kandigaiDriverId}`), { location: 'Kandigai', role: 'driver', isProfileComplete: true });
        // Ensure present in DriversHub
        await update(ref(db, `DriversHub/${kandigaiDriverId}`), {
            driverId: kandigaiDriverId,
            personnelIdentity: {
                name: (kandigaiDriver as any).username || "Kandigai Driver One",
                driverId: kandigaiDriverId,
                phone: (kandigaiDriver as any).phone || "+91 0000000000"
            },
            accountLifecycle: { status: 'Operational' },
            availability: { status: 'online' },
            deployment: { tasksCompleted: 0 }
        });
        console.log("Updated", kandigaiDriverId);
    }
    process.exit(0);
}

setup().catch(console.error);

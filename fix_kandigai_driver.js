require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function fix() {
    try {
        console.log("Checking DB...");

        // 1. Check existing
        const uSnap = await get(ref(db, 'users'));
        const dSnap = await get(ref(db, 'drivers'));
        const hSnap = await get(ref(db, 'DriversHub'));

        let kandigaiDriverId = null;
        let kandigaiName = "Kandigai Driver Alpha";
        let kandigaiPhone = "+91 9999900000";

        const allDrivers = dSnap.val() || {};
        for (const [key, d] of Object.entries(allDrivers)) {
            if (d.location === 'Kandigai' || d.area === 'Kandigai' || d.username?.includes('Kandigai')) {
                kandigaiDriverId = key;
                kandigaiName = d.username || kandigaiName;
                kandigaiPhone = d.phone || kandigaiPhone;
                console.log("Found existing:", key);
                break;
            }
        }

        if (!kandigaiDriverId) {
            kandigaiDriverId = "EMP-KAND" + Date.now().toString().slice(-4);
            console.log("Creating NEW Kandigai Driver:", kandigaiDriverId);
        }

        const driverData = {
            driverId: kandigaiDriverId,
            employeeId: kandigaiDriverId,
            email: "kandigai.alpha@ujjwal.com",
            phone: kandigaiPhone,
            username: kandigaiName,
            status: "online",
            location: "Kandigai",
            isProfileComplete: true,
            role: "driver"
        };

        const hubData = {
            driverId: kandigaiDriverId,
            personnelIdentity: {
                name: kandigaiName,
                driverId: kandigaiDriverId,
                phone: kandigaiPhone,
                profilePhoto: null
            },
            accountLifecycle: { status: 'Operational', color: 'green' },
            availability: { status: 'online' },
            deployment: { tasksCompleted: 0 }
        };

        // ENFORCE ALL 3
        console.log("Updating all 3 collection paths...");
        await update(ref(db, `users/${kandigaiDriverId}`), driverData);
        await update(ref(db, `drivers/${kandigaiDriverId}`), driverData);
        await update(ref(db, `DriversHub/${kandigaiDriverId}`), hubData);

        console.log("SUCCESS. Kandigai Driver correctly configured.");

        process.exit(0);

    } catch (e) {
        console.error("Firebase fetch error", e);
        process.exit(1);
    }
}

fix();

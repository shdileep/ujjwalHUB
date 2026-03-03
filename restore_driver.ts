import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, set } from 'firebase/database';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);
const DRIVER_ID = 'UHD94797';

async function restore() {
    console.log(`Fetching signup data for ${DRIVER_ID}...`);

    try {
        const signupSnap = await get(ref(db, `signup/${DRIVER_ID}`));
        if (!signupSnap.exists()) {
            console.log(`Could not find signup data for ${DRIVER_ID}.`);
            process.exit(1);
        }

        const signupData = signupSnap.val();
        console.log("Found signup data:", JSON.stringify(signupData, null, 2));

        const driverUpdate: Record<string, any> = {
            username: signupData.username || "",
            email: signupData.email || "",
            phone: signupData["phone num"] || "",
            location: signupData["selected area"] || "",
            driverId: DRIVER_ID,
            employeeId: DRIVER_ID,
            role: "driver"
        };

        if (signupData.password) {
            driverUpdate.password = signupData.password;
        }

        console.log(`\nUpdating drivers/${DRIVER_ID} with:`, JSON.stringify(driverUpdate, null, 2));
        await update(ref(db, `drivers/${DRIVER_ID}`), driverUpdate);

        console.log(`Updating users/${DRIVER_ID} with the same data...`);
        await update(ref(db, `users/${DRIVER_ID}`), driverUpdate);

        console.log(`Updating DriversHub/${DRIVER_ID}...`);
        const hubUpdate = {
            driverId: DRIVER_ID,
            personnelIdentity: {
                name: signupData.username || "",
                driverId: DRIVER_ID,
                phone: signupData["phone num"] || "",
                location: signupData["selected area"] || ""
            }
        };
        await update(ref(db, `DriversHub/${DRIVER_ID}`), hubUpdate);

        console.log("\nSuccess! Data restored.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

restore().catch(console.error);

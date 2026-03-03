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
    console.log("Checking database...");
    let dSnap;
    try {
        dSnap = await get(ref(db, 'drivers/UHD94797'));
        console.log("DRIVER UHD94797 from drivers node:", JSON.stringify(dSnap.val(), null, 2));
    } catch (e) { console.error(e); }

    try {
        const uSnap = await get(ref(db, 'users'));
        const users = uSnap.val() || {};
        const matches = Object.entries(users).filter(([k, v]: any) => v.employeeId === 'UHD94797' || k.includes('UHD94797'));
        console.log("\nUSERS matching UHD94797:", JSON.stringify(matches, null, 2));
    } catch (e) { console.error(e); }

    try {
        const signupSnap = await get(ref(db, 'signup/UHD94797'));
        console.log("\nSIGNUP UHD94797:", JSON.stringify(signupSnap.val(), null, 2));
    } catch (e) { console.error(e); }

    try {
        const hubSnap = await get(ref(db, 'DriversHub/UHD94797'));
        console.log("\nDRIVERS HUB UHD94797:", JSON.stringify(hubSnap.val(), null, 2));
    } catch (e) { console.error(e); }

    process.exit(0);
}

check().catch(console.error);

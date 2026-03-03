import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import fs from 'fs';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function check() {
    let output = "Checking database...\n";
    let dSnap;
    try {
        dSnap = await get(ref(db, 'drivers/UHD94797'));
        output += "DRIVER UHD94797 from drivers node:\n" + JSON.stringify(dSnap.val(), null, 2) + "\n";
    } catch (e) { output += "Error: " + e.message + "\n"; }

    try {
        const uSnap = await get(ref(db, 'users'));
        const users = uSnap.val() || {};
        const matches = Object.entries(users).filter(([k, v]) => (v && v.employeeId === 'UHD94797') || k.includes('UHD94797'));
        output += "\nUSERS matching UHD94797:\n" + JSON.stringify(matches, null, 2) + "\n";
    } catch (e) { output += "Error: " + e.message + "\n"; }

    try {
        const signupSnap = await get(ref(db, 'signup/UHD94797'));
        output += "\nSIGNUP UHD94797:\n" + JSON.stringify(signupSnap.val(), null, 2) + "\n";
    } catch (e) { output += "Error: " + e.message + "\n"; }

    try {
        const hubSnap = await get(ref(db, 'DriversHub/UHD94797'));
        output += "\nDRIVERS HUB UHD94797:\n" + JSON.stringify(hubSnap.val(), null, 2) + "\n";
    } catch (e) { output += "Error: " + e.message + "\n"; }

    try {
        const driversSnap = await get(ref(db, 'drivers'));
        const allDrivers = driversSnap.val() || {};
        const matchedDriversNode = Object.entries(allDrivers).filter(([k, v]) => k.includes('UHD94797') || (v && v.employeeId === 'UHD94797'));
        output += "\nALL DRIVERS Node matching UHD94797:\n" + JSON.stringify(matchedDriversNode, null, 2) + "\n";
    } catch (e) { output += "Error: " + e.message + "\n"; }

    fs.writeFileSync('db_check_output.txt', output);
    process.exit(0);
}

check().catch(e => fs.writeFileSync('db_check_output.txt', "Global Error: " + e.message));

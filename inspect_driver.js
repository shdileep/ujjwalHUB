
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

const driverId = "UHD86418";

async function inspect() {
    const nodes = [`LiveDriverStatus/${driverId}`, `drivers/${driverId}`, `driver/${driverId}`, `signup/${driverId}`];
    const results = {};

    for (const node of nodes) {
        const snap = await get(ref(db, node));
        results[node] = snap.exists() ? snap.val() : "MISSING";
    }

    fs.writeFileSync('inspect_driver.json', JSON.stringify(results, null, 2));
    process.exit(0);
}

inspect().catch(console.error);

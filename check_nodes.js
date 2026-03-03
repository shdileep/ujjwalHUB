
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

async function checkNodes() {
    const nodes = ["LiveDriverStatus", "drivers", "driver", "signup", "users", "DriversHub", "binHistory"];
    const results = {};

    for (const node of nodes) {
        const snap = await get(ref(db, node));
        if (snap.exists()) {
            results[node] = Object.keys(snap.val());
        } else {
            results[node] = "MISSING";
        }
    }

    fs.writeFileSync('node_keys.json', JSON.stringify(results, null, 2));
    process.exit(0);
}

checkNodes().catch(console.error);

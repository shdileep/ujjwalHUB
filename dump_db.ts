import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import * as fs from 'fs';

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function checkAll() {
    console.log("Fetching all database nodes...");
    try {
        const snap = await get(ref(db, '/'));
        const data = snap.val();

        if (data) {
            console.log("Root nodes found:", Object.keys(data));

            // Look for any node containing our specific driver
            const results: any = {};
            const searchId = 'UHD94797';

            for (const [node, value] of Object.entries(data)) {
                if (typeof value === 'object' && value !== null) {
                    if ((value as any)[searchId]) {
                        results[`Found in ${node}/${searchId}`] = (value as any)[searchId];
                    }

                    // Also search deeper
                    for (const [subKey, subValue] of Object.entries(value)) {
                        if (typeof subValue === 'object' && subValue !== null) {
                            if (JSON.stringify(subValue).includes(searchId) || JSON.stringify(subValue).includes('phone num')) {
                                results[`Deep search match in ${node}/${subKey}`] = subValue;
                            }
                        }
                    }
                }
            }

            fs.writeFileSync('db_full_dump.json', JSON.stringify(results, null, 2));
            console.log("Saved findings to db_full_dump.json");

            if (data.users && data.users[searchId]) {
                console.log("Users node data for HD94797:", data.users[searchId]);
            }
        }
    } catch (e) {
        console.error("Error fetching db:", e);
    }
    process.exit(0);
}

checkAll();

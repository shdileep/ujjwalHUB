import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8",
    storageBucket: "ujjwal-7a8c8.firebasestorage.app",
    messagingSenderId: "979504793146",
    appId: "1:979504793146:web:b37db5fbdd0712607ed703",
    measurementId: "G-K8TWFF4XLC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkNodes() {
    console.log("Checking what's actually in your database...\n");

    // Check drivers node
    try {
        const driversSnap = await get(ref(db, 'drivers/UHD94797'));
        console.log("==== drivers/UHD94797 ====");
        if (driversSnap.exists()) {
            console.log(JSON.stringify(driversSnap.val(), null, 2));
        } else {
            console.log("Node does not exist!");
        }
    } catch (e) {
        console.log("Error reading drivers:", e.message);
    }

    console.log("\n---------------------------\n");

    // Check users node
    try {
        const usersSnap = await get(ref(db, 'users'));
        console.log("==== users node ====");
        if (usersSnap.exists()) {
            const users = usersSnap.val();
            let foundUHD = false;

            // Search by key
            if (users['UHD94797']) {
                console.log("Found explicitly at 'users/UHD94797':");
                console.log(JSON.stringify(users['UHD94797'], null, 2));
                foundUHD = true;
            }

            // Search by contents (in case key is an email/uid instead)
            if (!foundUHD) {
                console.log("Not found by exact key 'UHD94797', doing deep search...");
                for (const [key, value] of Object.entries(users)) {
                    const strVal = JSON.stringify(value);
                    if (strVal.includes('UHD94797') || strVal.includes('username')) {
                        console.log(`\nPotential match found at key '${key}':`);
                        console.log(JSON.stringify(value, null, 2));
                    }
                }
            }
        } else {
            console.log("Users node does not exist or is empty!");
        }
    } catch (e) {
        console.log("Error reading users:", e.message);
    }

    process.exit(0);
}

checkNodes();

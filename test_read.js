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

async function test() {
    console.log("Testing read of /drivers...");
    try {
        const snap = await get(ref(db, 'drivers'));
        console.log("Snap exists:", snap.exists());
        if (snap.exists()) {
            console.log("Data keys:", Object.keys(snap.val()));
        }
    } catch (err) {
        console.error("READ ERROR:", err.message);
    }
    process.exit(0);
}

test();

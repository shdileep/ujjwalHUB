
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

const driverId = "UHD86418";

async function check() {
    const snap = await get(ref(db, `drivers/${driverId}`));
    if (snap.exists()) {
        console.log("❌ Driver still exists in /drivers");
    } else {
        console.log("✅ Driver gone from /drivers");
    }
    process.exit(0);
}

check().catch(console.error);

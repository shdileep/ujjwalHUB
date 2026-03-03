
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

async function inspectMore() {
    const results = {};

    // 1. TaskPro
    const taskSnap = await get(ref(db, 'TaskPro'));
    results.TaskPro = taskSnap.exists() ? taskSnap.val() : "MISSING";

    // 2. Users (all values to find UHD86418)
    const userSnap = await get(ref(db, 'users'));
    results.users = userSnap.exists() ? userSnap.val() : "MISSING";

    fs.writeFileSync('inspect_more.json', JSON.stringify(results, null, 2));
    process.exit(0);
}

inspectMore().catch(console.error);

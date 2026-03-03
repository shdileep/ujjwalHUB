
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

const targets = ["UHD86418", "war@gmail.com"];

async function scan() {
    console.log("📥 Fetching root database snapshot...");
    const snap = await get(ref(db));
    if (!snap.exists()) {
        console.log("Empty database.");
        process.exit(0);
    }

    const data = snap.val();
    const results = [];

    function traverse(obj, path = "") {
        if (typeof obj === 'string') {
            if (targets.some(t => obj.includes(t))) {
                results.push({ path, value: obj });
            }
        } else if (targets.some(t => path.includes(t))) {
            results.push({ path, value: "[Key Match]" });
        }

        if (obj !== null && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                traverse(obj[key], path ? `${path}/${key}` : key);
            });
        }
    }

    traverse(data);

    if (results.length > 0) {
        console.log(`❌ Found ${results.length} matches:`);
        results.forEach(r => console.log(`- ${r.path}: ${r.value}`));
        fs.writeFileSync('scan_results.txt', JSON.stringify(results, null, 2));
    } else {
        console.log("✅ No matches found in the entire database.");
    }
    process.exit(0);
}

scan().catch(console.error);

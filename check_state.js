const { database } = require('./firebase.config.js'); // Assuming you have a CJS version or we can just fetch via REST

const https = require('https');

function fetchFirebase(path) {
    return new Promise((resolve, reject) => {
        https.get(`https://ujjwal-7a8c8-default-rtdb.firebaseio.com/${path}.json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function check() {
    const bins = await fetchFirebase('bins');
    if (!bins) {
        console.log("NO BINS IN DB!");
        return;
    }

    const binValues = Object.values(bins);
    console.log(`Total Bins in DB: ${binValues.length}`);

    const kandigaiBins = binValues.filter(b => b.areaName && b.areaName.toLowerCase() === 'kandigai');
    console.log(`Total Kandigai Bins: ${kandigaiBins.length}`);
    if (kandigaiBins.length > 0) {
        console.log("Sample Kandigai Bin:");
        console.log(kandigaiBins[0]);
    }

    // Also check users
    const users = await fetchFirebase('users');
    console.log(`Total Users: ${Object.values(users || {}).length}`);
    const admins = Object.values(users || {}).filter(u => u.role === 'admin' || u.role === 'superadmin');
    console.log("Admins:");
    admins.forEach(a => {
        console.log(`- ${a.email} | Location: ${a.location}`);
    });
}

check();

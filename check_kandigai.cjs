
const fs = require('fs');
const path = require('path');
const https = require('https');

function getEnv() {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
    return env;
}

const env = getEnv();
const dbUrl = env.VITE_FIREBASE_DATABASE_URL;

function getFromDb(node) {
    return new Promise((resolve, reject) => {
        https.get(`${dbUrl}/${node}.json`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function checkKandigai() {
    console.log("Connect to:", dbUrl);

    const bins = await getFromDb('bins') || {};
    const drivers = await getFromDb('drivers') || {};

    const kandigaiDrivers = Object.values(drivers).filter(d =>
        (d.location || "").toLowerCase() === "kandigai" ||
        (d.assignedZone || "").toLowerCase().includes("kandigai")
    );

    console.log("\n--- Kandigai Drivers ---");
    kandigaiDrivers.forEach(d => {
        console.log(`ID: ${d.driverId}, Name: ${d.username}, Status: ${d.status}, Zone: ${d.assignedZone}`);
    });

    const kandigaiBins = Object.values(bins).filter(b =>
        (b.areaName || "").toLowerCase() === "kandigai" ||
        (b.locationName || "").toLowerCase() === "kandigai"
    );

    console.log(`\n--- Kandigai Bins (${kandigaiBins.length}) ---`);

    const statusCounts = {};
    const assignmentCounts = {};

    kandigaiBins.forEach(b => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
        const dId = b.assignedDriverId || "Unassigned";
        assignmentCounts[dId] = (assignmentCounts[dId] || 0) + 1;

        // Print if it's a "task" (Full/Half Full)
        if (b.status === 'Full' || b.status === 'Half Full' || b.status === 'Half-Full') {
            // console.log(`Bin ${b.id}: Status=${b.status}, AssignedTo=${b.assignedDriverId}`);
        }
    });

    console.log("\nStatus Summary:", statusCounts);
    console.log("Assignment Summary:", assignmentCounts);

    const taskBins = kandigaiBins.filter(b =>
        b.status === 'Full' || b.status === 'Half Full' || b.status === 'Half-Full'
    );
    console.log(`\nTotal Tasks (Full/Half): ${taskBins.length}`);
}

checkKandigai().catch(console.error);

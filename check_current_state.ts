import https from 'https';

// --- CONFIGURATION ---
const DB_URL = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com";
const TARGET_LOCATION = "kandigai";

/**
 * Fetches data from Firebase Realtime Database using the REST API.
 */
function fetchDb(node: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(`${DB_URL}/${node}.json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response from ${node}: ${e}`));
                }
            });
        }).on('error', reject);
    });
}

async function runDiagnostic() {
    console.log(`\n🔍 --- DIAGNOSTIC: ${TARGET_LOCATION.toUpperCase()} TASK COUNT ---`);
    console.log(`Connecting to: ${DB_URL}\n`);

    try {
        const binsData = await fetchDb('bins');
        if (!binsData) {
            console.log("❌ No bins found in database.");
            return;
        }

        const allBins = Object.values(binsData) as any[];
        console.log(`📊 Total Bins in DB: ${allBins.length}`);

        // --- FILTERING LOGIC (Mirrors AdminOverview.tsx) ---
        const kandigaiBins = allBins.filter(b => {
            const bArea = (b.areaName || '').toLowerCase();
            const bLoc = (b.locationName || '').toLowerCase();
            const adminLocNormalized = TARGET_LOCATION.toLowerCase();

            // Logic from AdminOverview.tsx:
            // return bArea === 'kandigai' || bLoc === 'kandigai' || ['melakottaiyur', 'nallambakkam'].includes(bLoc);
            return bArea === adminLocNormalized ||
                bLoc === adminLocNormalized ||
                ['melakottaiyur', 'nallambakkam'].includes(bLoc);
        });

        console.log(`📍 Bins matching '${TARGET_LOCATION}': ${kandigaiBins.length}`);

        // --- TASK STATUS LOGIC (Mirrors AdminOverview.tsx) ---
        const taskBins = kandigaiBins.filter(b => {
            const status = b.status;
            // Logic from AdminOverview.tsx:
            // b.status === 'Full' || b.status === 'Half-Full' || b.status === 'Half Full'
            return status === 'Full' || status === 'Half-Full' || status === 'Half Full';
        });

        const completedBins = kandigaiBins.filter(b => b.status === 'Completed');

        console.log(`✅ Tasks Found (Full/Half Full): ${taskBins.length}`);
        console.log(`🏁 Tasks Resolved (Completed): ${completedBins.length}`);

        if (taskBins.length !== 29 && taskBins.length !== 35) {
            console.log(`\n⚠️  The count ${taskBins.length} matches neither reported value (29 or 35).`);
        } else {
            console.log(`\n✨ Found ${taskBins.length} tasks.`);
        }

        // --- DETAILED BREAKDOWN ---
        console.log("\n--- DETAILED BREAKDOWN OF TASK BINS ---");
        console.log("ID".padEnd(10), "| Status".padEnd(12), "| Area".padEnd(20), "| Location");
        console.log("-".repeat(60));

        taskBins.forEach(b => {
            console.log(
                (b.id || "N/A").padEnd(10),
                `| ${b.status}`.padEnd(12),
                `| ${b.areaName || "N/A"}`.padEnd(20),
                `| ${b.locationName || "N/A"}`
            );
        });

        // --- CHECKING FOR "HIDDEN" KANDIGAI BINS ---
        const otherBins = allBins.filter(b => !kandigaiBins.includes(b));
        const nearKandigai = otherBins.filter(b => {
            const str = JSON.stringify(b).toLowerCase();
            return str.includes('kandigai') || str.includes('melakottaiyur') || str.includes('nallambakkam');
        });

        if (nearKandigai.length > 0) {
            console.log(`\n🧐 Found ${nearKandigai.length} bins that might belong to Kandigai but didn't match the filter:`);
            nearKandigai.forEach(b => {
                console.log(`- ID: ${b.id}, Area: ${b.areaName}, Location: ${b.locationName}, Status: ${b.status}`);
            });
        }

    } catch (error) {
        console.error("❌ Diagnostic Failed:", error);
    }
}

runDiagnostic();

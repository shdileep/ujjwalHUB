const https = require('https');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const DB_URL = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com";
const OUTPUT_FILE = path.join(__dirname, 'diag_results.txt');

let logContent = '';
function log(msg) {
    console.log(msg);
    logContent += msg + '\n';
}

function fetchRaw(path) {
    return new Promise((resolve, reject) => {
        https.get(`${DB_URL}/${path}.json?shallow=true`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response from ${path}: ${e}`));
                }
            });
        }).on('error', reject);
    });
}

function fetchFull(path) {
    return new Promise((resolve, reject) => {
        https.get(`${DB_URL}/${path}.json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response from ${path}: ${e}`));
                }
            });
        }).on('error', reject);
    });
}

async function runDiagnostic() {
    log(`\n🔍 --- DATABASE ROOT INSPECTION ---`);
    log(`Connecting to: ${DB_URL}\n`);

    try {
        const rootKeys = await fetchRaw('');
        log(`📂 Root Nodes: ${Object.keys(rootKeys || {}).join(', ')}`);

        const binsShallow = await fetchRaw('bins');
        const binKeys = Object.keys(binsShallow || {});
        log(`📊 'bins' Node - Total Keys: ${binKeys.length}`);
        if (binKeys.length > 0) {
            log(`Sample Keys: ${binKeys.slice(0, 5).join(', ')}`);
        }

        const binsData = await fetchFull('bins');
        const allBins = Object.values(binsData || {});

        log(`\n📍 Bins matching 'kandigai':`);
        const kandigaiBins = allBins.filter(b => {
            const bArea = (b.areaName || '').toLowerCase();
            const bLoc = (b.locationName || '').toLowerCase();
            return bArea === 'kandigai' || bLoc === 'kandigai' || ['melakottaiyur', 'nallambakkam'].includes(bLoc);
        });

        log(`Count: ${kandigaiBins.length}`);

        if (kandigaiBins.length === 0 && allBins.length > 0) {
            log(`\nSample Bin Structure (First 1):`);
            log(JSON.stringify(allBins[0], null, 2));
        }

        // Check for 'admins' and 'drivers'
        const drivers = await fetchRaw('drivers');
        log(`\n🏎️ 'drivers' Node - Total Keys: ${Object.keys(drivers || {}).length}`);

        fs.writeFileSync(OUTPUT_FILE, logContent);
        log(`\n📝 Results written to ${OUTPUT_FILE}`);

    } catch (error) {
        log(`❌ Diagnostic Failed: ${error.message}`);
        fs.writeFileSync(OUTPUT_FILE, logContent);
    }
}

runDiagnostic();

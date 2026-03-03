
const fs = require('fs');
const path = require('path');

const LOG_FILE = 'c:/ujjwal/analysis_log.txt';
const CSV_FILE = 'c:/ujjwal/chennai_bins_with_status.csv';

function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

try {
    if (!fs.existsSync(CSV_FILE)) {
        log(`ERROR: File not found: ${CSV_FILE}`);
        process.exit(1);
    }

    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n');
    log(`Total Lines: ${lines.length}`);

    if (lines.length < 1) {
        log("ERROR: Empty file");
        process.exit(1);
    }

    const headers = lines[0].split(',');
    const areaIdx = headers.findIndex(h => h.trim() === 'AREA_NAME');
    const locIdx = headers.findIndex(h => h.trim() === 'LOC_NAME');

    log(`Headers: ${headers.join(',')}`);
    log(`AREA_NAME index: ${areaIdx}, LOC_NAME index: ${locIdx}`);

    const uniqueAreas = new Set();
    let alandurCount = 0;

    // Sample a few rows
    log("First 5 rows analysis:");
    for (let i = 1; i < Math.min(6, lines.length); i++) {
        log(`Row ${i}: ${lines[i]}`);
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV split (naive)
        const parts = line.split(',');

        if (areaIdx !== -1 && parts[areaIdx]) {
            uniqueAreas.add(parts[areaIdx].trim());
        }

        if (locIdx !== -1 && parts[locIdx]) {
            const loc = parts[locIdx].trim().toLowerCase();
            if (loc.includes('alandur')) {
                alandurCount++;
            }
        }
    }

    log(`Unique AREA_NAMEs: ${Array.from(uniqueAreas).join(', ')}`);
    log(`Rows with 'alandur' in LOC_NAME: ${alandurCount}`);

} catch (err) {
    log(`CRITICAL ERROR: ${err.message}\n${err.stack}`);
    process.exit(1);
}

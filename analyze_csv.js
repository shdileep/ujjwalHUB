
const fs = require('fs');

const content = fs.readFileSync('chennai_bins_with_status.csv', 'utf8');
const lines = content.split('\n');
console.log(`Total Lines: ${lines.length}`);

const headers = lines[0].split(',');
const areaIdx = headers.indexOf('AREA_NAME');
const locIdx = headers.indexOf('LOC_NAME');

console.log(`AREA_NAME index: ${areaIdx}, LOC_NAME index: ${locIdx}`);

const areas = new Set();
const guindyMatches = [];
const alandurMatches = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple split (might break on quoted commas but good for quick check)
    // The previous script used a robust parser, let's just peek raw or use simple split first
    const parts = line.split(',');

    if (parts.length > areaIdx) {
        const area = parts[areaIdx] ? parts[areaIdx].trim() : '';
        const loc = parts[locIdx] ? parts[locIdx].trim() : '';

        if (area) areas.add(area);

        if (loc.toLowerCase().includes('alandur')) {
            alandurMatches.push({ area, loc });
        }
    }
}

console.log("Unique AREA_NAMEs:", Array.from(areas));
console.log(`Rows with 'Alandur' in LOC_NAME: ${alandurMatches.length}`);
if (alandurMatches.length > 0) {
    console.log("Sample Alandur Matches:", alandurMatches.slice(0, 5));
}

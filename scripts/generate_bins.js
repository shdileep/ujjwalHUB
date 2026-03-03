
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const MAPPING_CSV = 'c:\\ujjwal\\chennai_ujjwal_areas_summary.csv';
const BIN_CSVS = [
    'c:\\ujjwal\\chennai_bins_with_status.csv',
    'c:\\ujjwal\\chengalpattu_bins_restructured.csv',
    'c:\\ujjwal\\adambakkam_bins.csv'
];
const OUTPUT_BINS_TS = 'c:\\ujjwal\\constants\\chennaiBins.ts';
const OUTPUT_AREAS_TS = 'c:\\ujjwal\\constants\\areas.ts';

// --- HELPERS ---

// Robust CSV Line Parser
const parseCSV = (content) => {
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (inQuotes) {
            if (char === '"') {
                if (content[i + 1] === '"') { // Escaped quote
                    currentVal += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentVal.trim());
                currentVal = '';
            } else if (char === '\n' || char === '\r') {
                if (currentVal || currentRow.length > 0) {
                    currentRow.push(currentVal.trim());
                    rows.push(currentRow);
                    currentRow = [];
                    currentVal = '';
                }
                // Skip consecutive newlines
                if (char === '\r' && content[i + 1] === '\n') i++;
            } else {
                currentVal += char;
            }
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
    }
    return rows;
};

// --- DATA STRUCTURES ---
const areaMapping = new Map(); // "Original Area" -> "Ujjwal Area"
const ujjwalAreas = new Map(); // "Ujjwal Area" -> Set("Original Areas")
const ujjwalAreaStats = new Map(); // "Ujjwal Area" -> Count

// --- STEP 1: READ MAPPING ---
console.log(`Reading Mapping from: ${MAPPING_CSV}`);
if (fs.existsSync(MAPPING_CSV)) {
    const content = fs.readFileSync(MAPPING_CSV, 'utf8');
    const rows = parseCSV(content);

    rows.forEach((row, idx) => {
        if (idx === 0) return;
        if (row.length < 4) return;

        const ujjwalArea = row[1].trim();
        const componentsRaw = row[3];

        if (!ujjwalArea || ujjwalArea.toUpperCase() === 'TOTAL') return;

        const components = componentsRaw.split(',').map(c => c.trim()).filter(c => c);

        if (!ujjwalAreas.has(ujjwalArea)) {
            ujjwalAreas.set(ujjwalArea, new Set());
            ujjwalAreaStats.set(ujjwalArea, 0);
        }

        components.forEach(comp => {
            const normalizedComp = comp.toUpperCase();
            areaMapping.set(normalizedComp, ujjwalArea);
            ujjwalAreas.get(ujjwalArea).add(comp);
        });
    });

    console.log(`Loaded ${ujjwalAreas.size} Ujjwal Areas mapping ${areaMapping.size} sub-areas.`);
} else {
    console.error("CRITICAL: Mapping file not found!");
    process.exit(1);
}

// --- STEP 2: PROCESS BINS ---
const bins = [];
const processedIds = new Set(); // Track unique IDs
let matchedCount = 0;
let unmatchedCount = 0;
let duplicateCount = 0;

BIN_CSVS.forEach(csvPath => {
    if (!fs.existsSync(csvPath)) return;
    console.log(`Processing Bins: ${csvPath}`);

    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);

    if (rows.length < 2 && !csvPath.includes('adambakkam')) return;

    // Special Handling for Adambakkam (Headless)
    if (csvPath.includes('adambakkam')) {
        console.log("  -> Detected Adambakkam Headless CSV. Using hardcoded mapping.");

        rows.forEach(row => {
            if (row.length < 8) return;

            // Mapping based on analysis:
            // 0: ID, 3: Area, 4: Loc, 5: Street, 7: Lat, 8: Lng, 11: Status
            const originalArea = row[3] || 'Adambakkam';
            const specificLoc = row[4] || 'Adambakkam';
            const street = row[5] || 'Unknown Street';
            const lat = parseFloat(row[7]);
            const lng = parseFloat(row[8]);
            const statusRaw = row[11] || 'Empty';

            // Normalize Status
            let status = 'Empty';
            if (statusRaw.toLowerCase().includes('full')) status = 'Full';
            else if (statusRaw.toLowerCase().includes('half')) status = 'Half Full';

            // Area Cleanup
            let finalAreaName = 'Adambakkam';
            if (areaMapping.has(originalArea.toUpperCase())) {
                finalAreaName = areaMapping.get(originalArea.toUpperCase());
            }

            // Stats
            matchedCount++;
            const current = ujjwalAreaStats.get(finalAreaName) || 0;
            ujjwalAreaStats.set(finalAreaName, current + 1);

            // ID Generation
            let baseId = (row[0] || `Bin-${Math.random().toString(36).substr(2, 9)}`).trim();
            // Ensure ID uniqueness
            let uniqueId = baseId;
            let counter = 1;
            while (processedIds.has(uniqueId)) {
                uniqueId = `${baseId}_${counter}`;
                counter++;
            }
            if (uniqueId !== baseId) duplicateCount++;
            processedIds.add(uniqueId);

            bins.push({
                id: uniqueId,
                locationName: specificLoc,
                areaName: finalAreaName, // Should ensure this maps to "Adambakkam"
                streetName: street,
                coordinates: { lat, lng },
                status: status
            });
        });
        return; // Skip standard processing for this file
    }

    const headers = rows[0].map(h => h.toUpperCase());

    const getIdx = (candidates) => {
        for (const c of candidates) {
            const i = headers.indexOf(c);
            if (i !== -1) return i;
        }
        return -1;
    };

    const idxLocName = getIdx(['LOC_NAME', 'LOCATION']);
    const idxAreaName = getIdx(['AREA_NAME', 'ZONE_NAME', 'AREA']);
    const idxStreet = getIdx(['STREET_NAM', 'STREET_NAME', 'STREET']);
    const idxLat = getIdx(['LATITUDE', 'LAT']);
    const idxLng = getIdx(['LONGTITUDE', 'LONGITUDE', 'LNG']); // Fixed spelling to match input CSVs if needed
    const idxStatus = getIdx(['BIN_STATUS', 'STATUS']);
    const idxBinNo = getIdx(['BIN_NO']);
    const idxObjId = getIdx(['OBJECTID', 'ID']);

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length * 0.5) continue;

        const originalArea = row[idxAreaName] ? row[idxAreaName].trim() : '';
        const specificLoc = row[idxLocName] ? row[idxLocName].trim() : '';

        let finalAreaName = 'Unknown Area';
        let isMatched = false;

        // 1. Check Specific Location (LOC_NAME)
        if (specificLoc) {
            const normalizedLoc = specificLoc.toUpperCase();
            if (areaMapping.has(normalizedLoc)) {
                finalAreaName = areaMapping.get(normalizedLoc);
                isMatched = true;
            }
        }

        // 2. Check Area Name (AREA_NAME) if not matched
        if (!isMatched && originalArea) {
            const normalized = originalArea.toUpperCase();
            if (areaMapping.has(normalized)) {
                finalAreaName = areaMapping.get(normalized);
                isMatched = true;
            }
        }

        // Stats & Fallback
        if (isMatched) {
            matchedCount++;
            const current = ujjwalAreaStats.get(finalAreaName) || 0;
            ujjwalAreaStats.set(finalAreaName, current + 1);
        } else {
            unmatchedCount++;
            if (originalArea) finalAreaName = "Others (" + originalArea + ")";
        }

        // ID Generation & De-duplication
        let baseId = (row[idxBinNo] || row[idxObjId] || `Bin-${Math.random().toString(36).substr(2, 9)}`).trim();
        let uniqueId = baseId;
        let counter = 1;

        while (processedIds.has(uniqueId)) {
            uniqueId = `${baseId}_${counter}`;
            counter++;
        }

        if (uniqueId !== baseId) duplicateCount++;
        processedIds.add(uniqueId);

        bins.push({
            id: uniqueId,
            locationName: specificLoc || originalArea,
            areaName: finalAreaName,
            streetName: row[idxStreet] || 'Unknown Street',
            coordinates: {
                lat: parseFloat(row[idxLat] || 0),
                lng: parseFloat(row[idxLng] || 0)
            },
            status: (row[idxStatus] || 'Empty') === 'Full' ? 'Full' :
                (row[idxStatus] || '').toLowerCase() === 'half full' ? 'Half Full' : 'Empty'
        });
    }
});

console.log(`Matched: ${matchedCount}, Unmatched: ${unmatchedCount}`);
console.log(`Duplicates Resolved: ${duplicateCount}`);
console.log(`Total Bins Generated: ${bins.length}`);

// --- STEP 3: WRITE OUTPUTS ---

const sortedUjjwalAreas = Array.from(ujjwalAreas.keys()).sort();
const areaComponentMapping = {};
sortedUjjwalAreas.forEach(area => {
    areaComponentMapping[area] = Array.from(ujjwalAreas.get(area)).sort();
});

const areasContent = `
export const CHENNAI_AREAS = ${JSON.stringify(sortedUjjwalAreas, null, 4)};

export const AREA_COMPONENT_MAPPING: Record<string, string[]> = ${JSON.stringify(areaComponentMapping, null, 4)};
`;

fs.writeFileSync(OUTPUT_AREAS_TS, areasContent);
console.log(`Updated ${OUTPUT_AREAS_TS}`);

const binsContent = `import { Bin } from '../types';

export const CHENNAI_BINS_DATA: Bin[] = ${JSON.stringify(bins, null, 2)};
`;

fs.writeFileSync(OUTPUT_BINS_TS, binsContent);
console.log(`Updated ${OUTPUT_BINS_TS}`);

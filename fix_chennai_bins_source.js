
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'constants/chennaiBins.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Extract the array content
// Assuming format: export const CHENNAI_BINS_DATA: Bin[] = [ ... ];
const startIndex = fileContent.indexOf('[');
const endIndex = fileContent.lastIndexOf('];');

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not parse CHENNAI_BINS_DATA array');
    process.exit(1);
}

const arrayString = fileContent.substring(startIndex, endIndex + 1);

// We need to evaluate this string to get the object, 
// but it might contain TS types or unquoted keys which JSON.parse won't like.
// However, looking at the file view, keys are quoted "id", "locationName".
// Let's try flexible parsing or just eval (safe enough here since it's our file).
let data;
try {
    // Basic cleanup for eval if needed
    data = eval(arrayString);
} catch (e) {
    console.error('Eval failed, trying to sanitize and parse JSON...');
    try {
        // Replace single quotes with double, remote trailing commas? 
        // Actually, let's just use strict regex filtering if eval fails.
        // But eval should work for standard JS array syntax.
        throw e;
    } catch (e2) {
        console.error('Parsing failed:', e2);
        process.exit(1);
    }
}

console.log(`Loaded ${data.length} bins.`);

// 1. FILTER OUT GHOSTS (Adyar/Besant with ID 01/02)
const cleanData = data.filter(b => {
    const id = b.id;
    const area = (b.areaName || '').toUpperCase();
    const loc = (b.locationName || '').toUpperCase();

    // Ghost Check
    if ((id === '01' || id === '02' || id === '1' || id === '2')) {
        if (area.includes('ADYAR') || area.includes('BESANT') ||
            loc.includes('ADYAR') || loc.includes('BESANT')) {
            console.log(`👻 DELETING GHOST: ID ${id} - ${b.areaName} / ${b.locationName}`);
            return false;
        }
    }
    return true;
});

// 2. RENUMBER ADAMBAKKAM
const otherBins = cleanData.filter(b => {
    const area = (b.areaName || '').toUpperCase();
    const loc = (b.locationName || '').toUpperCase();
    return !area.includes('ADAMBAKKAM') && !loc.includes('ADAMBAKKAM');
});

const adambakkamBins = cleanData.filter(b => {
    const area = (b.areaName || '').toUpperCase();
    const loc = (b.locationName || '').toUpperCase();
    return area.includes('ADAMBAKKAM') || loc.includes('ADAMBAKKAM');
});

console.log(`Found ${adambakkamBins.length} Adambakkam bins. Renumbering...`);

const renumberedAdambakkam = adambakkamBins.map((b, index) => {
    return {
        ...b,
        id: (index + 1).toString().padStart(2, '0'),
        // Enforce casing as per successful v15 logic
        areaName: 'ADAMBAKKAM',
        locationName: b.locationName || 'ADAMBAKKAM',
        streetName: b.streetName || 'ADAMBAKKAM STREET'
    };
});

// 3. COMBINE
const finalData = [...renumberedAdambakkam, ...otherBins];

console.log(`Final count: ${finalData.length}`);

// 4. WRITE BACK
const newFileContent = `import { Bin } from '../types';

export const CHENNAI_BINS_DATA: Bin[] = ${JSON.stringify(finalData, null, 2)};
`;

fs.writeFileSync(filePath, newFileContent, 'utf8');
console.log('✅ Successfully rewrote chennaiBins.ts with clean data!');

const https = require('https');
const fs = require('fs');

https.get('https://ujjwal-7a8c8-default-rtdb.firebaseio.com/bins.json', (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const bins = JSON.parse(data || '{}');
            const vals = Object.values(bins);
            fs.writeFileSync('c:\\ujjwal\\bins_dump.json', JSON.stringify(vals, null, 2));
            console.log(`Total Bins written: ${vals.length}`);
        } catch (e) {
            console.error("Error parsing JSON ", e.message);
        }
    });
}).on('error', (e) => {
    console.error(e.message);
});

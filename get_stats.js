const https = require('https');
const fs = require('fs');

https.get('https://ujjwal-7a8c8-default-rtdb.firebaseio.com/bins.json', (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const bins = JSON.parse(data || '{}');
            const arr = Object.values(bins);
            const kandigai = arr.filter(b => b && b.areaName && b.areaName.toLowerCase() === 'kandigai');
            const out = `Total: ${arr.length}\nKandigai: ${kandigai.length}\nSample: ${JSON.stringify(arr.slice(0, 2))}`;
            fs.writeFileSync('c:\\ujjwal\\db_summary.txt', out);
        } catch (e) {
            fs.writeFileSync('c:\\ujjwal\\db_summary.txt', "Error parsing JSON " + e.message);
        }
    });
}).on('error', (e) => {
    fs.writeFileSync('c:\\ujjwal\\db_summary.txt', e.message);
});

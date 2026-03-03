const https = require('https');
const fs = require('fs');

https.get('https://ujjwal-7a8c8-default-rtdb.firebaseio.com/bins.json', (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        fs.writeFileSync('db_check.json', data);
        console.log("Written to db_check.json");
    });
}).on('error', (e) => {
    fs.writeFileSync('db_check_err.txt', e.message);
});

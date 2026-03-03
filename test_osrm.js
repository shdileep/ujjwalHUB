const fetch = require('node-fetch');
const kandigaiBins = require('./constants/kandigaiData').KANDIGAI_BINS;

async function test() {
    const driverLocation = { lat: 12.827, lng: 80.219 }; // SSV Branch 3 Siruseri approx
    const dumpYard = { lat: 12.9229, lng: 80.1274 }; // Tambaram MSW

    let sortedBins = [...kandigaiBins].sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    const coords = [
        [driverLocation.lng, driverLocation.lat],
        ...sortedBins.map(b => [b.coordinates.lng, b.coordinates.lat]),
        [dumpYard.lng, dumpYard.lat]
    ];

    const url = `https://router.project-osrm.org/route/v1/driving/${coords.map(c => c.join(',')).join(';')}?overview=full&geometries=geojson`;
    console.log("URL Length:", url.length);
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
            console.log("Distance:", data.routes[0].distance / 1000, "km");
            console.log("Duration:", data.routes[0].duration / 60, "min");
        } else {
            console.log("Error:", data);
        }
    } catch (e) {
        console.error(e);
    }
}
test();

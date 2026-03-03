const fetch = require('node-fetch');

async function test() {
    const tomtomKey = "R36n4bX7brfTY1mPFh5Vhwt5sFZ1I8F6";

    const driver = { lng: 80.0880, lat: 12.9020 };
    const dump = { lng: 80.1274, lat: 12.9229 };
    const bin1 = { lng: 80.147045, lat: 12.851268 };
    const bin2 = { lng: 80.144675, lat: 12.855117 };

    const rawCoords = [
        [driver.lng, driver.lat],
        [bin1.lng, bin1.lat],
        [bin2.lng, bin2.lat],
        [dump.lng, dump.lat]
    ];

    const locationsString = rawCoords.map(c => `${c[0]},${c[1]}`).join(':');

    try {
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${locationsString}/json?key=${tomtomKey}&computeBestOrder=true&routeType=fastest&traffic=true`;
        console.log("URL:", url);
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.log("API Error:", data.error);
        } else if (data.routes && data.routes[0]) {
            console.log("Success! Distance:", data.routes[0].summary.lengthInMeters);
        } else {
            console.log("Unknown Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();

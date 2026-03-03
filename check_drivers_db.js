const admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.database();

async function checkDrivers() {
    console.log("Checking Drivers Node...");
    const driversRef = db.ref('drivers');
    const dSnap = await driversRef.once('value');
    const drivers = dSnap.val() || {};

    Object.keys(drivers).forEach(k => {
        console.log(`Driver ID: ${k} | Name: ${drivers[k].username} | Loc: ${drivers[k].location}`);
    });

    console.log("\nChecking Users Node...");
    const usersRef = db.ref('users');
    const uSnap = await usersRef.once('value');
    const users = uSnap.val() || {};
    let c = 0;
    Object.keys(users).forEach(k => {
        if (users[k].role === 'driver') {
            c++;
            console.log(`User ID: ${k} | Name: ${users[k].username} | Loc: ${users[k].location}`);
        }
    });
    console.log(`Found ${c} driver users`);

    process.exit(0);
}

checkDrivers();

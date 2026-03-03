import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, set } from 'firebase/database';
import { KANDIGAI_BINS } from './constants/kandigaiData.js'; // Will need to compile this or duplicate it

const config = {
    apiKey: "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: "ujjwal-7a8c8"
};

const app = initializeApp(config);
const db = getDatabase(app);

async function inspectAndHeal() {
    console.log("Fetching users...");
    const uSnap = await get(ref(db, 'users'));
    const allUsers = Object.values(uSnap.val() || {});
    const kandigaiDrivers = allUsers.filter(u => u.role === 'driver' && u.location === 'Kandigai');

    console.log(`Found ${kandigaiDrivers.length} Kandigai Drivers in users node.`);
    for (const d of kandigaiDrivers) {
        console.log(`- ${d.username} (${d.employeeId}), Profile Complete: ${d.isProfileComplete}`);

        // Force promote them to drivers node
        console.log(`Promoting ${d.employeeId} to drivers node...`);
        const driverData = {
            username: d.username,
            email: d.email,
            phone: d.phone,
            employeeId: d.employeeId,
            driverId: d.employeeId,
            status: 'offline',
            location: d.location || 'Kandigai',
            createdAt: new Date().toISOString()
        };
        await set(ref(db, `drivers/${d.employeeId}`), driverData);

        const hubData = {
            driverId: d.employeeId,
            personnelIdentity: {
                name: d.username,
                driverId: d.employeeId,
                phone: d.phone,
            },
            accountLifecycle: { status: 'Operational', color: 'green' },
            deployment: { tasksCompleted: 0 },
            availability: { status: 'offline' }
        };
        await set(ref(db, `DriversHub/${d.employeeId}`), hubData);
    }

    // Now fix Bins
    const bSnap = await get(ref(db, 'bins'));
    const allBins = Object.values(bSnap.val() || {});
    console.log(`Total bins in DB: ${allBins.length}`);

    // Check if we already have the good KANDIGAI_BINS IDs (01, 02... 46)
    const KandigaiIds = Array.from({ length: 46 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const existingKandigaiBins = allBins.filter(b => KandigaiIds.includes(b.id));
    console.log(`Found ${existingKandigaiBins.length} existing good Kandigai bins matching IDs 01-46`);

    // We will just execute a forceful update of bins using KANDIGAI_BINS from frontend hardcoded here to avoid import issues
    const KANDIGAI_BINS_RAW = [
        { id: '01', locationName: 'Melakottaiyur', streetName: 'Keelakottiyur Internal Road, Near Sri Kala Bhairavar Temple', coordinates: { lat: 12.835723, lng: 80.153990 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '02', locationName: 'Nallambakkam', streetName: 'Nallambakkam Village Main Road (Centre)', coordinates: { lat: 12.854896, lng: 80.144878 }, status: 'Full', areaName: 'Kandigai' },
        { id: '03', locationName: 'Melakottaiyur', streetName: 'SRS Avenue Internal Road, Melakottaiyur', coordinates: { lat: 12.848691, lng: 80.150012 }, status: 'Full', areaName: 'Kandigai' },
        { id: '04', locationName: 'Melakottaiyur', streetName: 'St. Joseph\'s Church Road, Melakottaiyur', coordinates: { lat: 12.846240, lng: 80.149335 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '05', locationName: 'Nallambakkam', streetName: 'Nallambakkam Village Entry Road (Kelambakkam–Vandalur Rd Junction)', coordinates: { lat: 12.851120, lng: 80.147019 }, status: 'Full', areaName: 'Kandigai' },
        { id: '06', locationName: 'Nallambakkam', streetName: 'Nallambakkam Mid-Village East Road (Temple–Panchayat Lane)', coordinates: { lat: 12.848156, lng: 80.127900 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '07', locationName: 'Nallambakkam', streetName: 'Rattinamangalam Road (South Spur), Near Nallambakkam Lake', coordinates: { lat: 12.832879, lng: 80.131210 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '08', locationName: 'Nallambakkam', streetName: 'Pillayar Kovil Street, Nallambakkam', coordinates: { lat: 12.841673, lng: 80.122984 }, status: 'Full', areaName: 'Kandigai' },
        { id: '09', locationName: 'Melakottaiyur', streetName: 'Nellikuppam Road, Near Tamil Nadu Police Quarters', coordinates: { lat: 12.835560, lng: 80.140036 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '10', locationName: 'Kandigai', streetName: 'Kelambakkam–Vandalur Road, Near Hi-Way Snacks', coordinates: { lat: 12.849888, lng: 80.141199 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '11', locationName: 'Melakottaiyur', streetName: 'Kelambakkam–Vandalur Road, Near Sri Meghanatheswarar Temple (opp VIT)', coordinates: { lat: 12.841978, lng: 80.147314 }, status: 'Full', areaName: 'Kandigai' },
        { id: '12', locationName: 'Kandigai', streetName: 'Vengadamangalam Road, Near Latha Store (No.32)', coordinates: { lat: 12.857308, lng: 80.143703 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '13', locationName: 'Kandigai', streetName: 'Vengadamangalam Road, Vijayshanthi Park Avenue Gate', coordinates: { lat: 12.852284, lng: 80.141034 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '14', locationName: 'Nallambakkam', streetName: 'Nallambakkam Temple Road, Near Swarna Lingeshwarar Temple', coordinates: { lat: 12.848556, lng: 80.123437 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '15', locationName: 'Melakottaiyur', streetName: 'Kelambakkam–Vandalur Road, Near Rialto Enterprises (Survey No.100/2)', coordinates: { lat: 12.842929, lng: 80.150856 }, status: 'Full', areaName: 'Kandigai' },
        { id: '16', locationName: 'Kandigai', streetName: 'Kelambakkam–Vandalur Road, Kandigai Bus Stop', coordinates: { lat: 12.850950, lng: 80.140221 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '17', locationName: 'Melakottaiyur', streetName: 'Kelambakkam–Vandalur Road, Near Chai Drips Cafe (No.27, Keelakottaiyur)', coordinates: { lat: 12.835340, lng: 80.156326 }, status: 'Full', areaName: 'Kandigai' },
        { id: '18', locationName: 'Melakottaiyur', streetName: 'Muthumariamman Kovil Street, Near Muthumari Amman Temple', coordinates: { lat: 12.847790, lng: 80.139567 }, status: 'Full', areaName: 'Kandigai' },
        { id: '19', locationName: 'Melakottaiyur', streetName: 'Melakottaiyur Lake Street (Near Lake Road Junction)', coordinates: { lat: 12.838417, lng: 80.142077 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '20', locationName: 'Nallambakkam', streetName: 'Rattinamangalam–Nallambakkam Road, Near Unihomes 2 Apartments', coordinates: { lat: 12.836678, lng: 80.128394 }, status: 'Full', areaName: 'Kandigai' },
        { id: '21', locationName: 'Nallambakkam', streetName: 'Vengadamangalam Road, Near Nallambakkam North Entry', coordinates: { lat: 12.858359, lng: 80.143830 }, status: 'Full', areaName: 'Kandigai' },
        { id: '22', locationName: 'Kandigai', streetName: 'Boulevard Vijayshanthi Internal Colony Road', coordinates: { lat: 12.853308, lng: 80.142322 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '23', locationName: 'Kandigai', streetName: 'Sri Ganapathy Nagar Street, Kandigai (Near Bio Septic Workshop)', coordinates: { lat: 12.842524, lng: 80.136751 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '24', locationName: 'Kandigai', streetName: 'Water Tank Road, Kandigai (Near Overhead Water Tank)', coordinates: { lat: 12.846313, lng: 80.148255 }, status: 'Full', areaName: 'Kandigai' },
        { id: '25', locationName: 'Nallambakkam', streetName: 'Vengadamangalam Road, South of Perumal Temple Junction', coordinates: { lat: 12.863142, lng: 80.152747 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '26', locationName: 'Nallambakkam', streetName: 'Panchayat Office Road, Nallambakkam', coordinates: { lat: 12.844873, lng: 80.124890 }, status: 'Full', areaName: 'Kandigai' },
        { id: '27', locationName: 'Kandigai', streetName: 'Thulukanathamman Kovil Street, Near Ambika Super Market (No.187)', coordinates: { lat: 12.850215, lng: 80.141118 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '28', locationName: 'Melakottaiyur', streetName: 'Nellikuppam Road, Near MAS Pharmacy (No.318)', coordinates: { lat: 12.848564, lng: 80.142162 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '29', locationName: 'Nallambakkam', streetName: 'Nallambakkam West Internal Road (Near Quarry Access Road)', coordinates: { lat: 12.845884, lng: 80.119677 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '30', locationName: 'Nallambakkam', streetName: 'Nallambakkam Village School Road (South Village)', coordinates: { lat: 12.843317, lng: 80.125666 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '31', locationName: 'Nallambakkam', streetName: 'Krishna Nagar Street, Near Vengadamangalam Perumal Temple', coordinates: { lat: 12.863941, lng: 80.154889 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '32', locationName: 'Melakottaiyur', streetName: 'Vengadamangalam Road fork, Near Vegai Vanam Forest Area', coordinates: { lat: 12.858921, lng: 80.148929 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '33', locationName: 'Nallambakkam', streetName: 'Vengadamangalam Main Road, Near Rehoboth Stores', coordinates: { lat: 12.865143, lng: 80.149093 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '34', locationName: 'Melakottaiyur', streetName: 'Bajanai Kovil Street, Near Melakottaiyur AG Church', coordinates: { lat: 12.848723, lng: 80.149942 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '35', locationName: 'Kandigai', streetName: 'Vengadamangalam Road, Near Pawar Electricals (No.30)', coordinates: { lat: 12.857540, lng: 80.143335 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '36', locationName: 'Melakottaiyur', streetName: 'Mosque Street (Nellikuppam Salai), Near Melakottaiyur Masjid (No.84)', coordinates: { lat: 12.847155, lng: 80.141544 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '37', locationName: 'Kandigai', streetName: 'Vijayshanthi Adjacent Lane, Near Siva Fish Tank Service', coordinates: { lat: 12.852179, lng: 80.140841 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '38', locationName: 'Kandigai', streetName: 'Vengadamangalam Road, Near KA.TEX Clothing (No.1/1)', coordinates: { lat: 12.852439, lng: 80.141195 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '39', locationName: 'Melakottaiyur', streetName: 'Kelambakkam–Vandalur Road, Melakottaiyur Bus Stop', coordinates: { lat: 12.845436, lng: 80.149021 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '40', locationName: 'Kandigai', streetName: 'Munu Adhi Nagar Road, Near Tagore Medical College', coordinates: { lat: 12.854067, lng: 80.137844 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '41', locationName: 'Kandigai', streetName: 'Kelambakkam–Vandalur Road, Near Melakottaiyur Sub-Post Office', coordinates: { lat: 12.850979, lng: 80.140351 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '42', locationName: 'Melakottaiyur', streetName: 'Kelambakkam–Vandalur Road, Near Krishna Super Market (No.398)', coordinates: { lat: 12.849478, lng: 80.141445 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '43', locationName: 'Nallambakkam', streetName: 'Vengadamangalam Road, Near Bus Terminus', coordinates: { lat: 12.866544, lng: 80.159100 }, status: 'Empty', areaName: 'Kandigai' },
        { id: '44', locationName: 'Kandigai', streetName: 'Thulukanathamman Kovil Street, Near Kathir Hospital Junction', coordinates: { lat: 12.849382, lng: 80.141730 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '45', locationName: 'Melakottaiyur', streetName: 'Pillaiyar Koil Street, Near Poliyamman Temple (No.24)', coordinates: { lat: 12.843263, lng: 80.147510 }, status: 'Half-Full', areaName: 'Kandigai' },
        { id: '46', locationName: 'Kandigai', streetName: 'Arohana Avenue Internal Road (R4XP+MQ3)', coordinates: { lat: 12.849238, lng: 80.137170 }, status: 'Full', areaName: 'Kandigai' }
    ];

    console.log("Forcing Kandigai bins upload...");
    const updates = {};
    for (const b of KANDIGAI_BINS_RAW) {
        updates[b.id] = b;
    }
    await update(ref(db, 'bins'), updates);
    console.log("SUCCESS! All Kandigai Bins and Drivers healed.");
    process.exit(0);
}

inspectAndHeal().catch(console.error);

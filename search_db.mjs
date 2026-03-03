import fs from 'fs';

async function checkDb() {
    let output = "";
    try {
        output += "Fetching database root...\n";
        const response = await fetch("https://ujjwal-7a8c8-default-rtdb.firebaseio.com/.json");
        const data = await response.json();

        output += "--- ROOT KEYS ---\n";
        output += Object.keys(data).join(", ") + "\n";

        let found = false;
        output += "\n--- SEARCHING FOR UHD94797 & phone num ---\n";

        function searchObj(obj, path = "") {
            if (!obj || typeof obj !== "object") return;

            for (const key in obj) {
                const value = obj[key];
                const currentPath = path ? `${path}/${key}` : key;

                if (key === "UHD94797" || (value && value.driverId === 'UHD94797')) {
                    output += `\nMatch at ${currentPath}:\n`;
                    output += JSON.stringify(value, null, 2) + "\n";
                    found = true;
                }

                if (typeof value === "object" && value !== null) {
                    if (value["phone num"] || value["selected area"] || value["username"]) {
                        output += `\nFound driver-like data at ${currentPath}:\n`;
                        output += JSON.stringify(value, null, 2).substring(0, 300) + '...\n';
                        found = true;
                    } else {
                        searchObj(value, currentPath);
                    }
                }
            }
        }

        searchObj(data);
        if (!found) output += "\nNo matching data found in the entire database.\n";

    } catch (e) {
        output += "Error: " + e + "\n";
    }
    fs.writeFileSync('db_search.txt', output, 'utf8');
}

checkDb();

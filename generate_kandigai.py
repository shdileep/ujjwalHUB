import csv
import json
import os

out = []
with open('c:/ujjwal/VIT_bins.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        s_no = int(row['S. No.'])
        id_str = f"K_{s_no:03d}"
        
        bin_obj = {
            "id": id_str,
            "locationName": row['Area'],
            "streetName": row['Street / Road Location'],
            "coordinates": {
                "lat": float(row['Latitude']),
                "lng": float(row['Longitude'])
            },
            "status": row['Bin Status'],
            "areaName": "Kandigai"
        }
        out.append(bin_obj)

formatted = "import { Bin } from '../types';\n\nexport const KANDIGAI_BINS: Bin[] = [\n"
for b in out:
    formatted += f"    {{ id: '{b['id']}', locationName: {json.dumps(b['locationName'])}, streetName: {json.dumps(b['streetName'])}, coordinates: {{ lat: {b['coordinates']['lat']}, lng: {b['coordinates']['lng']} }}, status: '{b['status']}', areaName: 'Kandigai' }},\n"
formatted = formatted.rstrip(',\n') + "\n];\n"

existing_footer = """
export interface TrafficSignal {
    id: number;
    area: string;
    lat: number;
    lng: number;
}

export const KANDIGAI_TRAFFIC_SIGNALS: TrafficSignal[] = [
    { id: 1, area: 'Kelambakkam', lat: 12.785, lng: 80.2156 },
    { id: 2, area: 'Kelambakkam', lat: 12.79258, lng: 80.21567 },
    { id: 3, area: 'Kelambakkam', lat: 12.78987, lng: 80.22161 },
    { id: 4, area: 'Kelambakkam', lat: 12.78478, lng: 80.21087 },
    { id: 5, area: 'Kelambakkam', lat: 12.8012, lng: 80.228 },
    { id: 6, area: 'Mambakkam', lat: 12.8276, lng: 80.1649 },
    { id: 7, area: 'Vengambakkam', lat: 12.86276, lng: 80.12663 },
    { id: 8, area: 'Kolapakkam', lat: 12.87063, lng: 80.10668 },
    { id: 9, area: 'Perungalathur', lat: 12.90618, lng: 80.0964 },
    { id: 10, area: 'Perungalathur', lat: 12.9098, lng: 80.0945 },
    { id: 11, area: 'Perungalathur', lat: 12.9125, lng: 80.092 },
    { id: 12, area: 'Vandalur', lat: 12.88079, lng: 80.08041 },
    { id: 13, area: 'Vandalur', lat: 12.878, lng: 80.0785 },
    { id: 14, area: 'Vandalur', lat: 12.8797, lng: 80.08035 },
    { id: 15, area: 'Tambaram', lat: 12.9276, lng: 80.11788 },
    { id: 16, area: 'Tambaram', lat: 12.92579, lng: 80.11789 },
    { id: 17, area: 'Tambaram', lat: 12.92336, lng: 80.12073 },
    { id: 18, area: 'Tambaram', lat: 12.92591, lng: 80.11562 },
    { id: 19, area: 'Tambaram', lat: 12.93446, lng: 80.10076 }
];

export const MSW_DUMP_YARD = {
    name: 'MSW Dump Yard',
    address: 'Mariyamman Kovil St, Rajmoham Nagar, Tambaram',
    coordinates: { lat: 12.9276, lng: 80.11788 }
};
"""

with open('c:/ujjwal/constants/kandigaiData.ts', 'w', encoding='utf-8') as f:
    f.write(formatted + existing_footer)
print("Updated KANDIGAI_BINS.")


raw_data = """
1	Kandigai	80.0074	13.187231	Full
2	Kandigai	80.010571	13.1814	Full
3	Kandigai	80.017827	13.188784	Full
4	Kandigai	80.008391	13.191275	Full
5	Kandigai	80.007477	13.183751	Half Full
6	Kandigai	80.015086	13.180498	Empty
7	Kandigai	80.010181	13.177425	Full
8	Kandigai	80.015719	13.187398	Full
9	Kandigai	80.016428	13.180527	Half Full
10	Kandigai	80.007104	13.189951	Half Full
11	Kandigai	80.01817	13.189893	Half Full
12	Nallambakkam	80.174488	12.917444	Full
13	Nallambakkam	80.177386	12.927315	Half Full
14	Nallambakkam	80.173547	12.913484	Empty
15	Nallambakkam	80.18166	12.92556	Full
16	Nallambakkam	80.183676	12.924914	Full
17	Nallambakkam	80.18757	12.92058	Empty
18	Nallambakkam	80.180833	12.918057	Full
19	Nallambakkam	80.181896	12.92527	Empty
20	Nallambakkam	80.181238	12.925787	Empty
21	Nallambakkam	80.172733	12.923273	Half Full
22	Nallambakkam	80.17663	12.915646	Empty
23	Kolapakkam	80.105725	12.923277	Empty
24	Kolapakkam	80.106448	12.923616	Half Full
25	Kolapakkam	80.107837	12.932171	Full
26	Kolapakkam	80.105352	12.927923	Full
27	Kolapakkam	80.116986	12.926272	Full
28	Kolapakkam	80.111746	12.932369	Empty
29	Kolapakkam	80.113666	12.924738	Full
30	Kolapakkam	80.108071	12.924614	Full
31	Kolapakkam	80.11224	12.937832	Full
32	Kolapakkam	80.112954	12.930911	Empty
33	Kolapakkam	80.114416	12.935486	Half Full
34	Unamancheri	80.132514	12.885665	Full
35	Unamancheri	80.136284	12.887047	Half Full
36	Unamancheri	80.147087	12.885376	Full
37	Unamancheri	80.137035	12.896022	Full
38	Unamancheri	80.13833	12.892487	Full
39	Unamancheri	80.139342	12.896633	Full
40	Unamancheri	80.135946	12.886238	Full
41	Unamancheri	80.136204	12.890982	Half Full
42	Unamancheri	80.146365	12.891353	Half Full
43	Unamancheri	80.135509	12.88839	Full
"""

import json

bins = []
lines = raw_data.strip().split('\n')
for line in lines:
    # Handle tabs or multiple spaces by splitting on whitespace
    parts = line.split()
    if len(parts) >= 5:
        # 0: S.NO
        # 1: Area
        # 2: Longitude
        # 3: Latitude
        # 4+: Status
        
        s_no = parts[0].strip()
        area = parts[1].strip()
        lng = float(parts[2].strip())
        lat = float(parts[3].strip())
        status = " ".join(parts[4:]).strip()
        
        bin_obj = {
            "id": f"WCP_{s_no.zfill(2)}",
            "areaName": "West Chengalpattu",
            "locationName": area,
            "streetName": f"{area} Street {s_no}",
            "coordinates": { "lat": lat, "lng": lng },
            "status": status
        }
        bins.append(bin_obj)


output_content = "import { Bin } from '../types';\n\n"
output_content += "export const WEST_CHENGALPATTU_BINS: Bin[] = " + json.dumps(bins, indent=2) + ";\n"

with open(r'c:\ujjwal\constants\westChengalpattuBins.ts', 'w', encoding='utf-8') as f:
    f.write(output_content)
print("Successfully wrote to c:\\ujjwal\\constants\\westChengalpattuBins.ts")


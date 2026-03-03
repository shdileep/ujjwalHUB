import urllib.request
import json
import traceback

with open('c:\\ujjwal\\bins_py_dump.json', 'w') as f:
    try:
        url = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com/bins.json"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if not data:
                f.write("DB IS EMPTY/NULL\n")
            else:
                f.write(json.dumps(data, indent=2))
        print("Success")
    except Exception as e:
        print("Error:")
        traceback.print_exc(file=f)

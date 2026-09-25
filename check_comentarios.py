import os
import requests

with open('.env', 'r') as f:
    env = dict(line.strip().split('=', 1) for line in f if '=' in line)

URL = env['VITE_SUPABASE_URL'] + '/rest/v1/comentarios?limit=1'
KEY = env['VITE_SUPABASE_ANON_KEY']
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}'
}

resp = requests.get(URL, headers=HEADERS)
print(resp.status_code)
import json
print(json.dumps(resp.json(), indent=2))

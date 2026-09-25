import os
import requests

with open('.env', 'r') as f:
    env = dict(line.strip().split('=', 1) for line in f if '=' in line)

URL = env['VITE_SUPABASE_URL'] + '/rest/v1/columnas'
KEY = env['VITE_SUPABASE_ANON_KEY']
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

data = [
    {"nombre": "Archivado", "orden": 98},
    {"nombre": "Cancelado", "orden": 99},
    {"nombre": "Cancelado_Oculto", "orden": 100}
]

resp = requests.post(URL, headers=HEADERS, json=data)
print(resp.status_code)
print(resp.text)

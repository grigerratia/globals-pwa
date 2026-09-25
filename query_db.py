import requests, os, json

with open('.env', 'r') as f:
    env_vars = {}
    for line in f:
        if line.strip() and not line.startswith('#'):
            key, val = line.strip().split('=', 1)
            env_vars[key] = val

url = env_vars['VITE_SUPABASE_URL']
key = env_vars['VITE_SUPABASE_ANON_KEY']

headers = {
    'apikey': key,
    'Authorization': f"Bearer {key}"
}
res = requests.get(f"{url}/rest/v1/proyectos?select=*&limit=1", headers=headers)
print(json.dumps(res.json()[0], indent=2))

import requests, os, json
with open('.env', 'r') as f:
    env_vars = {}
    for line in f:
        if line.strip() and not line.startswith('#'):
            key, val = line.strip().split('=', 1)
            env_vars[key] = val

headers = {'apikey': env_vars['VITE_SUPABASE_ANON_KEY'], 'Authorization': f"Bearer {env_vars['VITE_SUPABASE_ANON_KEY']}"}
res = requests.get(f"{env_vars['VITE_SUPABASE_URL']}/rest/v1/comentarios?select=*&limit=1", headers=headers)
print(json.dumps(res.json(), indent=2))

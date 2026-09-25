import os
import requests

with open('.env', 'r') as f:
    env = dict(line.strip().split('=', 1) for line in f if '=' in line)

URL = env['VITE_SUPABASE_URL'] + '/rest/v1/rpc/add_retroceso_column'
KEY = env['VITE_SUPABASE_ANON_KEY']
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json'
}

# Wait, we can't run RPC if it doesn't exist. 
# We don't have SQL access directly via REST API unless we use the postgresql connection string.
# Is there a postgres connection string in .env? Let's check.

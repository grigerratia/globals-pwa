URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
curl -s -H "apikey: $KEY" -H "Authorization: Bearer $KEY" "$URL/rest/v1/proyectos?select=*&limit=1" | python3 -m json.tool

const res = await fetch("https://bsdnqvypannobvkjtcrg.supabase.co/rest/v1/proyectos?select=*&limit=1", {
  headers: { apikey: "sb_publishable_vovJomY4cbKUZkO3-IzIAg_lOC8oG98", Authorization: "Bearer sb_publishable_vovJomY4cbKUZkO3-IzIAg_lOC8oG98" }
});
const data = await res.json();
console.log(data);

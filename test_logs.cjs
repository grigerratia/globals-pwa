const { createClient } = require('@supabase/supabase-js');
const url = 'https://bsdnqvypannobvkjtcrg.supabase.co';
const key = 'sb_publishable_vovJomY4cbKUZkO3-IzIAg_lOC8oG98';
const supabase = createClient(url, key);

async function test() {
  const { data: logs, error } = await supabase.from('audit_logs')
        .select('*')
        .neq('accion', 'Inició sesión')
        .order('created_at', { ascending: false })
        .limit(10);
  console.log("Logs:", logs);
  console.log("Error:", error);
}
test();

const { createClient } = require('@supabase/supabase-js');
const url = 'https://bsdnqvypannobvkjtcrg.supabase.co';
const key = 'sb_publishable_vovJomY4cbKUZkO3-IzIAg_lOC8oG98'; // wait, the key format is weird, it's not a standard Supabase anon key, but I'll try it.
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Logs fetched:', data.length);
    console.log(data);
  }
}
test();

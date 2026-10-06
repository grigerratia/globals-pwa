const { createClient } = require('@supabase/supabase-js');
const url = 'https://bsdnqvypannobvkjtcrg.supabase.co';
const key = 'sb_publishable_vovJomY4cbKUZkO3-IzIAg_lOC8oG98';
const supabase = createClient(url, key);

async function test() {
  const { data: proys, error: err1 } = await supabase.from('proyectos').select('*').limit(1);
  if (err1) {
    console.log('Select Error:', err1);
    return;
  }
  if (proys && proys.length > 0) {
    const { error: err2 } = await supabase.from('proyectos').update({ titulo: proys[0].titulo }).eq('id', proys[0].id);
    console.log('Update Error (Anon):', err2);
  }
}
test();

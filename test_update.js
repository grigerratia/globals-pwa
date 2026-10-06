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
  console.log('Select successful. Data length:', proys?.length);
  if (proys && proys.length > 0) {
    console.log('Project sample:', proys[0]);
    // Try a dummy update without a JWT - it will probably fail with RLS, but if it's a schema error, it might say something else?
    const { error: err2 } = await supabase.from('proyectos').update({ titulo: proys[0].titulo }).eq('id', proys[0].id);
    console.log('Update Error (expected if RLS or Schema missing):', err2);
  }
}
test();

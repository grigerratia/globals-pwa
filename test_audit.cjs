const { createClient } = require('@supabase/supabase-js');
const url = 'https://bsdnqvypannobvkjtcrg.supabase.co';
const key = 'sb_publishable_vovJomY4cbKUZkO3-IzIAg_lOC8oG98';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('audit_logs').insert([{
      usuario_id: '123',
      usuario_nombre: 'test',
      accion: 'Test',
      detalles: {}
  }]);
  console.log('Insert Error:', error);
  
  const { data: logs, error: selectErr } = await supabase.from('audit_logs').select('*').limit(5);
  console.log('Select Logs:', logs?.length, 'Error:', selectErr);
}
test();

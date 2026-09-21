require('dotenv').config({ path: '../globals-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function run() {
  const { data, error } = await supabase.from('proyectos').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
run();

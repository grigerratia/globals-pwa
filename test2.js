import { supabase } from './src/supabaseClient.js';
async function run() {
  const { data, error } = await supabase.from('comentarios').select('*').limit(1);
  console.log(data);
}
run();

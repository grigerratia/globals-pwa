import { supabase } from './src/supabase.js';

async function run() {
  const { data, error } = await supabase.from('proyectos').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Columns:", Object.keys(data[0]));
  }
  process.exit(0);
}
run();

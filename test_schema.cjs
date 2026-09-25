const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=');
    return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .limit(1);
  console.log("Error:", error);
  if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
  }
}
run();

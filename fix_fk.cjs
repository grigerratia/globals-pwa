const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Upserting states into columnas to satisfy FK constraint...");
    const { data, error } = await supabase.from('columnas').upsert([
        { nombre: 'Archivado', orden: 98 },
        { nombre: 'Cancelado', orden: 99 },
        { nombre: 'Cancelado_Oculto', orden: 100 }
    ], { onConflict: 'nombre' });
    
    if (error) {
        console.error("Error upserting:", error);
    } else {
        console.log("Upsert successful!");
    }
}

main();

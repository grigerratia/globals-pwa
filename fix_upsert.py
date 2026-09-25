import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

old_logic = "await supabase.from('columnas').upsert([{ nombre: 'Cancelado', orden: 999 }], { onConflict: 'nombre' });"
new_logic = """const { data: colData } = await supabase.from('columnas').select('nombre').eq('nombre', 'Cancelado').single();
    if (!colData) {
      const { error: insErr } = await supabase.from('columnas').insert([{ nombre: 'Cancelado', orden: 999 }]);
      if (insErr) {
        setMsg({ text: 'Error creando estado: ' + insErr.message, type: 'error' });
        setConfirmDelete(false);
        return;
      }
    }"""

content = content.replace(old_logic, new_logic)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

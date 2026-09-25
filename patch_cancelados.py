import re

with open('src/components/Modals/CanceladosModal.jsx', 'r') as f:
    content = f.read()

# 1. Update fetchCancelados to only show 'Cancelado'
# It already does: .eq('estado', 'Cancelado')

# 2. Update executeDeleteBulk
bulk_old = """  const executeDeleteBulk = async (idsToDelete) => {
    const { error } = await supabase.from('proyectos').delete().in('id', idsToDelete);"""
bulk_new = """  const executeDeleteBulk = async (idsToDelete) => {
    await supabase.from('columnas').upsert([{ nombre: 'Cancelado_Oculto', orden: 1000 }], { onConflict: 'nombre' });
    const { error } = await supabase.from('proyectos').update({ estado: 'Cancelado_Oculto' }).in('id', idsToDelete);"""
content = content.replace(bulk_old, bulk_new)

# 3. Update executeDeleteSingle
single_old = """  const executeDeleteSingle = async (id, titulo) => {
    const { error } = await supabase.from('proyectos').delete().eq('id', id);"""
single_new = """  const executeDeleteSingle = async (id, titulo) => {
    await supabase.from('columnas').upsert([{ nombre: 'Cancelado_Oculto', orden: 1000 }], { onConflict: 'nombre' });
    const { error } = await supabase.from('proyectos').update({ estado: 'Cancelado_Oculto' }).eq('id', id);"""
content = content.replace(single_old, single_new)

# 4. Update handleRestore
restore_old = """  const handleRestore = async (id, titulo) => {
    const { error } = await supabase.from('proyectos').update({ estado: 'Pendiente' }).eq('id', id);"""
restore_new = """  const handleRestore = async (id, titulo) => {
    const { data: cols } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true }).limit(1);
    const firstCol = cols && cols.length > 0 ? cols[0].nombre : 'Pendiente';
    const { error } = await supabase.from('proyectos').update({ estado: firstCol, motivo_cancelacion: null }).eq('id', id);"""
content = content.replace(restore_old, restore_new)

with open('src/components/Modals/CanceladosModal.jsx', 'w') as f:
    f.write(content)

# 5. Patch Dashboard to include Cancelado_Oculto
with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    dash = f.read()
dash = dash.replace(".eq('estado', 'Cancelado')", ".in('estado', ['Cancelado', 'Cancelado_Oculto'])")
with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(dash)

# 6. Patch KanbanBoard to hide Cancelado_Oculto
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    kb = f.read()
kb = kb.replace(".filter(n => n !== 'Cancelado')", ".filter(n => n !== 'Cancelado' && n !== 'Cancelado_Oculto')")
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(kb)

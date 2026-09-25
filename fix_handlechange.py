with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

import re

old_hc = """  const handleChange = async (field, value) => {
    setProyecto(prev => ({ ...prev, [field]: value }));
    const { error } = await supabase.from('proyectos').update({ [field]: value }).eq('id', proyectoId);
    if (!error) {
      onProjectUpdated({ ...proyecto, [field]: value });
      logAudit(session, 'Editó campo de proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, campo: field, valor: value });
    }
  };"""

new_hc = """  const handleChange = async (field, value) => {
    let updates = { [field]: value };
    if (field === 'estado') {
       const isSpecial = value.toLowerCase().includes('espera') || value.toLowerCase().includes('pausa') || value === 'Archivado' || value === 'Cancelado';
       if (!isSpecial) updates.motivo_cancelacion = null;
    }
    setProyecto(prev => ({ ...prev, ...updates }));
    const { error } = await supabase.from('proyectos').update(updates).eq('id', proyectoId);
    if (!error) {
      onProjectUpdated({ ...proyecto, ...updates });
      logAudit(session, 'Editó campo de proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, campo: field, valor: value });
    }
  };"""

content = content.replace(old_hc, new_hc)
with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

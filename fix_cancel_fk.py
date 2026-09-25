with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

new_logic = """  const handleCancelProject = async () => {
    if (!cancelMotive.trim()) {
      setMsg({ text: 'Debes ingresar un motivo de cancelación', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    
    // Asegurarse de que el estado 'Cancelado' exista en la tabla columnas para evitar el error de Foreign Key
    await supabase.from('columnas').insert([{ nombre: 'Cancelado', orden: 999 }]).select('*').single();

    const { error } = await supabase.from('proyectos').update({ estado: 'Cancelado', motivo_cancelacion: cancelMotive }).eq('id', proyectoId);
    if (!error) {
      logAudit(session, 'Canceló proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, motivo: cancelMotive });
      onProjectDeleted(proyectoId);
      onClose();
    } else {
      console.error("Error al cancelar:", error);
      setMsg({ text: 'Error al cancelar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };"""

import re
content = re.sub(r'  const handleCancelProject = async \(\) => \{.*?\n  \};', new_logic.strip(), content, flags=re.DOTALL)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

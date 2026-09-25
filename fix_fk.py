import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

new_logic = """const handleCancelProject = async () => {
    if (!cancelMotive.trim()) {
      setMsg({ text: 'Debes ingresar un motivo de cancelación', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    
    // Asegurarse de que el estado 'Cancelado' exista en la tabla columnas para evitar el error de Foreign Key
    await supabase.from('columnas').upsert([{ nombre: 'Cancelado', orden: 999 }], { onConflict: 'nombre' });

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

content = re.sub(r'const handleCancelProject = async \(\) => \{.*?\n  \};', new_logic, content, flags=re.DOTALL)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Replace the broken else block in handleChange
old_else = """    } else {
      setConfirmArchive(false);
      setMsg({ text: 'Error al archivar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }"""

new_else = """    } else {
      const updates = { [field]: value, fecha_ultima_actualizacion: new Date().toISOString() };
      setProyecto(prev => ({ ...prev, ...updates }));
      const { error } = await supabase.from('proyectos').update(updates).eq('id', proyectoId);
      if (!error) {
        onProjectUpdated({ ...proyecto, ...updates });
        const fname = {
          titulo: 'título', cliente_nombre: 'persona de contacto', cliente_empresa: 'empresa/cliente',
          cliente_telefono: 'teléfono', notas: 'notas/descripción', presupuesto_aprobado: 'estado de presupuesto',
          materiales_comprados: 'estado de materiales', presupuesto_vendido: 'presupuesto vendido',
          costo_materiales: 'costo de materiales', costo_operativo: 'costo operativo', encargados: 'encargados'
        }[field] || field;
        if (field !== 'presupuesto_aprobado' && field !== 'materiales_comprados') {
          logAudit(session, `Actualizó ${fname} de proyecto`, { proyecto_id: proyectoId, titulo: proyecto.titulo });
        }
      } else {
        setMsg({ text: `Error al actualizar ${field}: ` + error.message, type: 'error' });
        setTimeout(() => setMsg({ text: '', type: '' }), 5000);
      }
    }"""

if old_else in content:
    content = content.replace(old_else, new_else)
else:
    print("WARNING: Old else block not found!")

# Add logAudit to handleAddComentario
old_add_comm = """    const { data, error } = await supabase.from('comentarios').insert([{
      proyecto_id: proyectoId,
      texto: finalString,
      autor_email: autorEmail
    }]).select();

    if (!error && data) {
      setComentarios([data[0], ...comentarios]);
      setNuevoComentario('');
      setReplyingTo(null);
    } else {"""

new_add_comm = """    const { data, error } = await supabase.from('comentarios').insert([{
      proyecto_id: proyectoId,
      texto: finalString,
      autor_email: autorEmail
    }]).select();

    if (!error && data) {
      setComentarios([data[0], ...comentarios]);
      setNuevoComentario('');
      setReplyingTo(null);
      logAudit(session, 'Añadió comentario a proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo });
    } else {"""

if old_add_comm in content:
    content = content.replace(old_add_comm, new_add_comm)
else:
    print("WARNING: old_add_comm not found!")

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

print("Patched ProjectDetailModal.jsx")
